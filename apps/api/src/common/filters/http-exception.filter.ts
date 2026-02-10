import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const GENERIC_ACCESS_DENIED_MESSAGE = 'Access denied';

/**
 * Normalized error response shape for all HTTP errors.
 * For 403/404 we return a generic message to avoid leaking "permission denied" vs "resource not found".
 */
export interface NormalizedErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : this.extractMessage(body);
      const error = this.getStatusText(status);

      // Avoid leaking permission denied vs resource not found; return 403 with generic message
      const normalized: NormalizedErrorResponse =
        status === HttpStatus.FORBIDDEN || status === HttpStatus.NOT_FOUND
          ? {
              statusCode: HttpStatus.FORBIDDEN,
              message: GENERIC_ACCESS_DENIED_MESSAGE,
              error: 'Forbidden',
            }
          : {
              statusCode: status,
              message,
              error,
            };

      response.status(normalized.statusCode).json(normalized);
      return;
    }

    // Log unexpected (non-HTTP) errors
    this.logger.error(
      `Unexpected error: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined
    );

    const normalized: NormalizedErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(normalized);
  }

  private extractMessage(body: string | object): string {
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const msg = (body as { message?: string | string[] }).message;
      return Array.isArray(msg) ? msg[0] ?? 'Unknown error' : (msg ?? 'Unknown error');
    }
    return 'Unknown error';
  }

  private getStatusText(status: number): string {
    const text = HttpStatus[status as keyof typeof HttpStatus];
    return typeof text === 'string' ? text : 'Error';
  }
}
