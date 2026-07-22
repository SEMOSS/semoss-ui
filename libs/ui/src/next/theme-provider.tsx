import {
	createContext,
	startTransition,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";

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
	/** Resolved theme currently applied to the document */
	resolvedTheme: Exclude<Theme, "system">;
	/** Function to update the theme and persist to storage */
	setTheme: (theme: Theme) => void;
};

/**
 * Initial state for the theme context
 * Provides fallback values before the provider is mounted
 */
const initialState: ThemeProviderState = {
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => null,
};

/**
 * React context for theme management
 * Provides theme state and setter throughout the component tree
 */
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const THEME_VALUES = new Set<Theme>(["dark", "light", "system"]);
const THEME_CHANGE_EVENT = "smss-theme-change";
const DISABLE_TRANSITIONS_STYLE_ID = "smss-disable-theme-transitions";
let transitionResetFrame: number | null = null;

const isTheme = (value: string | null): value is Theme =>
	value !== null && THEME_VALUES.has(value as Theme);

const getSystemTheme = (): Exclude<Theme, "system"> => {
	if (typeof window === "undefined") {
		return "light";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const getStoredTheme = (storageKey: string, defaultTheme: Theme): Theme => {
	if (typeof window === "undefined") {
		return defaultTheme;
	}

	const storedTheme = localStorage.getItem(storageKey);
	return isTheme(storedTheme) ? storedTheme : defaultTheme;
};

const resolveTheme = (theme: Theme): Exclude<Theme, "system"> =>
	theme === "system" ? getSystemTheme() : theme;

const temporarilyDisableThemeTransitions = () => {
	if (typeof document === "undefined" || typeof window === "undefined") {
		return;
	}

	if (!document.getElementById(DISABLE_TRANSITIONS_STYLE_ID)) {
		const style = document.createElement("style");
		style.id = DISABLE_TRANSITIONS_STYLE_ID;
		style.appendChild(
			document.createTextNode(
				"*, *::before, *::after { transition: none !important; animation: none !important; }",
			),
		);
		document.head.appendChild(style);
	}

	if (transitionResetFrame !== null) {
		window.cancelAnimationFrame(transitionResetFrame);
	}

	transitionResetFrame = window.requestAnimationFrame(() => {
		transitionResetFrame = window.requestAnimationFrame(() => {
			document.getElementById(DISABLE_TRANSITIONS_STYLE_ID)?.remove();
			transitionResetFrame = null;
		});
	});
};

const applyDocumentTheme = (theme: Exclude<Theme, "system">) => {
	if (typeof document === "undefined") {
		return;
	}

	const root = document.documentElement;
	const previousTheme = root.classList.contains("dark") ? "dark" : "light";
	const isThemeAlreadyApplied = root.classList.contains(theme);

	if (isThemeAlreadyApplied) {
		root.style.colorScheme = theme;
		return;
	}

	temporarilyDisableThemeTransitions();

	root.classList.remove("light", "dark");
	root.classList.add(theme);
	root.style.colorScheme = theme;

	if (previousTheme !== theme && typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }),
		);
	}
};

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
}: ThemeProviderProps) {
	/**
	 * Initialize theme from localStorage or fall back to defaultTheme
	 * Uses lazy initialization to avoid hydration mismatches in SSR
	 */
	const [theme, setThemeState] = useState<Theme>(() =>
		getStoredTheme(storageKey, defaultTheme),
	);
	const [systemTheme, setSystemTheme] =
		useState<Exclude<Theme, "system">>(getSystemTheme);
	const resolvedTheme = theme === "system" ? systemTheme : theme;

	/**
	 * Effect to apply theme classes to document root
	 * Handles system theme detection and class management
	 */
	useLayoutEffect(() => {
		applyDocumentTheme(resolvedTheme);
	}, [resolvedTheme]);

	useEffect(() => {
		if (theme !== "system") {
			return;
		}

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const updateSystemTheme = () => {
			setSystemTheme(mediaQuery.matches ? "dark" : "light");
		};

		updateSystemTheme();

		mediaQuery.addEventListener("change", updateSystemTheme);

		return () => {
			mediaQuery.removeEventListener("change", updateSystemTheme);
		};
	}, [theme]);

	/**
	 * Context value containing current theme and setter
	 * The setter automatically persists changes to localStorage
	 */
	const setTheme = useCallback(
		(nextTheme: Theme) => {
			if (typeof window !== "undefined") {
				localStorage.setItem(storageKey, nextTheme);
			}

			applyDocumentTheme(resolveTheme(nextTheme));
			startTransition(() => {
				setThemeState((currentTheme) =>
					currentTheme === nextTheme ? currentTheme : nextTheme,
				);
			});
		},
		[storageKey],
	);

	const value = useMemo(
		() => ({
			theme,
			resolvedTheme,
			setTheme,
		}),
		[resolvedTheme, setTheme, theme],
	);

	return (
		<ThemeProviderContext.Provider value={value}>
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
