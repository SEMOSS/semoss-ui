import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { FileExplorerAdapter } from "@semoss/shared";
import {
	createOneDriveAdapter,
	createOneDriveSharedAdapter,
} from "../microsoft/microsoft-drive.adapters";
import { ConnectorFileExplorer } from "./connector-file-explorer";

const sdk = vi.hoisted(() => ({
	// one object each, so hooks keyed on them do not run again every render
	insight: {
		insightId: "origin",
		actions: { run: vi.fn(), uploadInsight: vi.fn() },
	},
	listing: { files: [] },
	refresh: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => sdk.insight,
	usePixel: () => ({
		status: "SUCCESS",
		data: sdk.listing,
		refresh: sdk.refresh,
	}),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

// an adapter's identity has to be stable, as a viewer keeps it
const mine = createOneDriveAdapter();
const shared = createOneDriveSharedAdapter();
const saver = { saveLabel: "Save", isBusy: () => false, save: vi.fn() };
let root: Root;
let container: HTMLDivElement;

const render = async (adapter: FileExplorerAdapter) => {
	await act(async () =>
		root.render(
			<ConnectorFileExplorer
				adapter={adapter}
				serviceName="OneDrive"
				saver={saver}
				getSaveRequest={() => undefined}
				getWebUrl={() => undefined}
			/>,
		),
	);
};
const find = (testId: string) =>
	document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
const click = async (element: HTMLElement | null | undefined) => {
	if (!element) throw new Error("Nothing to click");
	await act(async () => element.click());
};
const button = (text: string) =>
	Array.from(document.querySelectorAll("button")).find(
		(element) => element.textContent === text,
	);
const pixels = () => sdk.insight.actions.run.mock.calls.map(([pixel]) => pixel);

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	sdk.insight.actions.run.mockReset().mockResolvedValue({ pixelReturn: [] });
	sdk.insight.actions.uploadInsight
		.mockReset()
		.mockImplementation(async (folder: string, files: File[]) => ({
			data: files.map((file) => ({
				fileName: file.name,
				fileLocation: `/${folder}/${file.name}`,
			})),
		}));
	sdk.refresh.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("creates a new file in the user's own drive, not in the chat's files", async () => {
	await render(mine);
	await click(find("file-explorer-new-button"));
	await click(find("new-file-overlay-action-add_file"));

	const name = find("new-file-overlay-name-input");
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set?.call(name, "notes.txt");
		name?.dispatchEvent(new Event("input", { bubbles: true }));
	});
	await click(button("fileExplorer.overlay.buttons.create"));

	expect(pixels()).toEqual([
		'MicrosoftOneDriveCreateFile(name=["<encode>notes.txt</encode>"]);',
	]);
	// the folder is read again, so the new file shows
	expect(sdk.refresh).toHaveBeenCalled();
});

it("uploads a file from the computer into the user's own drive, leaving none in the chat's files", async () => {
	await render(mine);
	await click(find("file-explorer-new-button"));
	await click(find("new-file-overlay-action-upload"));

	const chooser = document.querySelector('input[type="file"]');
	await act(async () => {
		if (!chooser) throw new Error("No file chooser");
		Object.defineProperty(chooser, "files", {
			value: [new File(["x"], "Plan.docx")],
		});
		chooser.dispatchEvent(new Event("change", { bubbles: true }));
	});
	await click(button("fileExplorer.overlay.buttons.upload"));

	const [folder] = sdk.insight.actions.uploadInsight.mock.calls[0];
	expect(pixels()).toEqual([
		`MicrosoftOneDriveUploadFile(filePath=["<encode>/${folder}/Plan.docx</encode>"], name=["<encode>Plan.docx</encode>"]);`,
		`DeleteInsightAssets(filePath=["${folder}"]);`,
	]);
	expect(sdk.refresh).toHaveBeenCalled();
});

it("offers no New for a drive that only browses", async () => {
	await render(shared);
	expect(find("file-explorer")).not.toBeNull();
	expect(find("file-explorer-new-button")).toBeNull();
});
