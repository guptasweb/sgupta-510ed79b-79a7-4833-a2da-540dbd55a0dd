import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { User } from '../auth/user.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User | undefined;

    if (!user) {
      return next.handle();
    }

    const method = request.method;
    const path = request.path ?? request.url?.split('?')[0] ?? request.url ?? '';
    const action = this.mapMethodToAction(method);
    const resource = this.extractResource(path);

    if (resource === 'audit-log' && action === 'read') {
      return next.handle();
    }

    const resourceId = this.extractResourceId(request);
    const details = this.buildDetails(request, method, path);

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService
            .logAction(user.id, action, resource, resourceId, details)
            .catch((error) => {
              this.logger.error(`Failed to log audit: ${error.message}`, error.stack);
            });
        },
        error: (error) => {
          const errorDetails = {
            ...details,
            error: error.message,
            statusCode: error.status || error.statusCode,
          };
          this.auditService
            .logAction(user.id, action, resource, resourceId, errorDetails)
            .catch((logError) => {
              this.logger.error(
                `Failed to log audit error: ${logError.message}`,
                logError.stack
              );
            });
        },
      })
    );
  }

  private mapMethodToAction(method: string): string {
    const methodMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return methodMap[method.toUpperCase()] || method.toLowerCase();
  }

  private extractResource(path: string): string {
    const parts = path.split('/').filter((part) => part && !part.startsWith(':'));
    return parts.length > 0 ? parts[parts.length - 1] : 'unknown';
  }

  private extractResourceId(request: Request): string | null {
    const params = request.params || {};
    const idFields = ['id', 'resourceId', 'taskId', 'userId', 'organizationId', 'roleId'];

    for (const field of idFields) {
      if (params[field]) {
        return params[field];
      }
    }

    return null;
  }

  private buildDetails(request: Request, method: string, path: string): Record<string, any> {
    const details: Record<string, any> = {
      method,
      path,
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('user-agent'),
    };

    if (method === 'GET') {
      if (Object.keys(request.query || {}).length > 0) {
        details.query = request.query;
      }
    } else {
      if (request.body && Object.keys(request.body).length > 0) {
        const sanitizedBody = this.sanitizeBody(request.body);
        details.body = sanitizedBody;
      }
    }

    return details;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
