import { act, cleanup, renderHook } from "@testing-library/react";
import {
	navigationStorageKey,
	useNavigationPreferences,
} from "./use-navigation-preferences";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	localStorage.clear();
});

it("defaults to expanded navigation and Sessions with folded Topics without writing storage", () => {
	const write = vi.spyOn(Storage.prototype, "setItem");
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
	expect(write).not.toHaveBeenCalled();
});

it("restores all preferences after a remount, including batched changes and resets", () => {
	const { result, unmount } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	act(() => {
		result.current.setIsCollapsed(true);
		result.current.setIsTopicsOpen(true);
		result.current.setIsSessionsOpen(false);
	});
	expect(result.current.isCollapsed).toBe(true);
	expect(result.current.isTopicsOpen).toBe(true);
	expect(result.current.isSessionsOpen).toBe(false);
	unmount();
	const restored = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(restored.result.current.isCollapsed).toBe(true);
	expect(restored.result.current.isTopicsOpen).toBe(true);
	expect(restored.result.current.isSessionsOpen).toBe(false);
	act(() => {
		restored.result.current.setIsCollapsed(false);
		restored.result.current.setIsSessionsOpen(true);
	});
	restored.unmount();
	const reset = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(reset.result.current.isCollapsed).toBe(false);
	expect(reset.result.current.isTopicsOpen).toBe(true);
	expect(reset.result.current.isSessionsOpen).toBe(true);
});

it("changes account and deployment without exposing or overwriting the previous values", () => {
	const rendered: Array<{ account: string; isCollapsed: boolean }> = [];
	const { result, rerender } = renderHook(
		({ account, deployment }) => {
			const preferences = useNavigationPreferences(account, deployment);
			rendered.push({ account, isCollapsed: preferences.isCollapsed });
			return preferences;
		},
		{ initialProps: { account: "one", deployment: "deployment-a" } },
	);
	act(() => {
		result.current.setIsCollapsed(true);
		result.current.setIsSessionsOpen(false);
	});
	rerender({ account: "two", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
	expect(
		rendered
			.filter((entry) => entry.account === "two")
			.every((entry) => !entry.isCollapsed),
	).toBe(true);
	act(() => result.current.setIsTopicsOpen(true));
	rerender({ account: "one", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(true);
	expect(result.current.isTopicsOpen).toBe(false);
	expect(result.current.isSessionsOpen).toBe(false);
	rerender({ account: "one", deployment: "deployment-b" });
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
	rerender({ account: "two", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(true);
});

it("keeps deployment and account separators unambiguous", () => {
	expect(navigationStorageKey("one:two", "three")).not.toBe(
		navigationStorageKey("two", "three:one"),
	);
});

it.each(["{", '"true"', "1", "null", "{}", "[]", "TRUE"])(
	"ignores the invalid stored value %s and preserves the other preference",
	(value) => {
		const key = navigationStorageKey("one", "deployment-a");
		localStorage.setItem(`${key}:isCollapsed`, value);
		localStorage.setItem(`${key}:isTopicsOpen`, "true");
		localStorage.setItem(`${key}:isSessionsOpen`, value);
		const { result } = renderHook(() =>
			useNavigationPreferences("one", "deployment-a"),
		);
		expect(result.current.isCollapsed).toBe(false);
		expect(result.current.isTopicsOpen).toBe(true);
		expect(result.current.isSessionsOpen).toBe(true);
		act(() => result.current.setIsCollapsed(true));
		expect(result.current.isCollapsed).toBe(true);
		expect(localStorage.getItem(`${key}:isCollapsed`)).toBe("true");
	},
);

it("ignores preferences from an unknown storage version", () => {
	const key = navigationStorageKey("one", "deployment-a").replace(
		":v1:",
		":v2:",
	);
	localStorage.setItem(`${key}:isCollapsed`, "true");
	localStorage.setItem(`${key}:isSessionsOpen`, "false");
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
});

it("remains interactive and account-isolated when reads and writes are blocked", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("storage is blocked");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("storage is blocked");
	});
	const { result, rerender } = renderHook(
		({ account }) => useNavigationPreferences(account, "deployment-a"),
		{ initialProps: { account: "one" } },
	);
	act(() => {
		result.current.setIsCollapsed(true);
		result.current.setIsTopicsOpen(true);
		result.current.setIsSessionsOpen(false);
	});
	expect(result.current.isCollapsed).toBe(true);
	expect(result.current.isTopicsOpen).toBe(true);
	expect(result.current.isSessionsOpen).toBe(false);
	act(() => result.current.setIsCollapsed(false));
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(true);
	rerender({ account: "two" });
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isTopicsOpen).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
});

it("handles an unavailable localStorage property", () => {
	vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
		throw new Error("storage is unavailable");
	});
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
	expect(result.current.isSessionsOpen).toBe(true);
	act(() => {
		result.current.setIsTopicsOpen(true);
		result.current.setIsSessionsOpen(false);
	});
	expect(result.current.isTopicsOpen).toBe(true);
	expect(result.current.isSessionsOpen).toBe(false);
});
