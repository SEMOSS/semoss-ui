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

it("defaults to expanded navigation without writing storage", () => {
	const write = vi.spyOn(Storage.prototype, "setItem");
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
	expect(write).not.toHaveBeenCalled();
});

it("restores the collapse preference after a remount", () => {
	const { result, unmount } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	act(() => result.current.setIsCollapsed(true));
	unmount();
	const restored = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(restored.result.current.isCollapsed).toBe(true);
	act(() => restored.result.current.setIsCollapsed(false));
	restored.unmount();
	const expanded = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(expanded.result.current.isCollapsed).toBe(false);
});

it("changes account and deployment without exposing or overwriting another account's choice", () => {
	const rendered: Array<{ account: string; isCollapsed: boolean }> = [];
	const { result, rerender } = renderHook(
		({ account, deployment }) => {
			const preferences = useNavigationPreferences(account, deployment);
			rendered.push({ account, isCollapsed: preferences.isCollapsed });
			return preferences;
		},
		{ initialProps: { account: "one", deployment: "deployment-a" } },
	);
	act(() => result.current.setIsCollapsed(true));
	rerender({ account: "two", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(false);
	expect(
		rendered
			.filter((entry) => entry.account === "two")
			.every((entry) => !entry.isCollapsed),
	).toBe(true);
	rerender({ account: "one", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(true);
	rerender({ account: "one", deployment: "deployment-b" });
	expect(result.current.isCollapsed).toBe(false);
	rerender({ account: "two", deployment: "deployment-a" });
	expect(result.current.isCollapsed).toBe(false);
});

it("keeps encoded deployment and account separators unambiguous", () => {
	expect(navigationStorageKey("one:two", "three")).not.toBe(
		navigationStorageKey("two", "three:one"),
	);
});

it.each(["{", '"true"', "1", "null", "{}", "[]", "TRUE"])(
	"ignores invalid collapse preference %s",
	(value) => {
		const key = navigationStorageKey("one", "deployment-a");
		localStorage.setItem(`${key}:isCollapsed`, value);
		const { result } = renderHook(() =>
			useNavigationPreferences("one", "deployment-a"),
		);
		expect(result.current.isCollapsed).toBe(false);
	},
);

it("preserves the existing collapse preference without reading obsolete disclosures", () => {
	const key = navigationStorageKey("one", "deployment-a");
	localStorage.setItem(`${key}:isCollapsed`, "true");
	localStorage.setItem(`${key}:isTopicsOpen`, "false");
	localStorage.setItem(`${key}:isSessionsOpen`, "false");
	localStorage.setItem(`${key}:treeGroup:topic%3Aone`, "false");
	localStorage.setItem(`${key}:treeGroup:other`, "false");
	const read = vi.spyOn(Storage.prototype, "getItem");
	const enumerate = vi.spyOn(Storage.prototype, "key");
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(true);
	expect(read).toHaveBeenCalledExactlyOnceWith(`${key}:isCollapsed`);
	expect(enumerate).not.toHaveBeenCalled();
});

it("ignores preferences from an unknown storage version", () => {
	const key = navigationStorageKey("one", "deployment-a").replace(
		":v1:",
		":v2:",
	);
	localStorage.setItem(`${key}:isCollapsed`, "true");
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
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
	act(() => result.current.setIsCollapsed(true));
	expect(result.current.isCollapsed).toBe(true);
	rerender({ account: "two" });
	expect(result.current.isCollapsed).toBe(false);
});

it("handles an unavailable localStorage property", () => {
	vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
		throw new Error("storage is unavailable");
	});
	const { result } = renderHook(() =>
		useNavigationPreferences("one", "deployment-a"),
	);
	expect(result.current.isCollapsed).toBe(false);
	act(() => result.current.setIsCollapsed(true));
	expect(result.current.isCollapsed).toBe(true);
});
