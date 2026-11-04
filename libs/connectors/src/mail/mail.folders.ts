import type { MailFolder } from "./mail.types";

/** The inbox's well known name, which every mailbox takes in place of its id. */
export const INBOX = "inbox";

/**
 * The folders a mailbox offers, in the order its folder picker shows them: the
 * inbox first, under its well known name and followed by the folders inside
 * it, then every other folder, each right after the one it sits in.
 *
 * @param folders - The mailbox's folders, as `ListMailFolders` orders them.
 * @param inboxName - What to call the inbox.
 * @return The folders to offer.
 */
export const orderMailFolders = (
	folders: readonly MailFolder[],
	inboxName: string,
): MailFolder[] => {
	// the inbox's own entry is replaced by the well known one, keeping its
	// counts, so it is not listed twice, and the folders inside it move up
	// with it; the mailbox names it, whatever it is called in the user's
	// language, and a listing that does not is matched by its English name
	const byWellKnownName = folders.findIndex(
		(folder) => folder.wellKnownName === INBOX,
	);
	const start =
		byWellKnownName >= 0
			? byWellKnownName
			: folders.findIndex(
					(folder) =>
						folder.depth === 0 &&
						folder.name.toLowerCase() === INBOX,
				);
	const inbox: MailFolder = {
		id: INBOX,
		name: inboxName,
		depth: 0,
		wellKnownName: INBOX,
		totalCount: folders[start]?.totalCount,
		unreadCount: folders[start]?.unreadCount,
	};
	if (start < 0) {
		return [inbox, ...folders];
	}
	let end = start + 1;
	while (end < folders.length && folders[end].depth > folders[start].depth) {
		end++;
	}
	return [
		inbox,
		...folders.slice(start + 1, end),
		...folders.slice(0, start),
		...folders.slice(end),
	];
};

/**
 * What to call a folder once it is chosen, away from the tree that shows where
 * it sits: its path for a nested folder, such as `Inbox/Projects`, and its
 * name otherwise.
 *
 * @param folder - The folder.
 * @return The label.
 */
export const getMailFolderLabel = (folder: MailFolder): string =>
	folder.depth > 0 && folder.path ? folder.path : folder.name;

/** A folder with the folders inside it, as the folder tree shows them. */
export interface MailFolderNode {
	folder: MailFolder;
	children: MailFolderNode[];
}

/**
 * Nest the folders the way a mail app's folder tree shows them. Each folder
 * goes under the closest folder before it that is one level up, which is the
 * folder it sits in, since a listing puts every folder right after its
 * parent. Going by order rather than parent id is what keeps the inbox's
 * folders under the inbox once it goes by its well known name.
 *
 * @param folders - The folders, each right after the one it sits in.
 * @return The folders at the top of the mailbox, each holding its own.
 */
export const buildMailFolderTree = (
	folders: readonly MailFolder[],
): MailFolderNode[] => {
	const roots: MailFolderNode[] = [];
	// the last folder seen at each depth, the parents of what follows
	const parents: MailFolderNode[] = [];
	for (const folder of folders) {
		const node: MailFolderNode = { folder: folder, children: [] };
		// a folder deeper than any open parent allows hangs off the deepest one
		const depth = Math.min(folder.depth, parents.length);
		parents.length = depth;
		const parent = depth > 0 ? parents[depth - 1] : undefined;
		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
		parents.push(node);
	}
	return roots;
};
