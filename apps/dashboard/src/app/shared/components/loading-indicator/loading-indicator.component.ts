import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable loading state for list views and async operations.
 */
@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center py-12">
      <p class="text-text-secondary font-mono text-sm uppercase tracking-wider">{{ message }}</p>
    </div>
  `,
})
export class LoadingIndicatorComponent {
  @Input() message = 'Loading...';
}
