import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@semoss/ui/next";
import { refreshCatalogImage, useCatalogImageUrl } from "./use-catalog-image";

const storageKey = "catalog-image-theme-test";
let mediaQuery: MediaQueryList;

/** Exercise the shared theme provider, including system preference changes. */
function ThemeWrapper({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider defaultTheme="light" storageKey={storageKey}>
			{children}
		</ThemeProvider>
	);
}

/** Parse relative download URLs without depending on the environment's API host. */
function parseUrl(url: string): URL {
	return new URL(url, "http://localhost");
}

describe("catalog image themes", () => {
	beforeEach(() => {
		localStorage.removeItem(storageKey);
		mediaQuery = Object.assign(new EventTarget(), {
			matches: false,
			media: "(prefers-color-scheme: dark)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
		});
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mediaQuery),
		);
	});

	afterEach(() => {
		cleanup();
		localStorage.removeItem(storageKey);
		vi.unstubAllGlobals();
	});

	it.each(["ENGINE", "PROJECT"] as const)(
		"updates a mounted %s image when the UI theme changes",
		(resource) => {
			const { result } = renderHook(
				() => ({
					url: useCatalogImageUrl(resource, "theme image"),
					...useTheme(),
				}),
				{ wrapper: ThemeWrapper },
			);
			const lightUrl = result.current.url;
			const path =
				resource === "PROJECT"
					? "/project-theme%20image/projectImage/download"
					: "/e-theme%20image/image/download";
			expect(parseUrl(lightUrl).pathname).toContain(path);
			expect(parseUrl(lightUrl).searchParams.get("theme")).toBe("light");
			act(() => result.current.setTheme("dark"));
			expect(parseUrl(result.current.url).searchParams.get("theme")).toBe(
				"dark",
			);
			expect(result.current.url).not.toBe(lightUrl);
			act(() => result.current.setTheme("light"));
			expect(result.current.url).toBe(lightUrl);
		},
	);

	it("resolves system mode and follows operating system theme changes", () => {
		Object.assign(mediaQuery, { matches: true });
		const { result } = renderHook(
			() => ({
				url: useCatalogImageUrl("PROJECT", "system-theme"),
				...useTheme(),
			}),
			{ wrapper: ThemeWrapper },
		);
		act(() => result.current.setTheme("system"));
		expect(parseUrl(result.current.url).searchParams.get("theme")).toBe(
			"dark",
		);
		act(() => {
			Object.assign(mediaQuery, { matches: false });
			mediaQuery.dispatchEvent(new Event("change"));
		});
		expect(result.current.theme).toBe("system");
		expect(parseUrl(result.current.url).searchParams.get("theme")).toBe(
			"light",
		);
	});

	it("keeps upload cache revisions across themes and isolates other resources", () => {
		const { result } = renderHook(
			() => ({
				url: useCatalogImageUrl("ENGINE", "uploaded-theme-test"),
				other: useCatalogImageUrl("PROJECT", "uploaded-theme-test"),
				...useTheme(),
			}),
			{ wrapper: ThemeWrapper },
		);
		const before = result.current.url;
		const unrelated = result.current.other;
		act(() => refreshCatalogImage("ENGINE", "uploaded-theme-test"));
		const revision = parseUrl(result.current.url).searchParams.get("v");
		expect(revision).toBeTruthy();
		expect(result.current.url).not.toBe(before);
		expect(result.current.other).toBe(unrelated);
		act(() => result.current.setTheme("dark"));
		expect(parseUrl(result.current.url).searchParams.get("theme")).toBe(
			"dark",
		);
		expect(parseUrl(result.current.url).searchParams.get("v")).toBe(
			revision,
		);
		expect(parseUrl(result.current.other).searchParams.has("v")).toBe(
			false,
		);
	});
});
