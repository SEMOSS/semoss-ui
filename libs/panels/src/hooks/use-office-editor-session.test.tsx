import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { useOfficeEditorSession } from "./use-office-editor-session";

vi.mock("@semoss/shared", () => ({
	getFileOperationErrorMessage: (message: string) => message,
}));
vi.mock("@semoss/ui/next", () => ({ toast: { error: vi.fn() } }));

/** Control serialization, loading and uploads independently in race tests. */
const deferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	let reject: (cause: unknown) => void = () => undefined;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
};

const createEditor = () => {
	const element = Object.assign(document.createElement("div"), {
		fileName: "",
		dirty: false,
		load: vi
			.fn<(bytes: Uint8Array | ArrayBuffer) => Promise<void>>()
			.mockResolvedValue(undefined),
		saveBytes: vi
			.fn<() => Promise<Uint8Array>>()
			.mockResolvedValue(new Uint8Array([1, 2, 3])),
		markClean: vi.fn(),
		commitEdit: vi.fn(() => true),
	});
	element.markClean.mockImplementation(() => {
		element.dirty = false;
		element.dispatchEvent(new Event("dirty-change"));
	});
	return element;
};

describe.each(["document-change", "workbook-change"] as const)(
	"office editor session using %s",
	(changeEvent) => {
		const setup = () => {
			const element = createEditor();
			const options = {
				element,
				content: new Uint8Array([0]),
				fileName: "document.office",
				readRevision: 1,
				readStatus: "SUCCESS",
				resourceScope: "resource-1",
				readOnly: false,
				changeEvent,
				onSave: vi
					.fn<(content: string) => Promise<boolean>>()
					.mockResolvedValue(true),
				saveErrorMessage: "Save failed",
			};
			const hook = renderHook(
				(props: typeof options) => useOfficeEditorSession(props),
				{ initialProps: options },
			);
			const edit = () => {
				act(() => {
					element.dirty = true;
					element.dispatchEvent(new Event(changeEvent));
				});
			};
			return { ...hook, element, options, edit };
		};

		it("keeps edits made during upload dirty even without another dirty transition", async () => {
			const { result, element, options, edit } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			edit();
			const upload = deferred<boolean>();
			options.onSave.mockReturnValueOnce(upload.promise);
			let saving: Promise<void> = Promise.resolve();
			act(() => {
				saving = result.current.save();
			});
			await waitFor(() =>
				expect(options.onSave).toHaveBeenCalledWith("AQID"),
			);
			edit();
			await act(async () => {
				upload.resolve(true);
				await saving;
			});
			expect(element.markClean).not.toHaveBeenCalled();
			expect(result.current.isDirty).toBe(true);
		});

		it("marks only an unchanged successful snapshot clean", async () => {
			const { result, element, edit } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			edit();
			await act(() => result.current.save());
			expect(element.markClean).toHaveBeenCalledOnce();
			expect(result.current.isDirty).toBe(false);
		});

		it("commits a pending cell before taking the saved revision", async () => {
			const { result, element } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			element.commitEdit.mockImplementation(() => {
				element.dirty = true;
				element.dispatchEvent(new Event(changeEvent));
				return true;
			});
			await act(() => result.current.save());
			expect(element.markClean).toHaveBeenCalledOnce();
		});

		it("does not serialize or upload when cell validation rejects a commit", async () => {
			const { result, element, options } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			element.commitEdit.mockReturnValue(false);
			await act(() => result.current.save());
			expect(element.saveBytes).not.toHaveBeenCalled();
			expect(options.onSave).not.toHaveBeenCalled();
			expect(result.current.isSaving).toBe(false);
		});

		it("blocks persistence if permission is revoked while serializing", async () => {
			const { result, element, options, rerender } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			const serialized = deferred<Uint8Array>();
			element.saveBytes.mockReturnValueOnce(serialized.promise);
			let saving: Promise<void> = Promise.resolve();
			act(() => {
				saving = result.current.save();
			});
			rerender({ ...options, readOnly: true });
			await act(async () => {
				serialized.resolve(new Uint8Array([1]));
				await saving;
			});
			expect(options.onSave).not.toHaveBeenCalled();
			expect(element.markClean).not.toHaveBeenCalled();
		});

		it("does not acknowledge a save after unmount", async () => {
			const { result, element, options, unmount } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			const upload = deferred<boolean>();
			options.onSave.mockReturnValueOnce(upload.promise);
			let saving: Promise<void> = Promise.resolve();
			act(() => {
				saving = result.current.save();
			});
			await waitFor(() => expect(options.onSave).toHaveBeenCalled());
			unmount();
			upload.resolve(true);
			await saving;
			expect(element.markClean).not.toHaveBeenCalled();
		});

		it("does not upload serialized bytes after a different source starts loading", async () => {
			const { result, element, options, rerender } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			const serialized = deferred<Uint8Array>();
			element.saveBytes.mockReturnValueOnce(serialized.promise);
			let saving: Promise<void> = Promise.resolve();
			act(() => {
				saving = result.current.save();
			});
			rerender({ ...options, readRevision: 2 });
			await waitFor(() => expect(element.load).toHaveBeenCalledTimes(2));
			await act(async () => {
				serialized.resolve(new Uint8Array([1]));
				await saving;
			});
			expect(options.onSave).not.toHaveBeenCalled();
			expect(element.markClean).not.toHaveBeenCalled();
		});

		it("reports an editing error without discarding the loaded document", async () => {
			const { result, element, edit } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			edit();
			const cause = new Error("Edit rejected");
			act(() => {
				element.dispatchEvent(
					new CustomEvent(
						changeEvent === "workbook-change"
							? "workbook-error"
							: "document-error",
						{
							detail:
								changeEvent === "workbook-change"
									? { error: cause }
									: cause,
						},
					),
				);
			});
			expect(toast.error).toHaveBeenCalledWith(
				"Failed to update Office file",
			);
			expect(result.current.error).toBeNull();
			expect(result.current.isDirty).toBe(true);
		});

		it("ignores an old load failure after newer content has loaded", async () => {
			const { result, element, options, rerender } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			const oldLoad = deferred<void>();
			element.load.mockReturnValueOnce(oldLoad.promise);
			rerender({
				...options,
				content: new Uint8Array([1]),
				readRevision: 2,
			});
			expect(result.current.isLoading).toBe(true);
			rerender({
				...options,
				content: new Uint8Array([2]),
				readRevision: 3,
			});
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			await act(async () => {
				oldLoad.reject(new Error("Old load failed"));
				await Promise.resolve();
			});
			expect(result.current.error).toBeNull();
		});

		it("updates a renamed file without replacing unsaved content", async () => {
			const { result, element, options, rerender, edit } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			edit();
			rerender({ ...options, fileName: "renamed.office" });
			expect(element.fileName).toBe("renamed.office");
			expect(element.load).toHaveBeenCalledOnce();
			expect(result.current.isDirty).toBe(true);
		});

		it("does not clear dirtiness after a failed upload", async () => {
			const { result, element, options, edit } = setup();
			await waitFor(() => expect(result.current.isLoading).toBe(false));
			edit();
			options.onSave.mockResolvedValueOnce(false);
			await act(() => result.current.save());
			expect(element.markClean).not.toHaveBeenCalled();
			expect(result.current.isDirty).toBe(true);
		});
	},
);
