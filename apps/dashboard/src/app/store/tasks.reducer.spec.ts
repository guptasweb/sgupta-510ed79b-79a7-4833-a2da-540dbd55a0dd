import { tasksReducer, TasksState, initialState } from './tasks.reducer';
import * as TasksActions from './tasks.actions';
import { TaskStatus, TaskCategory, TaskPriority } from '../shared/models/task.model';

describe('tasksReducer', () => {
  const baseState: TasksState = {
    tasks: [],
    loading: false,
    error: null,
    filters: {},
  };

  it('should return initial state', () => {
    const state = tasksReducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
  });

  it('should set loading on loadTasksRequest', () => {
    const state = tasksReducer(baseState, TasksActions.loadTasksRequest());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set tasks and clear loading on loadTasksSuccess', () => {
    const tasks = [
      {
        id: 't1',
        title: 'Task 1',
        description: null,
        status: TaskStatus.PENDING,
        category: null,
        priority: TaskPriority.MEDIUM,
        order: 0,
        ownerId: 'u1',
        organizationId: 'o1',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const state = tasksReducer(
      { ...baseState, loading: true },
      TasksActions.loadTasksSuccess({ tasks })
    );
    expect(state.tasks).toEqual(tasks);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set error on loadTasksFailure', () => {
    const state = tasksReducer(
      { ...baseState, loading: true },
      TasksActions.loadTasksFailure({ error: 'Load failed' })
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Load failed');
  });

  it('should add task on createTaskSuccess', () => {
    const task = {
      id: 't1',
      title: 'New',
      description: null,
      status: TaskStatus.PENDING,
      category: null,
      priority: TaskPriority.MEDIUM,
      order: 0,
      ownerId: 'u1',
      organizationId: 'o1',
      createdAt: '',
      updatedAt: '',
    };
    const state = tasksReducer(baseState, TasksActions.createTaskSuccess({ task }));
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0]).toEqual(task);
  });

  it('should update task on updateTaskSuccess', () => {
    const existing = {
      id: 't1',
      title: 'Old',
      description: null,
      status: TaskStatus.PENDING,
      category: null,
      priority: TaskPriority.MEDIUM,
      order: 0,
      ownerId: 'u1',
      organizationId: 'o1',
      createdAt: '',
      updatedAt: '',
    };
    const updated = { ...existing, title: 'Updated' };
    const state = tasksReducer(
      { ...baseState, tasks: [existing] },
      TasksActions.updateTaskSuccess({ task: updated })
    );
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].title).toBe('Updated');
  });

  it('should remove task on deleteTaskSuccess', () => {
    const task = {
      id: 't1',
      title: 'T',
      description: null,
      status: TaskStatus.PENDING,
      category: null,
      priority: TaskPriority.MEDIUM,
      order: 0,
      ownerId: 'u1',
      organizationId: 'o1',
      createdAt: '',
      updatedAt: '',
    };
    const state = tasksReducer(
      { ...baseState, tasks: [task] },
      TasksActions.deleteTaskSuccess({ taskId: 't1' })
    );
    expect(state.tasks).toHaveLength(0);
  });

  it('should merge filters on setFilters', () => {
    const state = tasksReducer(
      { ...baseState, filters: { status: TaskStatus.PENDING } },
      TasksActions.setFilters({ filters: { category: TaskCategory.WORK } })
    );
    expect(state.filters).toEqual({ status: TaskStatus.PENDING, category: TaskCategory.WORK });
  });

  it('should clear filters on clearFilters', () => {
    const state = tasksReducer(
      { ...baseState, filters: { status: TaskStatus.PENDING } },
      TasksActions.clearFilters()
    );
    expect(state.filters).toEqual({});
  });

  it('should reset to initial state on clearTasks', () => {
    const state = tasksReducer(
      { ...baseState, tasks: [{} as any], error: 'err' },
      TasksActions.clearTasks()
    );
    expect(state).toEqual(initialState);
  });
});
