import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TasksService } from '../tasks.service';

const ACCESS_DENIED_MESSAGE = 'Access denied';

/**
 * Resolves the task resource for :id routes and sets request.organizationId to the task's
 * organization. PermissionsGuard can then enforce hasOrganizationAccess against the actual
 * resource org instead of only explicit params/query/body. For routes without params.id, no-op.
 * Returns 403 with generic message when task is missing to avoid leaking resource existence.
 */
@Injectable()
export class TaskResourceGuard implements CanActivate {
  constructor(private readonly tasksService: TasksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const taskId = request.params?.id;

    if (!taskId) {
      return true;
    }

    const organizationId = await this.tasksService.getOrganizationIdByTaskId(taskId);
    if (organizationId === null) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    request.organizationId = organizationId;
    return true;
  }
}
