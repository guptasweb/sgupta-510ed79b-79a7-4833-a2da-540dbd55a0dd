import {
  selectTasksState,
  selectTasks,
  selectTasksLoading,
  selectTasksError,
  selectTasksFilters,
  selectTaskListSort,
} from './tasks.selectors';
import { TasksState } from './tasks.reducer';
import { TaskStatus, TaskPriority } from '../shared/models/task.model';

describe('tasksSelectors', () => {
  const initialState: TasksState = {
    tasks: [
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
    ],
    loading: true,
    error: 'Failed',
    filters: { status: TaskStatus.PENDING },
    sort: { sortField: 'date', sortDirection: 'desc' },
    totalTasks: 1,
    page: 1,
    limit: 10,
  };

  it('selectTasksState should return tasks state', () => {
    expect(selectTasksState.projector(initialState)).toEqual(initialState);
  });

  it('selectTasks should return tasks', () => {
    expect(selectTasks.projector(initialState)).toEqual(initialState.tasks);
  });

  it('selectTasksLoading should return loading', () => {
    expect(selectTasksLoading.projector(initialState)).toBe(true);
  });

  it('selectTasksError should return error', () => {
    expect(selectTasksError.projector(initialState)).toBe('Failed');
  });

  it('selectTasksFilters should return filters', () => {
    expect(selectTasksFilters.projector(initialState)).toEqual({ status: TaskStatus.PENDING });
  });

  it('selectTaskListSort should return sort', () => {
    expect(selectTaskListSort.projector(initialState)).toEqual({
      sortField: 'date',
      sortDirection: 'desc',
    });
  });
});
