import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilePanelApi } from "../../hooks/use-file-panel";
import type { FileViewControls } from "../../types/file-view.types";
import { FileDocxView } from "./file-docx-view";
import { FileXlsxView } from "./file-xlsx-view";

interface MockEditorProps {
	showToolbar?: boolean;
	showFormulaBar?: boolean;
	readOnly?: boolean;
	hiddenActions?: readonly string[];
}

const harness = vi.hoisted(() => ({
	panel: undefined as FilePanelApi | undefined,
	docx: undefined as ReturnType<typeof createEditor> | undefined,
	xlsx: undefined as ReturnType<typeof createEditor> | undefined,
	docxProps: undefined as MockEditorProps | undefined,
	xlsxProps: undefined as MockEditorProps | undefined,
}));

vi.mock("docx-react-viewer", async () => {
	const React = await import("react");
	return {
		WordEditor: React.forwardRef((props: MockEditorProps, ref) => {
			const element = harness.docx;
			harness.docxProps = props;
			React.useImperativeHandle(ref, () => ({ element }), [element]);
			return React.createElement("div", { "data-testid": "docx-editor" });
		}),
	};
});
vi.mock("@christophervr/xlsx-react-viewer", async () => {
	const React = await import("react");
	return {
		SpreadsheetEditor: React.forwardRef((props: MockEditorProps, ref) => {
			const element = harness.xlsx;
			harness.xlsxProps = props;
			React.useImperativeHandle(ref, () => ({ element }), [element]);
			return React.createElement("div", { "data-testid": "xlsx-editor" });
		}),
	};
});
vi.mock("../../hooks/use-file-panel", () => ({
	useFilePanel: () => harness.panel,
}));
vi.mock("@semoss/shared", () => ({
	decodeBase64Asset: (data: string) => (data ? new Uint8Array([1]) : null),
	getFileEditorPathScope: () => "resource",
	getFileOperationErrorMessage: (message: string) => message,
}));
vi.mock("@semoss/ui/next", () => ({ toast: { error: vi.fn() } }));
vi.mock("./office/office-viewer-frame", () => ({
	OfficeViewerFrame: ({
		children,
		label,
	}: {
		children: ReactNode;
		label: string;
	}) => <section aria-label={label}>{children}</section>,
}));
vi.mock("./office/office-viewer-error", () => ({
	OfficeViewerError: ({ message }: { message: string }) => (
		<div role="alert">{message}</div>
	),
}));

const createEditor = () =>
	Object.assign(document.createElement("div"), {
		fileName: "",
		dirty: false,
		readOnly: false,
		hiddenActions: [] as readonly string[],
		load: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		saveBytes: vi
			.fn<() => Promise<Uint8Array>>()
			.mockResolvedValue(new Uint8Array([1])),
		markClean: vi.fn(),
		commitEdit: vi.fn(() => true),
	});

beforeEach(() => {
	harness.docx = createEditor();
	harness.xlsx = createEditor();
	harness.panel = {
		access: {
			status: "ready",
			permission: "EDIT",
			readOnly: false,
			refreshing: false,
			refresh: vi.fn().mockResolvedValue("EDIT"),
		},
		readOnly: false,
		targetInsightId: "insight",
		read: {
			status: "SUCCESS",
			data: "AQ==",
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
});
afterEach(cleanup);

describe.each([
	{
		name: "Word",
		View: FileDocxView,
		key: "docx",
		changeEvent: "document-change",
		hidden: "track-changes",
		kept: "insert-table",
	},
	{
		name: "Excel",
		View: FileXlsxView,
		key: "xlsx",
		changeEvent: "workbook-change",
		hidden: "review.new-comment",
		kept: "home.bold",
	},
] as const)("$name file view", ({ View, key, changeEvent, hidden, kept }) => {
	const setup = () => {
		const element = harness[key];
		const panel = harness.panel;
		if (!element || !panel) throw new Error("Missing test editor");
		const onControls = vi.fn<(controls: FileViewControls) => void>();
		const props = {
			config: {
				mode: { type: "USER" as const },
				path: "document",
				name: "document",
			},
			rename: vi.fn(),
			onControls,
		};
		const rendered = render(<View {...props} />);
		const controls = () => {
			const value = onControls.mock.lastCall?.[0];
			if (!value) throw new Error("Missing controls");
			return value;
		};
		return { ...rendered, element, panel, props, controls };
	};

	it("keeps the native editing ribbon and restores required filters after customization", async () => {
		const { element, controls } = setup();
		await waitFor(() => expect(controls().isBusy).toBe(false));
		const props = key === "docx" ? harness.docxProps : harness.xlsxProps;
		expect(
			screen.getByRole("region", {
				name:
					key === "docx"
						? "Word document: document"
						: "Excel workbook: document",
			}),
		).toBeVisible();
		expect(props?.showToolbar).toBe(true);
		expect(props?.hiddenActions).toContain(hidden);
		expect(props?.hiddenActions).not.toContain(kept);
		expect(props?.hiddenActions).not.toContain("file.save");
		if (key === "xlsx") {
			expect(props?.showFormulaBar).toBe(true);
			for (const id of [
				"insert.comment",
				"review.statistics",
				"insert.pivot-table",
				"pivot.settings",
				"insert.slicer",
				"slicer.settings",
				"insert.timeline",
				"timeline.settings",
				"view.custom-views",
				"data.forecast-sheet",
			]) {
				expect(props?.hiddenActions).toContain(id);
			}
			for (const id of [
				"data.sort-ascending",
				"data.filter",
				"insert.chart",
				"review.protect-sheet",
			]) {
				expect(props?.hiddenActions).not.toContain(id);
			}
		}
		act(() => {
			element.hiddenActions = [];
			element.dispatchEvent(
				new CustomEvent("ribbon-customize", { detail: [] }),
			);
		});
		expect(element.hiddenActions).toContain(hidden);
		expect(element.hiddenActions).not.toContain(kept);
	});

	it("routes native Save through panel persistence and cancels other file commands", async () => {
		const { element, panel, controls } = setup();
		await waitFor(() => expect(controls().isBusy).toBe(false));
		act(() => {
			element.dirty = true;
			element.dispatchEvent(new Event(changeEvent));
		});
		expect(controls().canSave).toBe(true);
		const save = new CustomEvent("file-command", {
			detail: { command: "save" },
			cancelable: true,
		});
		act(() => {
			element.dispatchEvent(save);
		});
		await waitFor(() => expect(panel.save).toHaveBeenCalledWith("AQ=="));
		expect(save.defaultPrevented).toBe(true);
		for (const command of ["new", "open", "saveAs", "share", "print"]) {
			const event = new CustomEvent("file-command", {
				detail: { command },
				cancelable: true,
			});
			act(() => {
				element.dispatchEvent(event);
			});
			expect(event.defaultPrevented).toBe(true);
		}
		expect(panel.save).toHaveBeenCalledOnce();
	});

	it("reasserts denied edit permission after the native mode switch", async () => {
		const { element, panel, props, controls, rerender } = setup();
		await waitFor(() => expect(controls().isBusy).toBe(false));
		harness.panel = { ...panel, readOnly: true };
		rerender(<View {...props} />);
		act(() => {
			element.readOnly = false;
			element.dispatchEvent(
				new CustomEvent("readonly-change", {
					detail: key === "docx" ? false : { readOnly: false },
				}),
			);
			element.dirty = true;
			element.dispatchEvent(new Event(changeEvent));
		});
		expect(element.readOnly).toBe(true);
		expect(controls().canSave).toBe(false);
		await act(async () => {
			controls().save?.();
		});
		expect(element.saveBytes).not.toHaveBeenCalled();
		expect(panel.save).not.toHaveBeenCalled();
	});

	it("shows a load failure without leaving the host busy", async () => {
		const element = harness[key];
		if (!element) throw new Error("Missing test editor");
		element.load.mockRejectedValueOnce(new Error("Invalid Office file"));
		const { controls } = setup();
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Invalid Office file",
		);
		await waitFor(() => expect(controls().isBusy).toBe(false));
		expect(controls().canSave).toBe(false);
	});
});
