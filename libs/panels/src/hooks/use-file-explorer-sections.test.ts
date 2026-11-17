import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	type FileExplorerSectionsLayout,
	useFileExplorerSections,
} from "./use-file-explorer-sections";

const KEYS = ["primary", "group:desktop", "group:storage"];

const setup = (layout?: FileExplorerSectionsLayout) => {
	const onLayoutChange = vi.fn();
	const hook = renderHook(
		(props: { layout?: FileExplorerSectionsLayout }) =>
			useFileExplorerSections({
				keys: KEYS,
				layout: props.layout,
				onLayoutChange: onLayoutChange,
			}),
		{ initialProps: { layout: layout } },
	);
	return { ...hook, onLayoutChange };
};

describe("useFileExplorerSections", () => {
	it("keeps a saved order, drops keys that are gone, and adds new ones last", () => {
		const { result } = setup({
			order: ["group:storage", "gone", "primary"],
		});

		expect(result.current.order).toEqual([
			"group:storage",
			"primary",
			"group:desktop",
		]);
	});

	it("moves a section and reports the new order once", () => {
		const { result, onLayoutChange } = setup();

		act(() => result.current.move("group:storage", 0));

		expect(onLayoutChange).toHaveBeenCalledTimes(1);
		expect(onLayoutChange).toHaveBeenCalledWith({
			order: ["group:storage", "primary", "group:desktop"],
		});
	});

	it("reports nothing for a move that changes nothing", () => {
		const { result, onLayoutChange } = setup();

		act(() => result.current.move("primary", -1));

		expect(onLayoutChange).not.toHaveBeenCalled();
	});

	it("resizes a pair against each other, keeping their combined weight", () => {
		const { result, onLayoutChange } = setup();

		act(() =>
			result.current.startResize("primary", "group:desktop", {
				above: 300,
				below: 300,
			}),
		);
		act(() => result.current.updateResize(60));

		// mid-drag the sizes show without being kept
		expect(result.current.getSize("primary")).toBeCloseTo(1.2);
		expect(result.current.getSize("group:desktop")).toBeCloseTo(0.8);
		expect(onLayoutChange).not.toHaveBeenCalled();

		act(() => result.current.endResize());

		expect(onLayoutChange).toHaveBeenCalledTimes(1);
		const { sizes } = onLayoutChange.mock.calls[0][0];
		expect(sizes.primary).toBeCloseTo(1.2);
		expect(sizes["group:desktop"]).toBeCloseTo(0.8);
		expect(sizes["group:storage"]).toBeUndefined();
	});

	it("never shrinks a section below its minimum height", () => {
		const { result } = setup();

		act(() =>
			result.current.startResize("primary", "group:desktop", {
				above: 300,
				below: 300,
			}),
		);
		act(() => result.current.updateResize(-1000));

		// 128 of 600 px
		expect(result.current.getSize("primary")).toBeCloseTo((2 * 128) / 600);
	});
});
