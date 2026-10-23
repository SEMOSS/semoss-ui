import { act, render, screen, waitFor } from "@testing-library/react";
import type {
	PowerPointViewerHandle,
	PowerPointViewerProps,
} from "pptx-react-viewer";
import type {
	ViewerHandle,
	VisioDocument,
	VisioViewerProps,
} from "visio-react-viewer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilePanelApi } from "../../hooks/use-file-panel";
import type {
	FileViewControls,
	FileViewProps,
} from "../../types/file-view.types";
import { FilePptxView } from "./file-pptx-view";
import { FileVisioView } from "./file-visio-view";

const harness = vi.hoisted(() => ({
	panel: null as FilePanelApi | null,
	pptxProps: null as PowerPointViewerProps | null,
	visioProps: null as VisioViewerProps | null,
	pptxHandle: null as PowerPointViewerHandle | null,
	visioHandle: null as ViewerHandle | null,
	toastError: vi.fn(),
	pptxMounted: vi.fn(),
}));

vi.mock("../../hooks/use-file-panel", () => ({
	useFilePanel: () => harness.panel,
}));
vi.mock("@semoss/i18n", () => ({
	getI18n: () => undefined,
	useTranslation: () => ({ i18n: undefined }),
}));
vi.mock("@semoss/shared", () => ({
	decodeBase64Asset: (value: string) =>
		value ? new Uint8Array([1, 2]) : null,
	getFileOperationErrorMessage: (message: string, error: Error) =>
		`${message}: ${error.message}`,
}));
vi.mock("@semoss/ui/next", () => ({ toast: { error: harness.toastError } }));
vi.mock("pptx-react-viewer/i18n", () => ({ translationsEn: {} }));
vi.mock("./office/office-viewer-frame", () => ({
	OfficeViewerFrame: ({ children }: { children: React.ReactNode }) =>
		children,
}));
vi.mock("./office/office-viewer-error", () => ({
	OfficeViewerError: ({ message }: { message: string }) => message,
}));
vi.mock("pptx-react-viewer", async () => {
	const { createElement, forwardRef, useEffect, useImperativeHandle } =
		await import("react");
	return {
		PowerPointViewer: forwardRef<
			PowerPointViewerHandle,
			PowerPointViewerProps
		>((props, ref) => {
			harness.pptxProps = props;
			useEffect(() => {
				harness.pptxMounted();
			}, []);
			useImperativeHandle(ref, () => {
				if (!harness.pptxHandle)
					throw new Error("Missing presentation handle");
				return harness.pptxHandle;
			}, []);
			return createElement("div", {
				"data-testid": "pptx",
				"data-can-edit": props.canEdit,
			});
		}),
	};
});
vi.mock("visio-react-viewer", async () => {
	const { createElement, forwardRef, useImperativeHandle } = await import(
		"react"
	);
	return {
		VisioViewer: forwardRef<ViewerHandle, VisioViewerProps>(
			(props, ref) => {
				harness.visioProps = props;
				useImperativeHandle(ref, () => {
					if (!harness.visioHandle)
						throw new Error("Missing diagram handle");
					return harness.visioHandle;
				}, []);
				return createElement("div", {
					"data-testid": "visio",
					"data-can-edit": props.canEdit,
				});
			},
		),
	};
});

const config: FileViewProps["config"] = {
	mode: { type: "USER" },
	name: "example",
	path: "/example",
};
const document = { pages: [] } as unknown as VisioDocument;
let controls: FileViewControls | undefined;
const onControls = (next: FileViewControls) => {
	controls = next;
};
const getControls = (): FileViewControls => {
	if (!controls) throw new Error("Controls not published");
	return controls;
};

beforeEach(() => {
	vi.clearAllMocks();
	controls = undefined;
	harness.pptxProps = null;
	harness.visioProps = null;
	harness.panel = {
		access: {
			status: "ready",
			readOnly: false,
			permission: "EDIT",
			refreshing: false,
			refresh: vi.fn().mockResolvedValue("EDIT"),
		},
		readOnly: false,
		targetInsightId: undefined,
		read: {
			status: "SUCCESS",
			data: "AQI=",
			revision: 1,
			refresh: vi.fn(),
		},
		save: vi.fn().mockResolvedValue(true),
		download: vi.fn().mockResolvedValue(undefined),
		isDownloading: false,
		isBusy: false,
		gate: null,
		readGate: null,
	};
	harness.pptxHandle = {
		getContent: vi.fn().mockResolvedValue(new Uint8Array([3, 4])),
	} as unknown as PowerPointViewerHandle;
	harness.visioHandle = {
		load: vi.fn().mockResolvedValue(undefined),
		exportVsdx: vi.fn(() => ({
			bytes: new Uint8Array([3, 4]),
			diagnostics: [],
			dirty: true,
		})),
		element: {},
		controller: {
			state: { document },
			documentGeneration: 1,
			markClean: vi.fn(() =>
				harness.visioProps?.events?.["document-change"]?.({
					document,
					dirty: false,
					kind: "save",
				}),
			),
		},
	} as unknown as ViewerHandle;
});

describe("retained Office viewer integration", () => {
	it("keeps presentation editing and native menus while removing ancillary entry points", () => {
		render(
			<FilePptxView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		expect(harness.pptxProps?.canEdit).toBe(true);
		const policy = harness.pptxProps?.customization;
		expect(policy?.ribbon?.hiddenTabs).toEqual(
			expect.arrayContaining(["file", "animations", "review", "record"]),
		);
		expect(policy?.ribbon?.hiddenTabs).not.toContain("home");
		expect(policy?.ribbon?.hiddenTabs).not.toContain("insert");
		expect(policy?.ribbon?.hiddenTabs).not.toContain("slideShow");
		expect(policy?.ribbon?.hiddenGroups).not.toContain(
			"slideShow.startSlideShow",
		);
		expect(policy?.contextMenu?.disableElementMenu).not.toBe(true);
		expect(policy?.capabilities).toMatchObject({
			export: false,
			share: false,
			print: false,
			comment: false,
		});
		expect(harness.pptxProps?.theme?.colors?.background).toBe(
			"var(--semoss-office-background)",
		);
	});

	it("keeps later presentation edits saveable without replacing the document or undo history", async () => {
		render(
			<FilePptxView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		const initialContent = harness.pptxProps?.content;
		act(() => harness.pptxProps?.onDirtyChange?.(true));
		act(() => getControls().save?.());
		await waitFor(() => expect(getControls().isBusy).toBe(false));
		expect(harness.panel?.save).toHaveBeenCalledWith("AwQ=");
		expect(getControls().isDirty).toBe(true);
		expect(getControls().canSave).toBe(true);
		expect(harness.pptxProps?.content).toBe(initialContent);
		expect(harness.pptxMounted).toHaveBeenCalledOnce();
		act(() => harness.pptxProps?.onDirtyChange?.(false));
		expect(getControls().isDirty).toBe(true);
		expect(getControls().canSave).toBe(true);
	});

	it("reloads an explicitly refreshed presentation even when server bytes are identical", () => {
		const view = render(
			<FilePptxView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() => harness.pptxProps?.onDirtyChange?.(true));
		if (!harness.panel) throw new Error("Missing panel");
		harness.panel = {
			...harness.panel,
			read: { ...harness.panel.read, revision: 2 },
		};
		view.rerender(
			<FilePptxView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		expect(harness.pptxMounted).toHaveBeenCalledTimes(2);
		expect(getControls().isDirty).toBe(false);
	});

	it.each(["refresh", "source", "permission", "unmount"] as const)(
		"does not upload a presentation serialized before %s invalidates the save",
		async (change) => {
			let resolveSerialization: (bytes: Uint8Array) => void = () => {
				throw new Error("Serialization not started");
			};
			if (!harness.pptxHandle || !harness.panel)
				throw new Error("Missing viewer");
			const save = harness.panel.save;
			harness.pptxHandle.getContent = vi.fn(
				() =>
					new Promise<Uint8Array>((resolve) => {
						resolveSerialization = resolve;
					}),
			);
			const view = render(
				<FilePptxView
					config={config}
					rename={vi.fn()}
					onControls={onControls}
				/>,
			);
			act(() => harness.pptxProps?.onDirtyChange?.(true));
			act(() => getControls().save?.());
			if (change === "unmount") {
				view.unmount();
			} else {
				harness.panel = {
					...harness.panel,
					readOnly: change === "permission",
					read: {
						...harness.panel.read,
						revision: change === "refresh" ? 2 : 1,
						data: change === "source" ? "AwQ=" : "AQI=",
					},
				};
				view.rerender(
					<FilePptxView
						config={config}
						rename={vi.fn()}
						onControls={onControls}
					/>,
				);
			}
			await act(async () => resolveSerialization(new Uint8Array([3, 4])));
			expect(save).not.toHaveBeenCalled();
		},
	);

	it("does not persist an empty presentation serialization", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.mocked(harness.pptxHandle?.getContent ?? vi.fn()).mockResolvedValue(
			new Uint8Array(),
		);
		render(
			<FilePptxView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() => harness.pptxProps?.onDirtyChange?.(true));
		act(() => getControls().save?.());
		await waitFor(() => expect(harness.toastError).toHaveBeenCalled());
		expect(harness.panel?.save).not.toHaveBeenCalled();
		expect(getControls().isDirty).toBe(true);
		vi.restoreAllMocks();
	});

	it("gates Visio edits without making its viewing and navigation surface inert", () => {
		if (!harness.panel) throw new Error("Missing panel");
		harness.panel.readOnly = true;
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		expect(screen.getByTestId("visio")).toHaveAttribute(
			"data-can-edit",
			"false",
		);
		expect(harness.visioProps?.showToolbar).toBe(true);
		expect(harness.visioHandle?.element.inert).not.toBe(true);
		expect(getControls().canSave).toBe(false);
	});

	it("keeps the Visio model and edits when its host filename changes", () => {
		const view = render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		view.rerender(
			<FileVisioView
				config={{
					...config,
					name: "renamed.vsdx",
					path: "/renamed.vsdx",
				}}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		expect(harness.visioHandle?.load).toHaveBeenCalledOnce();
		expect(harness.visioProps?.["aria-label"]).toBe("renamed.vsdx");
		expect(getControls().isDirty).toBe(true);
	});

	it("reports a Visio operation failure without unmounting unsaved work", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		act(() =>
			harness.visioProps?.events?.["document-error"]?.(
				new Error("Unsupported edit"),
			),
		);
		expect(screen.getByTestId("visio")).toBeInTheDocument();
		expect(harness.toastError).toHaveBeenCalledWith(
			"Could not update Visio diagram: Unsupported edit",
		);
		expect(getControls().isDirty).toBe(true);
		expect(getControls().canSave).toBe(true);
		consoleError.mockRestore();
	});

	it("still reports a failed initial Visio load as a blocking load error", async () => {
		if (!harness.visioHandle) throw new Error("Missing viewer");
		harness.visioHandle.load = vi
			.fn()
			.mockRejectedValue(new Error("Invalid diagram"));
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		await waitFor(() =>
			expect(screen.getByText("Invalid diagram")).toBeInTheDocument(),
		);
		expect(screen.queryByTestId("visio")).not.toBeInTheDocument();
	});

	it("acknowledges an unchanged Visio save through the controller", async () => {
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		act(() => getControls().save?.());
		await waitFor(() =>
			expect(
				harness.visioHandle?.controller.markClean,
			).toHaveBeenCalledOnce(),
		);
		expect(getControls().isDirty).toBe(false);
		expect(getControls().canSave).toBe(false);
	});

	it("does not mark a later Visio edit clean when an earlier save completes", async () => {
		let resolveSave: (success: boolean) => void = () => {
			throw new Error("Save not started");
		};
		if (!harness.panel || !harness.visioHandle)
			throw new Error("Missing viewer");
		harness.panel.save = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSave = resolve;
				}),
		);
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		act(() => getControls().save?.());
		const changed = { ...document };
		Object.assign(harness.visioHandle.controller, {
			state: { document: changed },
		});
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document: changed,
				dirty: true,
				kind: "edit",
			}),
		);
		await act(async () => resolveSave(true));
		expect(harness.visioHandle.controller.markClean).not.toHaveBeenCalled();
		expect(getControls().isDirty).toBe(true);
		expect(getControls().canSave).toBe(true);
	});

	it("does not acknowledge a Visio handle after its viewer unmounts", async () => {
		let resolveSave: (success: boolean) => void = () => {
			throw new Error("Save not started");
		};
		if (!harness.panel || !harness.visioHandle)
			throw new Error("Missing viewer");
		harness.panel.save = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSave = resolve;
				}),
		);
		const view = render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		act(() => getControls().save?.());
		view.unmount();
		await act(async () => resolveSave(true));
		expect(harness.visioHandle.controller.markClean).not.toHaveBeenCalled();
	});

	it("preserves Visio dirty state after failed persistence", async () => {
		if (!harness.panel) throw new Error("Missing panel");
		harness.panel.save = vi.fn().mockResolvedValue(false);
		render(
			<FileVisioView
				config={config}
				rename={vi.fn()}
				onControls={onControls}
			/>,
		);
		act(() =>
			harness.visioProps?.events?.["document-change"]?.({
				document,
				dirty: true,
				kind: "edit",
			}),
		);
		act(() => getControls().save?.());
		await waitFor(() => expect(getControls().isBusy).toBe(false));
		expect(
			harness.visioHandle?.controller.markClean,
		).not.toHaveBeenCalled();
		expect(getControls().isDirty).toBe(true);
	});
});
