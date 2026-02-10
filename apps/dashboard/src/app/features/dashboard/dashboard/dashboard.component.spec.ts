import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { TaskService } from '../task.service';
import { TaskFormService } from '../task-form/task-form.service';
import { AuthRepository } from '../../../store/auth.repository';
import { AuthService } from '../../auth/auth.service';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models/task.model';

const mockTask: Task = {
  id: 't1',
  title: 'Test Task',
  description: null,
  status: TaskStatus.PENDING,
  category: null,
  priority: TaskPriority.MEDIUM,
  order: 0,
  ownerId: 'u1',
  organizationId: 'o1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let taskFormService: jest.Mocked<Pick<TaskFormService, 'open'>>;
  let user$: BehaviorSubject<any>;

  beforeEach(async () => {
    taskFormService = { open: jest.fn() };
    user$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: TaskService,
          useValue: {
            getTasks: jest.fn().mockReturnValue(of({ tasks: [], total: 0, page: 1, limit: 10 })),
            reorderTask: jest.fn().mockReturnValue(of(null)),
            updateTask: jest.fn().mockReturnValue(of(mockTask)),
            deleteTask: jest.fn().mockReturnValue(of(undefined)),
          },
        },
        { provide: TaskFormService, useValue: taskFormService },
        { provide: AuthRepository, useValue: { user$: user$.asObservable() } },
        { provide: AuthService, useValue: { getCurrentUser: jest.fn().mockReturnValue(of({})) } },
        { provide: Title, useValue: { setTitle: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('viewer role', () => {
    beforeEach(() => {
      user$.next({ id: '1', email: 'viewer@test.com', roleName: 'viewer' });
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set canDrag to false so drag-and-drop is disabled', () => {
      expect(component.canDrag).toBe(false);
    });

    it('should set canCreateTask to false', () => {
      expect(component.canCreateTask).toBe(false);
    });

    it('should not open edit modal when card is clicked (onCardClick)', () => {
      component.onCardClick(mockTask);
      expect(taskFormService.open).not.toHaveBeenCalled();
    });
  });

  describe('admin role', () => {
    beforeEach(() => {
      user$.next({ id: '2', email: 'admin@test.com', roleName: 'admin' });
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set canDrag to true so drag-and-drop is enabled', () => {
      expect(component.canDrag).toBe(true);
    });

    it('should open edit modal when card is clicked (onCardClick)', () => {
      component.onCardClick(mockTask);
      expect(taskFormService.open).toHaveBeenCalledWith(mockTask, expect.any(Object));
    });
  });
});
