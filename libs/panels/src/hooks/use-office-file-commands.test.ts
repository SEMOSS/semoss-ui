import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOfficeFileCommands } from "./use-office-file-commands";

describe("useOfficeFileCommands", () => {
	it("captures Save shortcuts once and keeps unrelated keyboard actions available", () => {
		const element = document.createElement("div");
		const input = document.createElement("input");
		element.append(input);
		const onSave = vi.fn();
		const vendorSave = vi.fn();
		input.addEventListener("keydown", vendorSave);
		const { unmount } = renderHook(() =>
			useOfficeFileCommands(element, onSave),
		);
		for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
			const event = new KeyboardEvent("keydown", {
				key: "s",
				...modifier,
				bubbles: true,
				cancelable: true,
			});
			input.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(vendorSave).not.toHaveBeenCalled();
		const other = new KeyboardEvent("keydown", {
			key: "s",
			bubbles: true,
			cancelable: true,
		});
		input.dispatchEvent(other);
		expect(other.defaultPrevented).toBe(false);
		unmount();
		const save = new KeyboardEvent("keydown", {
			key: "s",
			ctrlKey: true,
			bubbles: true,
			cancelable: true,
		});
		input.dispatchEvent(save);
		expect(save.defaultPrevented).toBe(false);
	});
	it("routes Save to the host and cancels vendor file lifecycle actions", () => {
		const element = document.createElement("div");
		const onSave = vi.fn();
		renderHook(() => useOfficeFileCommands(element, onSave));
		for (const command of [
			"save",
			"open",
			"new",
			"save-as",
			"print",
			"export",
		]) {
			const event = new CustomEvent("file-command", {
				cancelable: true,
				detail: { command },
			});
			element.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}
		expect(onSave).toHaveBeenCalledTimes(1);
	});

	it("updates callbacks and detaches listeners from replaced or unmounted viewers", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const initialSave = vi.fn();
		const nextSave = vi.fn();
		const dispatchSave = (element: HTMLElement) =>
			element.dispatchEvent(
				new CustomEvent("file-command", {
					cancelable: true,
					detail: { command: "save" },
				}),
			);
		const { rerender, unmount } = renderHook(
			({ element, onSave }) => useOfficeFileCommands(element, onSave),
			{ initialProps: { element: first, onSave: initialSave } },
		);
		rerender({ element: first, onSave: nextSave });
		dispatchSave(first);
		expect(initialSave).not.toHaveBeenCalled();
		expect(nextSave).toHaveBeenCalledTimes(1);
		rerender({ element: second, onSave: nextSave });
		expect(dispatchSave(first)).toBe(true);
		expect(dispatchSave(second)).toBe(false);
		unmount();
		expect(dispatchSave(second)).toBe(true);
	});

	it("ignores malformed events without claiming to handle them", () => {
		const element = document.createElement("div");
		const onSave = vi.fn();
		renderHook(() => useOfficeFileCommands(element, onSave));
		for (const detail of [null, "save", { command: 1 }, {}]) {
			const event = new CustomEvent("file-command", {
				cancelable: true,
				detail,
			});
			element.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(onSave).not.toHaveBeenCalled();
	});
});
