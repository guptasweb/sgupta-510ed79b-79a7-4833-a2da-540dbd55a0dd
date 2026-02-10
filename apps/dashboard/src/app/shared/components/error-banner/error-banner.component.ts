import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable error banner for API or validation errors.
 * Use in list views, forms, and any feature that shows error messages.
 */
@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="bg-[rgba(168,74,58,0.15)] border-2 border-accent-rust border-l-4 p-4 text-accent-rust font-mono text-sm">
      {{ message }}
    </div>
  `,
})
export class ErrorBannerComponent {
  @Input() message: string | null = null;
}
