import { act, renderHook } from "@testing-library/react";
import type { ViewerHandle } from "visio-react-viewer";
import { afterEach, describe, expect, it } from "vitest";
import { useVisioTextRecovery } from "./use-visio-text-recovery";

const createElement = (sourceGeneration = 1) => {
	const element = Object.assign(document.createElement("div"), {
		controller: { sourceGeneration },
	}) as unknown as ViewerHandle["element"];
	document.body.append(element);
	return element;
};
afterEach(() => document.body.replaceChildren());
const emit = (element: HTMLElement, overrides: Record<string, unknown> = {}) =>
	element.dispatchEvent(
		new CustomEvent("visio-text-edit", {
			detail: {
				sourceGeneration: 1,
				status: "rejected",
				pageId: "0",
				shapeId: "1",
				text: "My draft",
				message: "Edit refused",
				...overrides,
			},
		}),
	);

describe("Visio text recovery", () => {
	it("does not read a disposed controller while a refreshed viewer ref is pending", () => {
		const element = createElement();
		const { result, rerender } = renderHook(
			({ sourceKey }) => useVisioTextRecovery(element, sourceKey),
			{ initialProps: { sourceKey: "source" } },
		);
		element.remove();
		Object.defineProperty(element, "controller", {
			get: () => {
				throw new Error("The viewer has been destroyed.");
			},
		});
		act(() => emit(element));
		rerender({ sourceKey: "refreshed" });
		expect(result.current.failures).toEqual([]);
	});
	it("retains drafts per shape, updates retries, and removes corrected or dismissed drafts", () => {
		const element = createElement();
		const { result } = renderHook(() =>
			useVisioTextRecovery(element, "source"),
		);
		act(() => {
			emit(element);
			emit(element, { shapeId: "2", text: "Second draft" });
			emit(element, { text: "Updated draft" });
		});
		expect(result.current.failures.map((failure) => failure.text)).toEqual([
			"Second draft",
			"Updated draft",
		]);
		act(() => emit(element, { status: "applied" }));
		expect(result.current.failures.map((failure) => failure.text)).toEqual([
			"Second draft",
		]);
		act(() => result.current.dismiss(result.current.failures[0]));
		expect(result.current.failures).toEqual([]);
	});
	it("rejects stale and malformed events and clears recovery after a source replacement", () => {
		const element = createElement();
		const { result } = renderHook(() =>
			useVisioTextRecovery(element, "source"),
		);
		act(() => {
			emit(element, { sourceGeneration: 0 });
			emit(element, { message: null });
			emit(element, { text: 123 });
			element.dispatchEvent(
				new CustomEvent("visio-text-edit", { detail: null }),
			);
		});
		expect(result.current.failures).toEqual([]);
		act(() => emit(element));
		act(() => {
			Object.assign(element.controller, { sourceGeneration: 2 });
			element.dispatchEvent(new CustomEvent("document-load"));
		});
		expect(result.current.failures).toEqual([]);
	});
	it("keeps drafts through a retained viewer remount and isolates a refreshed file", () => {
		const first = createElement();
		const next = createElement(0);
		const { result, rerender, unmount } = renderHook(
			({ element, sourceKey }) =>
				useVisioTextRecovery(element, sourceKey),
			{ initialProps: { element: first, sourceKey: "source" } },
		);
		act(() => emit(first));
		rerender({ element: next, sourceKey: "source" });
		act(() => {
			Object.assign(next.controller, { sourceGeneration: 1 });
			next.dispatchEvent(new CustomEvent("document-change"));
		});
		expect(result.current.failures[0]?.text).toBe("My draft");
		rerender({ element: next, sourceKey: "refreshed" });
		expect(result.current.failures).toEqual([]);
		act(() => emit(first));
		expect(result.current.failures).toEqual([]);
		unmount();
		act(() => emit(next));
	});
});
