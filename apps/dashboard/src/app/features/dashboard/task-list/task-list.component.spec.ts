import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../task.service';
import { TaskFormService } from '../task-form/task-form.service';
import { AuthRepository } from '../../../store/auth.repository';
import { AuthService } from '../../auth/auth.service';
import { TaskStatus, TaskPriority } from '../../../shared/models/task.model';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: jest.Mocked<Pick<TaskService, 'getTasks'>>;
  let user$: BehaviorSubject<any>;

  beforeEach(async () => {
    taskService = {
      getTasks: jest.fn().mockReturnValue(
        of({ tasks: [], total: 0, page: 1, limit: 10 })
      ),
    };
    user$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        { provide: TaskService, useValue: taskService },
        {
          provide: TaskFormService,
          useValue: { open: jest.fn() },
        },
        {
          provide: AuthRepository,
          useValue: { user$: user$.asObservable() },
        },
        {
          provide: AuthService,
          useValue: { getCurrentUser: jest.fn().mockReturnValue(of({})) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    expect(taskService.getTasks).toHaveBeenCalled();
  });

  it('should have empty tasks initially', () => {
    expect(component.tasks).toEqual([]);
    expect(component.filteredTasks).toEqual([]);
  });

  it('applySorting should set filteredTasks from tasks', () => {
    component.tasks = [
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
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    component.applySorting();
    expect(component.filteredTasks).toHaveLength(1);
    expect(component.filteredTasks[0].title).toBe('Task 1');
  });

  describe('viewer role', () => {
    beforeEach(() => {
      user$.next({ id: '1', email: 'v@test.com', roleName: 'viewer' });
      fixture = TestBed.createComponent(TaskListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set canDrag to false so drag-and-drop is disabled', () => {
      expect(component.canDrag).toBe(false);
    });

    it('should set canCreateTask to false', () => {
      expect(component.canCreateTask).toBe(false);
    });
  });

  describe('admin role', () => {
    beforeEach(() => {
      user$.next({ id: '2', email: 'a@test.com', roleName: 'admin' });
      fixture = TestBed.createComponent(TaskListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set canDrag to true so drag-and-drop is enabled', () => {
      expect(component.canDrag).toBe(true);
    });

    it('should set canCreateTask to true', () => {
      expect(component.canCreateTask).toBe(true);
    });
  });
});
