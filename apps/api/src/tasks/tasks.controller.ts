import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TaskResourceGuard } from './guards/task-resource.guard';
import { RequirePermissions, CurrentUser, Permissions } from '@task-management-system/auth';
import { User } from '../auth/user.entity';

@Controller('tasks')
@UseGuards(TaskResourceGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permissions.TASK_CREATE)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permissions.TASK_READ)
  async findAll(
    @Query() filterDto: FilterTaskDto,
    @CurrentUser() user: User
  ): Promise<{
    tasks: TaskResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.tasksService.findAll(filterDto, user);
  }

  @Get(':id')
  @RequirePermissions(Permissions.TASK_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permissions.TASK_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permissions.TASK_DELETE)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    return this.tasksService.delete(id, user);
  }

  @Patch(':id/reorder')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permissions.TASK_UPDATE)
  async reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reorderDto: ReorderTaskDto,
    @CurrentUser() user: User
  ): Promise<TaskResponseDto> {
    return this.tasksService.reorder(id, reorderDto, user);
  }
}
