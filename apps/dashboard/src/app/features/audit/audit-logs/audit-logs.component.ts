import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { AuditService } from '../audit.service';
import { AuditLog } from '../../../shared/models';
import { EmptyStateComponent, ErrorBannerComponent, LoadingIndicatorComponent } from '../../../shared/components';

export type AuditStatus = 'success' | 'warning' | 'failed';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    ErrorBannerComponent,
    LoadingIndicatorComponent,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  total = 0;
  page = 1;
  limit = 10;
  isLoading = false;
  errorMessage: string | null = null;

  private readonly avatarColors = [
    '#7d9d8a',
    '#a84a3a',
    '#2a7d7d',
    '#d4622a',
    '#6b7d4a',
  ];

  constructor(
    private readonly auditService: AuditService,
    private readonly titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Audit Logs');
    this.loadLogs();
  }

  get rangeStart(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const maxVisible = 5;
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, this.page - 2);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.auditService
      .getLogs({
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.logs = res.logs;
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message || err?.message || 'Failed to load audit logs';
          this.isLoading = false;
        },
      });
  }

  onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.loadLogs();
  }

  trackByLogId(_index: number, log: AuditLog): string {
    return log.id;
  }

  trackByPage(_index: number, p: number): number {
    return p;
  }

  getInitials(log: AuditLog): string {
    if (log.user) {
      const first = log.user.firstName?.charAt(0) || '';
      const last = log.user.lastName?.charAt(0) || '';
      if (first || last) return (first + last).toUpperCase();
      if (log.user.email) return log.user.email.slice(0, 2).toUpperCase();
    }
    return '??';
  }

  getAvatarColor(log: AuditLog): string {
    const id = log.user?.id || log.userId;
    const index = id ? [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0;
    return this.avatarColors[index % this.avatarColors.length];
  }

  getUserName(log: AuditLog): string {
    if (log.user) {
      const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ').trim();
      return name || log.user.email || log.userId;
    }
    return 'Unknown User';
  }

  getUserRole(_log: AuditLog): string {
    return '\u2013';
  }

  getActionType(log: AuditLog): string {
    const a = (log.action || '').toLowerCase();
    if (a.includes('login') || a.includes('auth')) return 'login';
    if (a.includes('delete') || a.includes('remove')) return 'deleted';
    if (a.includes('update') || a.includes('edit') || a.includes('upload')) return 'updated';
    if (a.includes('create') || a.includes('add')) return 'created';
    return 'updated';
  }

  getActionIcon(log: AuditLog): string {
    const type = this.getActionType(log);
    switch (type) {
      case 'login':
        return '&#8594;';
      case 'deleted':
        return '&#10005;';
      case 'created':
        return '&#43;';
      default:
        return '&#9679;';
    }
  }

  getActionLabel(log: AuditLog): string {
    const type = this.getActionType(log);
    const a = (log.action || '').toLowerCase();
    if (a.includes('login')) return 'Login';
    if (a.includes('delete') || a.includes('remove')) return 'Deleted';
    if (a.includes('update') || a.includes('edit') || a.includes('upload')) return 'Updated';
    if (a.includes('create') || a.includes('add')) return 'Created';
    return log.action || '\u2013';
  }

  getDetailsText(log: AuditLog): string {
    if (log.details) return log.details;
    if (log.resource) {
      return log.resourceId ? log.resource + ' ' + log.resourceId : log.resource;
    }
    return '\u2013';
  }

  getDetailsPill(log: AuditLog): string | null {
    if (!log.details && log.resource) return log.resource;
    const details = log.details || '';
    const match = details.match(/'([^']+)'|"([^"]+)"/);
    return match ? (match[1] || match[2]) : null;
  }

  getStatus(log: AuditLog): AuditStatus {
    const a = (log.action || '').toLowerCase();
    const d = (log.details || '').toLowerCase();
    if (a.includes('fail') || d.includes('fail') || d.includes('invalid')) return 'failed';
    if (a.includes('delete') || a.includes('remove')) return 'warning';
    return 'success';
  }

  getStatusIcon(status: AuditStatus): string {
    switch (status) {
      case 'success':
        return '\u2713';
      case 'warning':
        return '\u25B2';
      case 'failed':
        return 'X';
      default:
        return '\u2713';
    }
  }

  getStatusLabel(status: AuditStatus): string {
    switch (status) {
      case 'success':
        return 'SUCCESS';
      case 'warning':
        return 'WARNING';
      case 'failed':
        return 'FAILED';
      default:
        return 'SUCCESS';
    }
  }
}
