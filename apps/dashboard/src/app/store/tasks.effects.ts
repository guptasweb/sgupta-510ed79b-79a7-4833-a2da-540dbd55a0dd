import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { TaskService } from '../features/dashboard/task.service';
import { AppState } from './index';
import * as TasksActions from './tasks.actions';
import * as TasksSelectors from './tasks.selectors';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private taskService = inject(TaskService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasksRequest),
      withLatestFrom(this.store.select(TasksSelectors.selectTasksFilters)),
      switchMap(([action, storeFilters]) => {
        const filters = action.filters ?? storeFilters;
        const page = action.page ?? 1;
        const limit = action.limit ?? 10;
        return this.taskService.getTasks(filters, page, limit).pipe(
          map((res) =>
            TasksActions.loadTasksSuccess({
              tasks: res.tasks,
              total: res.total,
              page: res.page,
              limit: res.limit,
            })
          ),
          catchError((err) =>
            of(TasksActions.loadTasksFailure({ error: err.message || 'Failed to load tasks' }))
          )
        );
      })
    )
  );
}
