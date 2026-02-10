import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map, filter, startWith } from 'rxjs/operators';
import { AuthRepository } from './store/auth.repository';
import { TaskFormService, TaskFormState } from './features/dashboard/task-form/task-form.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Dashboard';
  showSidebar$: Observable<boolean>;
  isAuthenticated$: Observable<boolean>;
  taskFormState$: Observable<TaskFormState>;
  taskFormState: TaskFormState = { open: false, task: null };
  private destroy$ = new Subject<void>();

  constructor(
    private authRepository: AuthRepository,
    public taskFormService: TaskFormService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authRepository.isAuthenticated$;
    this.taskFormState$ = this.taskFormService.getState();
    const url$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url)
    );
    this.showSidebar$ = combineLatest([
      this.isAuthenticated$,
      url$.pipe(map(url => !url.startsWith('/login')))
    ]).pipe(
      map(([authenticated, notOnLogin]) => authenticated && notOnLogin)
    );
  }

  ngOnInit(): void {
    this.taskFormState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.taskFormState = state;
        this.cdr.detectChanges();
      });

    // Close task form when user is not authenticated so the modal overlay
    // cannot persist after redirect to login (e.g. logout or session expiry).
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authenticated => {
        if (!authenticated) {
          this.taskFormService.close();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
