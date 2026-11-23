import { renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useRoomHistorySearchShortcut } from "./use-room-history-search-shortcut";

/**
 * Press a key on the window, where the shortcut listens.
 *
 * @param init - The key and its modifiers.
 * @returns The event, to check whether the shortcut claimed it.
 */
const press = (init: KeyboardEventInit) => {
	const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
	window.dispatchEvent(event);
	return event;
};

test("Cmd+K and Ctrl+K open search; other chords do not", () => {
	const onOpenChange = vi.fn();
	renderHook(() => useRoomHistorySearchShortcut(onOpenChange));

	expect(press({ key: "k", metaKey: true }).defaultPrevented).toBe(true);
	press({ key: "K", ctrlKey: true });
	press({ key: "k", metaKey: true, shiftKey: true });
	press({ key: "k" });

	expect(onOpenChange.mock.calls).toEqual([[true], [true]]);
});

test("stops listening on unmount", () => {
	const onOpenChange = vi.fn();
	const { unmount } = renderHook(() =>
		useRoomHistorySearchShortcut(onOpenChange),
	);
	press({ key: "k", metaKey: true });
	expect(onOpenChange).toHaveBeenCalledTimes(1);

	unmount();
	press({ key: "k", metaKey: true });
	expect(onOpenChange).toHaveBeenCalledTimes(1);
});
