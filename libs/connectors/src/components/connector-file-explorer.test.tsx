import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { FileExplorerAdapter } from "@semoss/shared";
import {
	createOneDriveAdapter,
	createOneDriveSharedAdapter,
	getDriveSaveRequest,
} from "../microsoft/microsoft-drive.adapters";
import { ConnectorFileExplorer } from "./connector-file-explorer";

const sdk = vi.hoisted(() => ({
	// one object each, so hooks keyed on them do not run again every render
	insight: {
		insightId: "origin",
		actions: { run: vi.fn(), uploadInsight: vi.fn() },
	},
	listing: { files: [] as unknown[] },
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
	// a listed row formats its date for the language
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

// an adapter's identity has to be stable, as a viewer keeps it
const mine = createOneDriveAdapter();
const shared = createOneDriveSharedAdapter();
const saver = {
	saveLabel: "Save",
	isBusy: () => false,
	savedLabel: (): string | undefined => undefined,
	save: vi.fn(),
};
let root: Root;
let container: HTMLDivElement;

const render = async (
	adapter: FileExplorerAdapter,
	host: Partial<
		Pick<
			ComponentProps<typeof ConnectorFileExplorer>,
			| "isVisible"
			| "refreshRequestId"
			| "listingNote"
			| "saver"
			| "getSaveRequest"
		>
	> = {},
) => {
	await act(async () =>
		root.render(
			<ConnectorFileExplorer
				adapter={adapter}
				serviceName="OneDrive"
				saver={saver}
				getSaveRequest={() => undefined}
				getWebUrl={() => undefined}
				{...host}
			/>,
		),
	);
};
// the clock the explorer reads to tell how old its listing is
let now = 0;
const comeBackToTheWindow = async () => {
	await act(async () => {
		window.dispatchEvent(new Event("focus"));
	});
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
	sdk.listing.files = [];
	saver.save.mockReset();
	now = 1_000_000;
	vi.spyOn(Date, "now").mockImplementation(() => now);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
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

it("reads the drive again when the user comes back to the window, once the listing is half a minute old", async () => {
	await render(mine);

	now += 29_000;
	await comeBackToTheWindow();
	expect(sdk.refresh).not.toHaveBeenCalled();

	now += 2_000;
	await comeBackToTheWindow();
	expect(sdk.refresh).toHaveBeenCalledTimes(1);

	// flicking between windows right after does not ask the drive again
	await comeBackToTheWindow();
	expect(sdk.refresh).toHaveBeenCalledTimes(1);
});

it("reads the drive again when its tab is shown again, and never while it is hidden", async () => {
	await render(mine, { isVisible: false });
	now += 60_000;
	await comeBackToTheWindow();
	expect(sdk.refresh).not.toHaveBeenCalled();

	await render(mine, { isVisible: true });
	expect(sdk.refresh).toHaveBeenCalledTimes(1);
});

it("reads the drive again each time the host says it may have changed", async () => {
	await render(mine, { refreshRequestId: 0 });
	expect(sdk.refresh).not.toHaveBeenCalled();

	await render(mine, { refreshRequestId: 1 });
	expect(sdk.refresh).toHaveBeenCalledTimes(1);

	// another render with the same request is not another request
	await render(mine, { refreshRequestId: 1 });
	expect(sdk.refresh).toHaveBeenCalledTimes(1);

	await render(mine, { refreshRequestId: 2 });
	expect(sdk.refresh).toHaveBeenCalledTimes(2);
});

it("says a file the host already holds is held, in place of saving it again", async () => {
	sdk.listing.files = [
		{ id: "held", name: "Held.docx" },
		{ id: "free", name: "Free.docx" },
	];
	const rowButton = (name: string, label: string) =>
		Array.from(document.querySelectorAll('[role="treeitem"]'))
			.find((row) => row.textContent?.includes(name))
			?.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
	await render(mine, {
		saver: {
			...saver,
			savedLabel: (key) => (key === "held" ? "In the host" : undefined),
		},
		getSaveRequest: (row) =>
			getDriveSaveRequest(row, () => () => "Download();"),
	});

	// the translation stand-in answers a key: this one is the held label with the file's name
	await click(rowButton("Held.docx", "actions.named"));
	expect(rowButton("Held.docx", "Save")).toBeNull();
	expect(saver.save).not.toHaveBeenCalled();

	await click(rowButton("Free.docx", "Save"));
	expect(saver.save).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ key: "free" }),
	);
});

it("shows the host's note under the listing it is about", async () => {
	await render(mine, {
		listingNote: (items, path) => `${items.length} listed in ${path}`,
	});
	expect(find("file-explorer-listing-note")?.textContent).toBe(
		"0 listed in /",
	);

	await render(mine, { listingNote: () => undefined });
	expect(find("file-explorer-listing-note")).toBeNull();
});
