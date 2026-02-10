import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskItemComponent } from './task-item.component';
import { TaskService } from '../task.service';
import { TaskStatus, TaskPriority } from '../../../shared/models/task.model';

const mockTask = {
  id: 't1',
  title: 'Test Task',
  description: 'Description',
  status: TaskStatus.PENDING,
  category: null,
  priority: TaskPriority.MEDIUM,
  order: 0,
  ownerId: 'u1',
  organizationId: 'o1',
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
};

describe('TaskItemComponent', () => {
  let component: TaskItemComponent;
  let fixture: ComponentFixture<TaskItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskItemComponent],
      providers: [
        { provide: TaskService, useValue: { deleteTask: jest.fn(), updateTask: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskItemComponent);
    component = fixture.componentInstance;
    component.task = mockTask as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Edit and Delete buttons when canEdit is true (default)', () => {
    component.canEdit = true;
    fixture.detectChanges();
    const editBtn = fixture.nativeElement.querySelector('button[title="Edit task (E)"]');
    const deleteBtn = fixture.nativeElement.querySelector('button[title="Delete task (Delete)"]');
    expect(editBtn).toBeTruthy();
    expect(deleteBtn).toBeTruthy();
  });

  it('should hide Edit and Delete buttons when canEdit is false (viewer)', () => {
    component.canEdit = false;
    fixture.detectChanges();
    const editBtn = fixture.nativeElement.querySelector('button[title="Edit task (E)"]');
    const deleteBtn = fixture.nativeElement.querySelector('button[title="Delete task (Delete)"]');
    expect(editBtn).toBeFalsy();
    expect(deleteBtn).toBeFalsy();
  });

  it('should not emit taskEdited on E key when canEdit is false', () => {
    component.canEdit = false;
    const spy = jest.spyOn(component.taskEdited, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
    Object.defineProperty(event, 'key', { value: 'e' });
    component.onCardKeydown(event as KeyboardEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit taskEdited on E key when canEdit is true', () => {
    component.canEdit = true;
    const spy = jest.spyOn(component.taskEdited, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
    Object.defineProperty(event, 'key', { value: 'e' });
    component.onCardKeydown(event as KeyboardEvent);
    expect(spy).toHaveBeenCalledWith(component.task);
  });

  it('should not open delete confirm on Delete key when canEdit is false', () => {
    component.canEdit = false;
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    Object.defineProperty(event, 'key', { value: 'Delete' });
    component.onCardKeydown(event as KeyboardEvent);
    expect(component.showDeleteConfirm).toBe(false);
  });

  it('should set showDeleteConfirm on Delete key when canEdit is true', () => {
    component.canEdit = true;
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    Object.defineProperty(event, 'key', { value: 'Delete' });
    component.onCardKeydown(event as KeyboardEvent);
    expect(component.showDeleteConfirm).toBe(true);
  });
});
