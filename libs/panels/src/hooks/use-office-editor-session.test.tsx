import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOfficeEditorSession } from "./use-office-editor-session";

afterEach(cleanup);

/** A deferred serializer allows real source/permission/edit changes during Save. */
const createSession = () => {
	let finishSerialization: (bytes: Uint8Array) => void = () => {};
	const element = Object.assign(document.createElement("div"), {
		fileName: "report.docx",
		dirty: true,
		load: vi.fn(async () => {}),
		saveBytes: vi.fn(
			() =>
				new Promise<Uint8Array>((resolve) => {
					finishSerialization = resolve;
				}),
		),
		markClean: vi.fn(),
		commitEdit: vi.fn(() => true),
	});
	const options = {
		element,
		content: new Uint8Array([1]),
		fileName: "report.docx",
		readRevision: 1,
		readStatus: "SUCCESS",
		resourceScope: "project:one",
		readOnly: false,
		changeEvent: "document-change" as const,
		onSave: vi.fn(async () => true),
		saveErrorMessage: "Save failed",
	};
	return {
		element,
		options,
		finish: () => finishSerialization(new Uint8Array([2])),
	};
};

describe("composed Office editor persistence", () => {
	it("marks only an unchanged, successfully persisted snapshot clean", async () => {
		const { element, options, finish } = createSession();
		const { result } = renderHook(() => useOfficeEditorSession(options));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let saving: Promise<void> = Promise.resolve();
		act(() => {
			saving = result.current.save();
		});
		await act(async () => {
			finish();
			await saving;
		});
		expect(options.onSave).toHaveBeenCalledWith("Ag==");
		expect(element.markClean).toHaveBeenCalledOnce();
		expect(result.current.isDirty).toBe(false);
	});

	it("does not persist an old source after the mounted surface is replaced", async () => {
		const old = createSession();
		const next = createSession();
		const { result, rerender } = renderHook(
			({ element, revision }) =>
				useOfficeEditorSession({
					...old.options,
					element,
					readRevision: revision,
				}),
			{ initialProps: { element: old.element, revision: 1 } },
		);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let saving: Promise<void> = Promise.resolve();
		act(() => {
			saving = result.current.save();
		});
		rerender({ element: next.element, revision: 2 });
		await act(async () => {
			old.finish();
			await saving;
		});
		expect(old.options.onSave).not.toHaveBeenCalled();
		expect(old.element.markClean).not.toHaveBeenCalled();
		expect(next.element.load).toHaveBeenCalledOnce();
	});

	it("does not acknowledge edits made while a snapshot is being saved", async () => {
		const { element, options, finish } = createSession();
		const { result } = renderHook(() => useOfficeEditorSession(options));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let saving: Promise<void> = Promise.resolve();
		act(() => {
			saving = result.current.save();
		});
		act(() => element.dispatchEvent(new CustomEvent("document-change")));
		await act(async () => {
			finish();
			await saving;
		});
		expect(options.onSave).toHaveBeenCalledOnce();
		expect(element.markClean).not.toHaveBeenCalled();
		expect(result.current.isDirty).toBe(true);
	});

	it("keeps dirty state after the host refuses persistence", async () => {
		const { element, options, finish } = createSession();
		options.onSave.mockResolvedValue(false);
		const { result } = renderHook(() => useOfficeEditorSession(options));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let saving: Promise<void> = Promise.resolve();
		act(() => {
			saving = result.current.save();
		});
		await act(async () => {
			finish();
			await saving;
		});
		expect(element.markClean).not.toHaveBeenCalled();
		expect(result.current.isDirty).toBe(true);
	});

	it("does not write a serialized snapshot after permission is revoked", async () => {
		const { element, options, finish } = createSession();
		const { result, rerender } = renderHook(
			({ readOnly }) => useOfficeEditorSession({ ...options, readOnly }),
			{ initialProps: { readOnly: false } },
		);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		let saving: Promise<void> = Promise.resolve();
		act(() => {
			saving = result.current.save();
		});
		rerender({ readOnly: true });
		await act(async () => {
			finish();
			await saving;
		});
		expect(options.onSave).not.toHaveBeenCalled();
		expect(element.markClean).not.toHaveBeenCalled();
	});

	it("aborts Save when the active spreadsheet edit fails validation", async () => {
		const { element, options } = createSession();
		element.commitEdit.mockReturnValue(false);
		const { result } = renderHook(() => useOfficeEditorSession(options));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		await act(() => result.current.save());
		expect(element.saveBytes).not.toHaveBeenCalled();
		expect(options.onSave).not.toHaveBeenCalled();
	});
});
