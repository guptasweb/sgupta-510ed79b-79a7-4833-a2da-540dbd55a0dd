import { NgModule } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskFormComponent } from './task-form/task-form.component';

@NgModule({
  imports: [
    TaskListComponent,
    DashboardComponent,
    TaskFormComponent,
  ],
  exports: [TaskListComponent, DashboardComponent, TaskFormComponent],
})
export class DashboardModule {}
