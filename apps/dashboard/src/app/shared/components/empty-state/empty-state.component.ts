import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable empty state for lists (tasks, audit logs, etc.).
 * Use when there is no data to display.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center py-12 bg-glass-warm backdrop-blur-retro border-2 border-glass-border p-8">
      <p class="text-text-secondary font-mono text-sm uppercase tracking-wider">{{ message }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() message = 'No data found';
}
