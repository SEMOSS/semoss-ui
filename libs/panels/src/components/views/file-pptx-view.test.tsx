import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilePanelApi } from "../../hooks/use-file-panel";
import type { FileViewControls } from "../../types/file-view.types";
import { FilePptxView } from "./file-pptx-view";

const state = vi.hoisted(() => ({
	panel: undefined as FilePanelApi | undefined,
	dirty: (_value: boolean) => {},
	snapshot: vi.fn(async () => ({
		revision: 4,
		content: new Uint8Array([2]),
	})),
	acknowledge: vi.fn<() => { status: "clean" | "pending" }>(() => ({
		status: "clean",
	})),
}));

vi.mock("pptx-react-viewer", async () => {
	const React = await import("react");
	return {
		THEME_CATALOG: [],
		PowerPointViewer: React.forwardRef(
			(
				{ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void },
				ref,
			) => {
				state.dirty = onDirtyChange;
				React.useImperativeHandle(
					ref,
					() => ({
						getSaveSnapshot: state.snapshot,
						acknowledgeSave: state.acknowledge,
					}),
					[],
				);
				return <div />;
			},
		),
	};
});
vi.mock("pptx-react-viewer/i18n", () => ({ translationsEn: {} }));
vi.mock("@semoss/i18n", () => ({
	getI18n: () => null,
	useTranslation: () => ({ i18n: null }),
}));
vi.mock("@semoss/ui/next", () => ({
	toast: { error: vi.fn() },
	useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("@semoss/shared", () => ({
	decodeBase64Asset: () => new Uint8Array([1]),
	getFileEditorPathScope: () => "resource",
	getFileOperationErrorMessage: (message: string) => message,
}));
vi.mock("../../hooks/use-file-panel", () => ({
	useFilePanel: () => state.panel,
}));
vi.mock("./office/office-viewer-frame", () => ({
	OfficeViewerFrame: ({ children }: { children: ReactNode }) => (
		<section>{children}</section>
	),
}));
vi.mock("./office/office-viewer-error", () => ({
	OfficeViewerError: () => <div role="alert" />,
}));

const config = {
	mode: { type: "USER" as const },
	name: "deck.pptx",
	path: "/deck.pptx",
};

beforeEach(() => {
	vi.clearAllMocks();
	state.acknowledge.mockReturnValue({ status: "clean" });
	state.snapshot.mockResolvedValue({
		revision: 4,
		content: new Uint8Array([2]),
	});
	state.panel = {
		access: {
			status: "ready",
			readOnly: false,
			permission: "EDIT",
			refreshing: false,
			refresh: vi.fn(),
		},
		readOnly: false,
		targetInsightId: "insight",
		read: {
			status: "SUCCESS",
			data: "AQ==",
			revision: 1,
			refresh: vi.fn(),
		},
		save: vi.fn(async () => true),
		download: vi.fn(),
		isDownloading: false,
		isBusy: false,
		gate: null,
		readGate: null,
	};
});
afterEach(cleanup);

/** Mount the real host Save adapter with a controllable native snapshot and persistence. */
const setup = async () => {
	const onControls = vi.fn<(controls: FileViewControls) => void>();
	const rendered = render(
		<FilePptxView
			rename={vi.fn()}
			config={config}
			onControls={onControls}
		/>,
	);
	const controls = () => {
		const value = onControls.mock.lastCall?.[0];
		if (!value) throw new Error("Missing file controls");
		return value;
	};
	await act(async () => {});
	act(() => state.dirty(true));
	return { ...rendered, controls, onControls };
};

describe("PowerPoint host persistence", () => {
	it("acknowledges the stored revision and clears the host dirty indicator", async () => {
		const { controls } = await setup();
		await act(async () => controls().save?.());
		expect(state.panel?.save).toHaveBeenCalledWith("Ag==");
		expect(state.acknowledge).toHaveBeenCalledWith(4);
		expect(controls().isDirty).toBe(false);
	});

	it("keeps newer edits dirty when acknowledgement reports a pending revision", async () => {
		state.acknowledge.mockReturnValue({ status: "pending" });
		const { controls } = await setup();
		await act(async () => controls().save?.());
		expect(state.acknowledge).toHaveBeenCalledWith(4);
		expect(controls().isDirty).toBe(true);
	});

	it("never acknowledges a refused host write", async () => {
		if (!state.panel) throw new Error("Missing panel");
		state.panel.save = vi.fn(async () => false);
		const { controls } = await setup();
		await act(async () => controls().save?.());
		expect(state.acknowledge).not.toHaveBeenCalled();
		expect(controls().isDirty).toBe(true);
	});

	it("does not acknowledge a write that finishes after the resource is renamed", async () => {
		let finish: (saved: boolean) => void = () => {};
		if (!state.panel) throw new Error("Missing panel");
		state.panel.save = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					finish = resolve;
				}),
		);
		const { controls, rerender, onControls } = await setup();
		act(() => controls().save?.());
		await waitFor(() => expect(state.panel?.save).toHaveBeenCalledOnce());
		rerender(
			<FilePptxView
				rename={vi.fn()}
				config={{
					...config,
					path: "/renamed.pptx",
					name: "renamed.pptx",
				}}
				onControls={onControls}
			/>,
		);
		await act(async () => finish(true));
		expect(state.acknowledge).not.toHaveBeenCalled();
		expect(controls().isDirty).toBe(true);
	});

	it("does not persist after permissions are revoked during serialization", async () => {
		let finish: (snapshot: {
			revision: number;
			content: Uint8Array<ArrayBuffer>;
		}) => void = () => {};
		state.snapshot.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		const { controls, rerender, onControls } = await setup();
		act(() => controls().save?.());
		if (!state.panel) throw new Error("Missing panel");
		state.panel = { ...state.panel, readOnly: true };
		rerender(
			<FilePptxView
				rename={vi.fn()}
				config={config}
				onControls={onControls}
			/>,
		);
		await act(async () =>
			finish({ revision: 4, content: new Uint8Array([2]) }),
		);
		expect(state.panel.save).not.toHaveBeenCalled();
		expect(state.acknowledge).not.toHaveBeenCalled();
	});
});
