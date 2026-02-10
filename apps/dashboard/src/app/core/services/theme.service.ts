import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'taskflow-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeMode>(this.getStoredTheme());
  currentTheme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
    this.applyTheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  private getStoredTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      /* ignore */
    }
    return 'dark';
  }

  private applyTheme(mode: ThemeMode): void {
    const doc = typeof document !== 'undefined' ? document : null;
    if (!doc?.documentElement) return;
    doc.documentElement.classList.remove('theme-light', 'theme-dark');
    doc.documentElement.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
  }
}
