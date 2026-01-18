import { createContext, useContext, useEffect, useState } from "react";

/**
 * Available theme options for the application
 * - "dark": Force dark theme
 * - "light": Force light theme
 * - "system": Follow system preference (auto-detect)
 */
export type Theme = "dark" | "light" | "system";

/**
 * Props for the ThemeProvider component
 */
type ThemeProviderProps = {
	/** React children to be wrapped with theme context */
	children: React.ReactNode;
	/** Default theme to use when no stored preference exists */
	defaultTheme?: Theme;
	/** LocalStorage key for persisting theme preference */
	storageKey?: string;
};

/**
 * Shape of the theme context state
 */
type ThemeProviderState = {
	/** Current active theme */
	theme: Theme;
	/** Function to update the theme and persist to storage */
	setTheme: (theme: Theme) => void;
};

/**
 * Initial state for the theme context
 * Provides fallback values before the provider is mounted
 */
const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

/**
 * React context for theme management
 * Provides theme state and setter throughout the component tree
 */
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * ThemeProvider component that manages theme state and persistence
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Supports system theme detection
 * - Automatically applies theme classes to document root
 * - Provides theme context to child components
 *
 * @param children - React nodes to wrap with theme context
 * @param defaultTheme - Initial theme when no stored preference exists (default: "system")
 * @param storageKey - LocalStorage key for theme persistence (default: "vite-ui-theme")
 */
export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
	...props
}: ThemeProviderProps) {
	/**
	 * Initialize theme from localStorage or fall back to defaultTheme
	 * Uses lazy initialization to avoid hydration mismatches in SSR
	 */
	const [theme, setTheme] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
	);

	/**
	 * Effect to apply theme classes to document root
	 * Handles system theme detection and class management
	 */
	useEffect(() => {
		const root = window.document.documentElement;

		// Clean up previous theme classes
		root.classList.remove("light", "dark");

		if (theme === "system") {
			// Detect system theme preference
			const systemTheme = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			return;
		}

		// Apply the explicitly set theme
		root.classList.add(theme);
	}, [theme]);

	/**
	 * Context value containing current theme and setter
	 * The setter automatically persists changes to localStorage
	 */
	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

/**
 * Hook to access theme context
 *
 * Must be used within a ThemeProvider component tree
 * Provides access to current theme and theme setter function
 *
 * @returns {ThemeProviderState} Object containing current theme and setTheme function
 * @throws {Error} When used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme (current: {theme})
 *     </button>
 *   );
 * }
 * ```
 */
export const useTheme = (): ThemeProviderState => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
