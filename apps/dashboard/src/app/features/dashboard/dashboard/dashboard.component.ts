import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../task.service';
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../../../shared/models/task.model';
import { User } from '../../../shared/models';
import { TaskFormService } from '../task-form/task-form.service';
import { AuthRepository } from '../../../store/auth.repository';
import { TasksRepository } from '../../../store/tasks.repository';
import { AuthService } from '../../auth/auth.service';

type SortField = 'status' | 'priority' | 'date';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  showFiltersDropdown = false;
  showSortDropdown = false;

  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  /** Single list of tasks after filters and sort (for display). */
  displayedTasks: Task[] = [];

  /** Kanban: one column per status. Keys are TaskStatus, values are Task[] (filtered/sorted). */
  tasksByStatus: Partial<Record<TaskStatus, Task[]>> = {};

  /** Column order for the board (matches allStatuses order). */
  statusColumns: TaskStatus[] = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.COMPLETED,
  ];

  /** Drop list ids for connecting columns (cdkDropListConnectedTo). Stable reference so CDK does not reset connections. */
  connectedColumnIds: string[] = [];

  /** Flag to suppress click handler after a drag operation. */
  private justDragged = false;

  /** Prevents double reorder requests and repeated loadTasks when drop fires or callbacks re-trigger. */
  private reorderInProgress = false;

  sortField: SortField | null = 'date';
  sortDirection: SortDirection = 'desc';

  categoryFilter: TaskCategory | '' = '';
  searchQuery = '';

  /** Multi-select filter state (pending = not yet applied in dropdown). */
  pendingStatusFilters = new Set<TaskStatus>();
  pendingPriorityFilters = new Set<TaskPriority>();
  appliedStatusFilters = new Set<TaskStatus>();
  appliedPriorityFilters = new Set<TaskPriority>();
  statusSectionExpanded = true;
  prioritySectionExpanded = true;

  readonly allStatuses: { value: TaskStatus; label: string; icon: string }[] = [
    { value: TaskStatus.PENDING, label: 'PENDING', icon: '\u25A1' },
    { value: TaskStatus.IN_PROGRESS, label: 'IN PROGRESS', icon: '\u26A1' },
    { value: TaskStatus.IN_REVIEW, label: 'IN REVIEW', icon: '\uD83D\uDC40' },
    { value: TaskStatus.COMPLETED, label: 'COMPLETED', icon: '\u2705' },
  ];
  readonly allPriorities: { value: TaskPriority; label: string; icon: string }[] = [
    { value: TaskPriority.HIGH, label: 'HIGH', icon: '\u25C6' },
    { value: TaskPriority.MEDIUM, label: 'MEDIUM', icon: '\u25C7' },
    { value: TaskPriority.LOW, label: 'LOW', icon: '\u25C7' },
  ];

  openMenuTaskId: string | null = null;

  readonly TaskStatus = TaskStatus;
  readonly TaskCategory = TaskCategory;
  readonly TaskPriority = TaskPriority;

  canCreateTask = false;
  /** False for viewer role so drag-and-drop is disabled. */
  canDrag = false;

  private destroy$ = new Subject<void>();
  /** Refetch when tab becomes visible so admin sees changes made by owner in another tab. */
  private wasTabHidden = false;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private taskFormService: TaskFormService,
    private authRepository: AuthRepository,
    private tasksRepository: TasksRepository,
    private authService: AuthService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Dashboard');
    this.errorMessage = '';
    this.connectedColumnIds = this.statusColumns.map((s) => this.getColumnId(s));
    this.tasksRepository.sort$.pipe(takeUntil(this.destroy$)).subscribe((sort) => {
      this.sortField = sort.sortField;
      this.sortDirection = sort.sortDirection;
      if (this.tasks.length > 0) {
        this.rebuildDisplayedTasks();
        this.cdr.markForCheck();
      }
    });
    this.tasksRepository.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      this.tasks = tasks;
      this.rebuildDisplayedTasks();
      this.cdr.markForCheck();
    });
    this.tasksRepository.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.isLoading = loading;
      this.cdr.markForCheck();
    });
    this.tasksRepository.error$.pipe(takeUntil(this.destroy$)).subscribe((err) => {
      this.errorMessage = err ?? '';
      this.cdr.markForCheck();
    });
    this.checkCreatePermission();
    this.loadTasks();
  }

  checkCreatePermission(): void {
    // Check if user has permission to create tasks and to drag (Viewer cannot create or drag)
    this.authRepository.user$.pipe(takeUntil(this.destroy$)).subscribe((user: any) => {
      if (!user) {
        this.canCreateTask = false;
        this.canDrag = false;
        return;
      }

      // Extract role name from user object (could be roleName or role.name)
      let roleName: string | undefined = user.roleName;
      if (!roleName && user.role && typeof user.role === 'object' && user.role.name) {
        roleName = user.role.name;
      }

      // If roleName is available, use it
      if (roleName) {
        const normalizedRoleName = roleName.toLowerCase();
        const canEdit = normalizedRoleName === 'owner' || normalizedRoleName === 'admin';
        this.canCreateTask = canEdit;
        this.canDrag = canEdit;
        this.cdr.detectChanges();
      } else {
        // If roleName is not available, fetch full profile to get it
        this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe({
          next: (fullUser: any) => {
            let fetchedRoleName = fullUser.roleName;
            if (!fetchedRoleName && fullUser.role && typeof fullUser.role === 'object' && fullUser.role.name) {
              fetchedRoleName = fullUser.role.name;
            }
            
            if (fetchedRoleName) {
              const normalizedRoleName = fetchedRoleName.toLowerCase();
              const canEdit = normalizedRoleName === 'owner' || normalizedRoleName === 'admin';
              this.canCreateTask = canEdit;
              this.canDrag = canEdit;
              this.cdr.detectChanges();
            } else {
              this.canCreateTask = true;
              this.canDrag = true;
              this.cdr.detectChanges();
            }
          },
          error: () => {
            this.canCreateTask = true;
            this.canDrag = true;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** No automatic refetch on tab focus – GET is only called on init and after user actions (reorder, filter, create, update). */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.wasTabHidden = true;
    } else {
      this.wasTabHidden = false;
    }
  }

  /**
   * Load tasks via store (effect calls API). Called on init and after filters change.
   */
  loadTasks(force = false): void {
    if (!force && this.isLoading) return;
    const filters: { category?: TaskCategory; search?: string } = {};
    if (this.categoryFilter) filters.category = this.categoryFilter as TaskCategory;
    if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();
    this.tasksRepository.loadTasksRequest({ filters, page: 1, limit: 100 });
  }

  /** Build single list and per-status columns from current filters.
   *  Kanban columns themselves are ordered by the persistent `order` field so drag-and-drop sticks. */
  rebuildDisplayedTasks(): void {
    // 1) Apply filters
    let source = this.tasks;
    if (this.appliedStatusFilters.size > 0 || this.appliedPriorityFilters.size > 0) {
      source = this.tasks.filter(
        (t) =>
          (this.appliedStatusFilters.size === 0 || this.appliedStatusFilters.has(t.status)) &&
          (this.appliedPriorityFilters.size === 0 || this.appliedPriorityFilters.has(t.priority))
      );
    }

    // 2) Compute a globally-sorted list for any list-style usages
    const sortedForList = [...source].sort((a, b) => this.compareTasks(a, b));
    this.displayedTasks = sortedForList;

    // 3) Build tasksByStatus for kanban columns.
    //    Columns are ordered purely by `order` so that drag-and-drop reordering is visible and stable.
    const byStatus: Partial<Record<TaskStatus, Task[]>> = {};
    for (const status of this.statusColumns) {
      const inStatus = source.filter((t) => t.status === status);
      byStatus[status] = inStatus.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    this.tasksByStatus = byStatus;
  }

  getColumnId(status: TaskStatus): string {
    return `column-${status}`;
  }

  getStatusFromColumnId(columnId: string): TaskStatus | null {
    if (!columnId.startsWith('column-')) return null;
    const status = columnId.slice('column-'.length) as TaskStatus;
    return this.statusColumns.includes(status) ? status : null;
  }

  /** Global index for reorder API: order of columns then position in column. */
  getGlobalIndex(status: TaskStatus, indexInColumn: number): number {
    let idx = 0;
    for (const s of this.statusColumns) {
      if (s === status) return idx + indexInColumn;
      idx += (this.tasksByStatus[s]?.length ?? 0);
    }
    return idx + indexInColumn;
  }

  private compareTasks(a: Task, b: Task): number {
    let comparison = 0;
    switch (this.sortField) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'priority': {
        const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }
      case 'status': {
        const statusOrder: Record<string, number> = {
          [TaskStatus.PENDING]: 1,
          [TaskStatus.IN_PROGRESS]: 2,
          [TaskStatus.IN_REVIEW]: 3,
          [TaskStatus.COMPLETED]: 4,
          [TaskStatus.ON_HOLD]: 5,
        };
        comparison = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
        break;
      }
      default:
        // When sort is cleared, default to date so list order is deterministic
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    if (comparison === 0) comparison = (a.order ?? 0) - (b.order ?? 0);
    return this.sortDirection === 'asc' ? comparison : -comparison;
  }

  setSort(field: SortField, direction: SortDirection): void {
    if (this.sortField === field && this.sortDirection === direction) {
      this.sortField = 'date';
      this.sortDirection = 'desc';
      this.tasksRepository.setSort('date', 'desc');
    } else {
      this.sortField = field;
      this.sortDirection = direction;
      this.tasksRepository.setSort(field, direction);
    }
    this.rebuildDisplayedTasks();
    this.showSortDropdown = false;
    this.cdr.markForCheck();
  }

  getSortPillLabel(): string {
    return this.sortField === 'date' ? 'Date created' : this.sortField === 'priority' ? 'Priority' : 'Status';
  }

  getSortPillArrow(): string {
    return this.sortDirection === 'asc' ? '\u2191' : '\u2193';
  }

  openCreateTaskForm(): void {
    this.taskFormService.open(null, {
      onCreated: () => this.loadTasks(),
      onUpdated: () => this.loadTasks(),
    });
  }

  openEditTaskForm(task: Task): void {
    this.closeMenu();
    this.taskFormService.open(task, {
      onCreated: () => this.loadTasks(),
      onUpdated: () => this.loadTasks(),
    });
  }

  onCategoryFilterChange(category: TaskCategory | ''): void {
    this.categoryFilter = category;
    this.loadTasks();
  }

  onSearchChange(): void {
    this.loadTasks();
  }

  toggleFiltersDropdown(): void {
    this.showFiltersDropdown = !this.showFiltersDropdown;
    if (this.showFiltersDropdown) {
      this.showSortDropdown = false;
      this.pendingStatusFilters = new Set(this.appliedStatusFilters);
      this.pendingPriorityFilters = new Set(this.appliedPriorityFilters);
    }
  }

  toggleStatusFilter(status: TaskStatus): void {
    if (this.pendingStatusFilters.has(status)) this.pendingStatusFilters.delete(status);
    else this.pendingStatusFilters.add(status);
    this.pendingStatusFilters = new Set(this.pendingStatusFilters);
  }

  togglePriorityFilter(priority: TaskPriority): void {
    if (this.pendingPriorityFilters.has(priority)) this.pendingPriorityFilters.delete(priority);
    else this.pendingPriorityFilters.add(priority);
    this.pendingPriorityFilters = new Set(this.pendingPriorityFilters);
  }

  clearAllPanelFilters(): void {
    this.pendingStatusFilters.clear();
    this.pendingPriorityFilters.clear();
  }

  applyPanelFilters(): void {
    this.appliedStatusFilters = new Set(this.pendingStatusFilters);
    this.appliedPriorityFilters = new Set(this.pendingPriorityFilters);
    this.showFiltersDropdown = false;
    this.rebuildDisplayedTasks();
    this.cdr.markForCheck();
  }

  cancelFiltersDropdown(): void {
    this.showFiltersDropdown = false;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.appliedStatusFilters.clear();
    this.appliedPriorityFilters.clear();
    this.pendingStatusFilters.clear();
    this.pendingPriorityFilters.clear();
    this.categoryFilter = '';
    this.searchQuery = '';
    this.loadTasks();
  }

  getCategoryBadgeClass(category: TaskCategory | null): string {
    const base = 'px-2 py-0.5 text-xs font-bold uppercase tracking-wider border font-mono';
    if (!category) return `${base} bg-[rgba(212,98,42,0.2)] text-accent-burnt border-accent-burnt`;
    if (category === TaskCategory.WORK) return `${base} bg-[rgba(212,98,42,0.2)] text-accent-burnt border-accent-burnt`;
    return `${base} bg-[rgba(42,125,125,0.2)] text-accent-teal border-accent-teal`;
  }

  /** Color-only classes for category badge on task card (same shape as priority badge). */
  getCategoryBadgeColorClass(category: TaskCategory | null): string {
    if (!category || category === TaskCategory.WORK) return 'bg-[rgba(212,98,42,0.25)] text-accent-burnt border-accent-burnt';
    return 'bg-[rgba(42,125,125,0.25)] text-accent-teal border-accent-teal';
  }

  getCategoryLabel(category: TaskCategory | null): string {
    if (!category || category === TaskCategory.WORK) return 'WORK';
    return 'PERSONAL';
  }

  /** Color-only classes for status badge (same shape as task-card-work-button). */
  getStatusBadgeColorClass(status: TaskStatus): string {
    if (status === TaskStatus.PENDING) return 'bg-[rgba(212,98,42,0.25)] text-accent-burnt border-accent-burnt';
    if (status === TaskStatus.IN_PROGRESS) return 'bg-[rgba(212,165,66,0.25)] text-accent-amber border-accent-amber';
    if (status === TaskStatus.IN_REVIEW) return 'bg-[rgba(168,130,58,0.25)] text-[#c9a84c] border-[#c9a84c]';
    if (status === TaskStatus.COMPLETED) return 'bg-[rgba(42,125,125,0.25)] text-accent-teal border-accent-teal';
    if (status === TaskStatus.ON_HOLD) return 'bg-[rgba(91,138,154,0.25)] text-[#5b8a9a] border-[#5b8a9a]';
    return 'bg-[rgba(212,98,42,0.25)] text-accent-burnt border-accent-burnt';
  }

  getStatusDisplayLabel(status: TaskStatus): string {
    if (status === TaskStatus.PENDING) return 'Pending';
    if (status === TaskStatus.IN_PROGRESS) return 'In Progress';
    if (status === TaskStatus.IN_REVIEW) return 'In Review';
    if (status === TaskStatus.COMPLETED) return 'Completed';
    if (status === TaskStatus.ON_HOLD) return 'On Hold';
    return String(status);
  }

  /** Color-only classes for priority badge (same shape as status badge). */
  getPriorityBadgeColorClass(priority: TaskPriority): string {
    if (priority === TaskPriority.HIGH) return 'bg-[rgba(168,74,58,0.25)] text-accent-rust border-accent-rust';
    if (priority === TaskPriority.MEDIUM) return 'bg-[rgba(212,165,66,0.25)] text-accent-amber border-accent-amber';
    return 'bg-[rgba(42,125,125,0.25)] text-accent-teal border-accent-teal';
  }

  getPriorityIndicatorClass(priority: TaskPriority): string {
    const base = 'w-2.5 h-2.5 border-2 flex-shrink-0';
    if (priority === TaskPriority.HIGH) return `${base} bg-accent-rust border-accent-rust`;
    if (priority === TaskPriority.MEDIUM) return `${base} bg-accent-amber border-accent-amber`;
    return `${base} bg-accent-teal border-accent-teal`;
  }

  getPriorityLabel(priority: TaskPriority): string {
    if (priority === TaskPriority.HIGH) return 'High';
    if (priority === TaskPriority.MEDIUM) return 'Medium';
    return 'Low';
  }

  getCreatorDisplayName(task: Task): string {
    if (task.ownerFirstName != null || task.ownerLastName != null) {
      return [task.ownerFirstName, task.ownerLastName].filter(Boolean).join(' ').trim() || '—';
    }
    if (task.ownerEmail) return task.ownerEmail;
    return '—';
  }

  // Menu management
  toggleMenu(taskId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuTaskId = this.openMenuTaskId === taskId ? null : taskId;
  }

  closeMenu(): void {
    this.openMenuTaskId = null;
  }

  deleteTaskInline(task: Task, event: Event): void {
    event.stopPropagation();
    this.closeMenu();

    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService
        .deleteTask(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.tasksRepository.deleteTaskSuccess(task.id),
          error: (err) => {
            this.errorMessage = err.message || 'Failed to delete task';
          },
        });
    }
  }

  /** Handle drag-and-drop: reorder within column or move between columns (change status). */
  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    this.justDragged = true;
    setTimeout(() => (this.justDragged = false), 100);

    if (this.reorderInProgress) return;

    const prevId = event.previousContainer.id;
    const currId = event.container.id;
    const prevStatus = this.getStatusFromColumnId(prevId);
    const currStatus = this.getStatusFromColumnId(currId);
    if (prevStatus == null || currStatus == null) return;

    const prevList = event.previousContainer.data;
    const currList = event.container.data;
    const task = prevList[event.previousIndex];
    if (!task) return;

    const previousIndex = event.previousIndex;
    const targetIndex = event.currentIndex;
    if (event.previousContainer === event.container) {
      if (previousIndex === targetIndex) return;
      moveItemInArray(currList, previousIndex, targetIndex);
    } else {
      transferArrayItem(prevList, currList, previousIndex, targetIndex);
    }

    this.reorderInProgress = true;
    const onDone = () => {
      this.reorderInProgress = false;
    };
    // currList is already in the correct order after moveItemInArray/transferArrayItem.
    // Sync every task in this column to order = index so the displaced task gets the right order too.
    const applyResponse = (_updated: Task) => {
      const updatedColumnTasks = currList.map((item, idx) => ({ ...item, order: idx }));
      this.tasksRepository.updateTasksSuccess(updatedColumnTasks);
      this.tasks = this.tasks.map((t) => {
        if (t.status !== currStatus) return t;
        const idx = currList.findIndex((item) => item.id === t.id);
        if (idx === -1) return t;
        return { ...t, order: idx };
      });
      this.rebuildDisplayedTasks();
      this.cdr.markForCheck();
    };

    if (event.previousContainer === event.container) {
      this.taskService.reorderTask(task.id, targetIndex, previousIndex).subscribe({
        next: (updated) => {
          applyResponse(updated);
          onDone();
        },
        error: () => {
          this.loadTasks(true);
          onDone();
        },
      });
    } else {
      this.taskService.updateTask(task.id, { status: currStatus }).subscribe({
        next: () => {
          this.taskService.reorderTask(task.id, targetIndex, previousIndex).subscribe({
            next: (updated) => {
              applyResponse(updated);
              onDone();
            },
            error: () => {
              this.loadTasks(true);
              onDone();
            },
          });
        },
        error: () => {
          this.loadTasks(true);
          onDone();
        },
      });
    }
  }

  /** Click handler that suppresses edit modal when a drag just happened. Viewers cannot open edit. */
  onCardClick(task: Task): void {
    if (this.justDragged || !this.canDrag) return;
    this.openEditTaskForm(task);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.openMenuTaskId && !target.closest('.task-card-menu-container')) {
      this.closeMenu();
    }
    if (this.showSortDropdown && !target.closest('.dashboard-sort-container')) {
      this.showSortDropdown = false;
    }
    if (this.showFiltersDropdown && !target.closest('.dashboard-filters-container')) {
      this.showFiltersDropdown = false;
      this.cdr.markForCheck();
    }
  }
}
