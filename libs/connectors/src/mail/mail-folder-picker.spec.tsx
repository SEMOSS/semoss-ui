import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MailFolder } from "./mail.types";
import { MailFolderPicker } from "./mail-folder-picker";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { count?: number; folder?: string }) =>
			options?.count !== undefined
				? `${key}:${options.count}`
				: options?.folder !== undefined
					? `${key}:${options.folder}`
					: key,
	}),
}));

const FOLDERS: MailFolder[] = [
	{ id: "inbox", name: "Inbox", depth: 0, unreadCount: 4 },
	{ id: "irs", name: "IRS", depth: 1, path: "Inbox/IRS" },
	{ id: "zoho", name: "Zoho", depth: 1, path: "Inbox/Zoho" },
	{ id: "receipts", name: "Receipts", depth: 2, path: "Inbox/Zoho/Receipts" },
	{ id: "archive", name: "Archive", depth: 0 },
];
let root: Root;
let container: HTMLDivElement;
const choose = vi.fn<(folderId: string) => void>();

const render = async () => {
	await act(async () =>
		root.render(
			<MailFolderPicker
				folders={FOLDERS}
				value="inbox"
				label="Inbox"
				onValueChange={choose}
			/>,
		),
	);
};
const open = async () => {
	const trigger = container.querySelector<HTMLButtonElement>(
		'button[aria-label="mail.folderPicker:Inbox"]',
	);
	expect(trigger).not.toBeNull();
	await act(async () => trigger?.click());
};
const tree = () => document.body.querySelector('[role="tree"]');
/** The tree's row for a folder, by the name it shows. */
const row = (name: string) =>
	Array.from(document.body.querySelectorAll('[role="treeitem"]')).find(
		(item) =>
			item.querySelector('[role="button"]')?.firstElementChild
				?.firstElementChild?.textContent === name,
	);
const names = () =>
	Array.from(document.body.querySelectorAll('[role="treeitem"]')).map(
		(item) =>
			item.querySelector('[role="button"]')?.firstElementChild
				?.firstElementChild?.textContent,
	);

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
	choose.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	document.body.replaceChildren();
	vi.unstubAllGlobals();
});

it("opens on the inbox and its folders, the deeper ones closed", async () => {
	await render();
	expect(tree()).toBeNull();
	await open();
	expect(tree()).not.toBeNull();
	expect(names()).toEqual(["Inbox", "IRS", "Zoho", "Archive"]);
	expect(row("Inbox")?.getAttribute("aria-expanded")).toBe("true");
	expect(row("Zoho")?.getAttribute("aria-expanded")).toBe("false");
	expect(row("Archive")?.hasAttribute("aria-expanded")).toBe(false);
	expect(row("Inbox")?.getAttribute("aria-selected")).toBe("true");
});

it("opens and closes a folder that holds others with its chevron", async () => {
	await render();
	await open();
	const expand = row("Zoho")?.querySelector<HTMLButtonElement>(
		'button[aria-label="Expand"]',
	);
	await act(async () => expand?.click());
	expect(names()).toContain("Receipts");
	expect(row("Zoho")?.getAttribute("aria-expanded")).toBe("true");
	expect(choose).not.toHaveBeenCalled();

	const collapse = row("Zoho")?.querySelector<HTMLButtonElement>(
		'button[aria-label="Collapse"]',
	);
	await act(async () => collapse?.click());
	expect(names()).not.toContain("Receipts");
});

it("reads a nested folder picked and closes the tree", async () => {
	await render();
	await open();
	await act(async () =>
		row("Zoho")
			?.querySelector<HTMLButtonElement>('button[aria-label="Expand"]')
			?.click(),
	);
	await act(async () =>
		row("Receipts")?.querySelector<HTMLElement>('[role="button"]')?.click(),
	);
	expect(choose).toHaveBeenCalledWith("receipts");
	expect(tree()).toBeNull();
});

it("shows how many of a folder's emails nobody has opened", async () => {
	await render();
	await open();
	const inbox = row("Inbox");
	expect(inbox?.textContent).toContain("4");
	expect(inbox?.querySelector(".sr-only")?.textContent).toBe(
		"mail.unreadCount:4",
	);
	expect(row("IRS")?.querySelector(".sr-only")).toBeNull();
});
