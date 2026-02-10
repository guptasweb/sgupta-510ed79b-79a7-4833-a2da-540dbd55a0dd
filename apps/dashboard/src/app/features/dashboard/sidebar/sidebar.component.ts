import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { AuthRepository } from '../../../store/auth.repository';
import { ThemeService } from '../../../core/services/theme.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  isCollapsed = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authRepository: AuthRepository,
    private authService: AuthService,
    public themeService: ThemeService
  ) {
    this.user$ = this.authRepository.user$;
  }

  ngOnInit(): void {
    this.authRepository.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (!user) return;
      const hasRoleName = user.roleName || (user.role && typeof user.role === 'object' && user.role.name);
      if (!hasRoleName) {
        this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe({ error: () => {} });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  canViewAuditLogs(user: User | null): boolean {
    const roleName = user?.roleName ?? user?.role?.name;
    if (!roleName) return false;
    const role = roleName.toLowerCase();
    return role === 'owner' || role === 'admin';
  }

  getInitials(user: User | null): string {
    if (!user) return '?';
    const first = (user.firstName || '').trim().charAt(0);
    const last = (user.lastName || '').trim().charAt(0);
    if (first || last) return (first + last).toUpperCase();
    return user.email?.slice(0, 2).toUpperCase() || '?';
  }

  getDisplayName(user: User | null): string {
    if (!user) return 'User';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    if (first || last) return `${first} ${last}`.trim();
    return user.email || 'User';
  }

  getRoleLabel(user: User | null): string {
    return user?.roleName || user?.role?.name || 'USER';
  }

  signOut(): void {
    this.authService.logout();
  }
}
