import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFileBuffer } from "./use-file-buffer";
import type { FilePanelApi } from "./use-file-panel";

/** A panel whose read has already landed with `data`, and whose save succeeds. */
const stubPanel = (data: string, save = vi.fn().mockResolvedValue(true)) =>
	({
		read: { status: "SUCCESS", data, refresh: vi.fn(), revision: 1 },
		save,
	}) as unknown as FilePanelApi;

describe("useFileBuffer", () => {
	it("seeds from the read and reports the tab clean", () => {
		const rename = vi.fn();
		const { result } = renderHook(() =>
			useFileBuffer({ panel: stubPanel("hello"), name: "a.py", rename }),
		);

		expect(result.current.content).toBe("hello");
		expect(result.current.isDirty).toBe(false);
		expect(rename).toHaveBeenLastCalledWith("a.py");
	});

	// The trailing `*` is not cosmetic: useWorkbenchFilePanels preserves it
	// across a rename by inspecting `record.name.endsWith("*")`, so it is the
	// only signal that a renamed file has unsaved work.
	it("marks the tab dirty with a trailing asterisk and clears it on save", async () => {
		const rename = vi.fn();
		const save = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() =>
			useFileBuffer({
				panel: stubPanel("hello", save),
				name: "a.py",
				rename,
			}),
		);

		act(() => result.current.setContent("changed"));
		expect(rename).toHaveBeenLastCalledWith("a.py*");
		expect(result.current.isDirty).toBe(true);

		await act(async () => await result.current.save());
		expect(save).toHaveBeenCalledWith("changed");
		expect(rename).toHaveBeenLastCalledWith("a.py");
	});

	it("leaves the tab dirty when the save fails", async () => {
		const rename = vi.fn();
		const save = vi.fn().mockResolvedValue(false);
		const { result } = renderHook(() =>
			useFileBuffer({
				panel: stubPanel("hello", save),
				name: "a.py",
				rename,
			}),
		);

		act(() => result.current.setContent("changed"));
		await act(async () => await result.current.save());

		expect(rename).toHaveBeenLastCalledWith("a.py*");
	});

	it("markDirty updates the marker without writing the buffer", () => {
		// the notebook's escape hatch: it owns its own content, and writing
		// the buffer on every cell keystroke would re-render the panel
		const rename = vi.fn();
		const { result } = renderHook(() =>
			useFileBuffer({
				panel: stubPanel("hello"),
				name: "a.ipynb",
				rename,
			}),
		);

		act(() => result.current.markDirty("edited"));

		expect(rename).toHaveBeenLastCalledWith("a.ipynb*");
		expect(result.current.content).toBe("hello");
	});

	it("saves what getContent returns, not the buffer", async () => {
		const save = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() =>
			useFileBuffer({
				panel: stubPanel("raw", save),
				name: "a.ipynb",
				rename: vi.fn(),
				getContent: () => "serialized-from-elsewhere",
			}),
		);

		await act(async () => await result.current.save());

		expect(save).toHaveBeenCalledWith("serialized-from-elsewhere");
	});

	it("skipEmptySave treats an empty serialization as not-ready", async () => {
		// an empty *text* file is legitimate, so this is opt-in — it exists
		// for a buffer serialized from an editor handle that may not be up yet
		const save = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() =>
			useFileBuffer({
				panel: stubPanel("x", save),
				name: "a.ipynb",
				rename: vi.fn(),
				getContent: () => "",
				skipEmptySave: true,
			}),
		);

		await act(async () => await result.current.save());

		expect(save).not.toHaveBeenCalled();
	});
});
