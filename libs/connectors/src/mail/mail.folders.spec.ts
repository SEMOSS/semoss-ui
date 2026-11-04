import { describe, expect, it } from "vitest";
import {
	buildMailFolderTree,
	getMailFolderLabel,
	INBOX,
	type MailFolderNode,
	orderMailFolders,
} from "./mail.folders";
import type { MailFolder } from "./mail.types";

const folder = (
	id: string,
	path: string,
	depth: number,
	parentId?: string,
): MailFolder => ({
	id: id,
	name: path.slice(path.lastIndexOf("/") + 1),
	path: path,
	depth: depth,
	parentId: parentId,
});

describe("mail folders", () => {
	it("puts the inbox first with the folders inside it", () => {
		const ordered = orderMailFolders(
			[
				folder("archive", "Archive", 0),
				folder("inbox-id", "Inbox", 0),
				folder("projects", "Inbox/Projects", 1, "inbox-id"),
				folder("alpha", "Inbox/Projects/Alpha", 2, "projects"),
				folder("sent", "Sent Items", 0),
				folder("old", "Sent Items/Old", 1, "sent"),
			],
			"Inbox",
		);
		expect(ordered.map((entry) => entry.id)).toEqual([
			INBOX,
			"projects",
			"alpha",
			"archive",
			"sent",
			"old",
		]);
		expect(ordered[0]).toEqual({ id: INBOX, name: "Inbox", depth: 0 });
	});

	it("keeps a nested folder that happens to be called Inbox", () => {
		const ordered = orderMailFolders(
			[
				folder("clients", "Clients", 0),
				folder("nested", "Clients/Inbox", 1, "clients"),
			],
			"Inbox",
		);
		expect(ordered.map((entry) => entry.id)).toEqual([
			INBOX,
			"clients",
			"nested",
		]);
	});

	it("offers the inbox even when the mailbox does not list it", () => {
		expect(orderMailFolders([], "Inbox")).toEqual([
			{ id: INBOX, name: "Inbox", depth: 0 },
		]);
	});

	it("labels a chosen nested folder by its path", () => {
		expect(
			getMailFolderLabel(folder("irs", "Inbox/IRS", 1, "inbox-id")),
		).toBe("Inbox/IRS");
		expect(getMailFolderLabel(folder("archive", "Archive", 0))).toBe(
			"Archive",
		);
		expect(getMailFolderLabel({ id: "x", name: "X", depth: 2 })).toBe("X");
	});

	it("keeps the inbox's counts under its well known name", () => {
		const [inbox] = orderMailFolders(
			[
				{
					...folder("inbox-id", "Inbox", 0),
					unreadCount: 4,
					totalCount: 9,
				},
			],
			"Inbox",
		);
		expect(inbox).toEqual({
			id: INBOX,
			name: "Inbox",
			depth: 0,
			unreadCount: 4,
			totalCount: 9,
		});
	});

	it("nests each folder under the one it sits in, the inbox included", () => {
		const tree = buildMailFolderTree(
			orderMailFolders(
				[
					folder("inbox-id", "Inbox", 0),
					folder("irs", "Inbox/IRS", 1, "inbox-id"),
					folder("zoho", "Inbox/Zoho", 1, "inbox-id"),
					folder("receipts", "Inbox/Zoho/Receipts", 2, "zoho"),
					folder("archive", "Archive", 0),
				],
				"Inbox",
			),
		);
		const shape = (nodes: MailFolderNode[]): unknown[] =>
			nodes.map((node) =>
				node.children.length > 0
					? { [node.folder.id]: shape(node.children) }
					: node.folder.id,
			);
		expect(shape(tree)).toEqual([
			{ [INBOX]: ["irs", { zoho: ["receipts"] }] },
			"archive",
		]);
	});

	it("hangs a folder deeper than its listing allows off the deepest one", () => {
		const tree = buildMailFolderTree([
			folder("a", "A", 0),
			folder("c", "A/B/C", 2),
		]);
		expect(tree).toHaveLength(1);
		expect(tree[0].children.map((node) => node.folder.id)).toEqual(["c"]);
	});
});
