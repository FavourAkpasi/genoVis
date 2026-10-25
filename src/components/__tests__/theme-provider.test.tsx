import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { matchMediaStub } from '@tests/integration/browser-stubs';

const ThemeName = () => <p>theme:{useTheme().theme}</p>;

const renderTheme = (props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) =>
  render(
    <ThemeProvider {...props}>
      <ThemeName />
      <input aria-label="field" />
    </ThemeProvider>
  );

const root = document.documentElement;

describe('ThemeProvider', () => {
  it('resolves "system" from the OS preference', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({ ...matchMediaStub(query), matches: true }));
    renderTheme();
    expect(screen.getByText('theme:system')).toBeInTheDocument();
    expect(root).toHaveClass('dark');
    vi.mocked(window.matchMedia).mockImplementation(matchMediaStub);
  });

  it('restores a stored theme', () => {
    localStorage.setItem('theme', 'dark');
    renderTheme();
    expect(screen.getByText('theme:dark')).toBeInTheDocument();
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem('theme', 'sepia');
    renderTheme({ defaultTheme: 'light' });
    expect(root).toHaveClass('light');
  });

  it('toggles with the "d" hotkey, but not while typing or with modifiers', async () => {
    const user = userEvent.setup();
    renderTheme({ disableTransitionOnChange: false });
    expect(root).toHaveClass('light'); // system → light (matchMedia stub reports no dark preference)

    await user.keyboard('d');
    expect(root).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await user.keyboard('d');
    expect(root).toHaveClass('light');

    await user.keyboard('{Control>}d{/Control}');
    expect(root).toHaveClass('light');

    await user.type(screen.getByRole('textbox', { name: 'field' }), 'd');
    expect(root).toHaveClass('light');

    await user.keyboard('x');
    expect(root).toHaveClass('light');
  });

  it('follows theme changes made in another tab', () => {
    renderTheme({ defaultTheme: 'light' });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark', storageArea: localStorage }));
    });
    expect(screen.getByText('theme:dark')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: null, storageArea: localStorage }));
    });
    expect(screen.getByText('theme:light')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'dark', storageArea: localStorage }));
    });
    expect(screen.getByText('theme:light')).toBeInTheDocument();
  });

  it('throws when useTheme is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within a ThemeProvider');
    vi.mocked(console.error).mockRestore();
  });
});
