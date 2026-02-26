'use client';

export function ManagePrefsButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined' && (window as any).__hlOpenCookiePrefs) {
          (window as any).__hlOpenCookiePrefs();
        }
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
    >
      Manage Cookie Preferences
    </button>
  );
}
