import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OneDriveViewer } from "./onedrive-viewer";

const sdk = vi.hoisted(() => ({
	// one object each, so hooks keyed on them do not run again every render
	insight: { insightId: "origin", actions: { run: vi.fn() } },
	listing: {
		count: 0,
		files: [] as { id: string; name: string; isFolder?: boolean }[],
	},
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
	useTranslation: () => ({
		t: (key: string, options?: { count?: number }) =>
			options?.count === undefined ? key : `${key}(${options.count})`,
		i18n: { dir: () => "ltr", language: "en" },
	}),
}));

let root: Root;
let container: HTMLDivElement;

const list = (count: number) => {
	sdk.listing = {
		count: count,
		files: Array.from({ length: count }, (_, index) => ({
			id: `item-${index}`,
			name: `File ${index}.txt`,
		})),
	};
};
const render = async () => {
	await act(async () => root.render(<OneDriveViewer />));
};
const note = () =>
	document.querySelector('[data-testid="file-explorer-listing-note"]')
		?.textContent;
const showShared = async () => {
	const tab = Array.from(document.querySelectorAll('[role="tab"]')).find(
		(element) => element.textContent === "onedrive.shared",
	);
	if (!tab) throw new Error("No Shared with Me tab");
	// the tabs change on the press, not on the click that follows it
	await act(async () => {
		tab.dispatchEvent(
			new MouseEvent("mousedown", { bubbles: true, button: 0 }),
		);
	});
};

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
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("says nothing under a folder of the user's own that was read whole", async () => {
	list(3);
	await render();
	expect(note()).toBeUndefined();
});

it("says a listing stopped at the drive's limit, so a file past it is not taken for missing", async () => {
	list(200);
	await render();
	expect(note()).toBe("common.limitReached(200)");
});

it("says what is shared with the user comes from Microsoft's search, which lists a new share late", async () => {
	list(3);
	await render();
	await showShared();
	expect(note()).toBe("onedrive.sharedNote");

	list(200);
	await render();
	expect(note()).toBe("common.limitReached(200) onedrive.sharedNote");
});

it("gives each file the host's own action in place of the chat's, and folders none", async () => {
	sdk.listing = {
		count: 2,
		files: [
			{ id: "folder-1", name: "Reports", isFolder: true },
			{ id: "item-1", name: "Plan.docx" },
		],
	};
	const onLink = vi.fn();
	await act(async () =>
		root.render(
			<OneDriveViewer
				getFileAction={(file) => ({
					name: `Link ${file.name}`,
					icon: null,
					tooltip: "Link",
					action: async () => onLink(file.id),
				})}
			/>,
		),
	);
	const labels = Array.from(document.querySelectorAll("button"), (button) =>
		button.getAttribute("aria-label"),
	);
	expect(labels).toContain("Link Plan.docx");
	expect(labels).not.toContain("Link Reports");
	// saving into a chat's files is not offered beside it
	expect(labels).not.toContain("actions.save");

	await act(async () =>
		document
			.querySelector<HTMLElement>('[aria-label="Link Plan.docx"]')
			?.click(),
	);
	expect(onLink).toHaveBeenCalledWith("item-1");
});
