import {Moon, Sun} from 'lucide-react';
import {Theme, useTheme} from 'remix-themes';

import {Toggle} from '~/components/ui/toggle';

export function ModeToggle() {
  const [theme, setTheme] = useTheme();

  // Determine if dark mode is active (handle null theme as light)
  const isDark = theme === Theme.DARK;

  const handleToggle = (pressed: boolean) => {
    // Always explicitly set the theme, never null
    const newTheme = pressed ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
  };

  return (
    <Toggle
      variant="default"
      size="default"
      pressed={isDark}
      onPressedChange={handleToggle}
      aria-label="Toggle theme"
      className="size-9 hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground"
      suppressHydrationWarning
    >
      <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Toggle>
  );
}
