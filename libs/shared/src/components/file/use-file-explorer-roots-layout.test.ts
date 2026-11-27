import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileExplorerRootsLayout } from "./file-explorer-root.types";
import { useFileExplorerRootsLayout } from "./use-file-explorer-roots-layout";

const IDS = ["primary", "desktop", "storage"];

const setup = (layout?: FileExplorerRootsLayout) => {
	const onLayoutChange = vi.fn();
	const hook = renderHook(
		(props: { layout?: FileExplorerRootsLayout }) =>
			useFileExplorerRootsLayout({
				ids: IDS,
				layout: props.layout,
				onLayoutChange: onLayoutChange,
			}),
		{ initialProps: { layout: layout } },
	);
	return { ...hook, onLayoutChange };
};

describe("useFileExplorerRootsLayout", () => {
	it("keeps a saved order, drops roots that are gone, and adds new ones last", () => {
		const { result } = setup({
			order: ["storage", "gone", "primary"],
		});

		expect(result.current.order).toEqual(["storage", "primary", "desktop"]);
	});

	it("moves a root and reports the new order once", () => {
		const { result, onLayoutChange } = setup();

		act(() => result.current.move("storage", 0));

		expect(onLayoutChange).toHaveBeenCalledTimes(1);
		expect(onLayoutChange).toHaveBeenCalledWith({
			order: ["storage", "primary", "desktop"],
		});
	});

	it("reports nothing for a move that changes nothing", () => {
		const { result, onLayoutChange } = setup();

		act(() => result.current.move("primary", -1));

		expect(onLayoutChange).not.toHaveBeenCalled();
	});

	it("closes and reopens a root, keeping the rest of the layout", () => {
		const { result, onLayoutChange, rerender } = setup({
			order: ["storage"],
		});

		act(() => result.current.toggle("desktop"));

		expect(onLayoutChange).toHaveBeenLastCalledWith({
			order: ["storage"],
			collapsed: ["desktop"],
		});

		rerender({ layout: onLayoutChange.mock.lastCall?.[0] });
		expect(result.current.isExpanded("desktop")).toBe(false);
		expect(result.current.isExpanded("primary")).toBe(true);

		act(() => result.current.toggle("desktop"));

		expect(onLayoutChange).toHaveBeenLastCalledWith({
			order: ["storage"],
			collapsed: [],
		});
	});

	it("keeps its own layout when the host keeps none", () => {
		const { result } = renderHook(() =>
			useFileExplorerRootsLayout({
				ids: IDS,
				layout: undefined,
				onLayoutChange: undefined,
			}),
		);

		act(() => result.current.toggle("storage"));
		act(() => result.current.move("storage", 0));

		expect(result.current.isExpanded("storage")).toBe(false);
		expect(result.current.order).toEqual(["storage", "primary", "desktop"]);
	});
});
