import type { InsightActions } from "@/lib/pixel";
import { PixelError, pixel } from "@/lib/pixel";

/** One Outlook folder a draft can be left in; path reads "Inbox / Teamwork" for a subfolder. */
export interface DraftFolder {
	id: string;
	name: string;
	path: string;
}

type Row = Record<string, unknown>;

const str = (value: unknown): string =>
	typeof value === "string" ? value : "";

async function run(actions: InsightActions, statement: string): Promise<Row> {
	const response = await actions.run<[unknown]>(statement);
	const entry = response?.pixelReturn?.[0];
	if (!entry)
		throw new PixelError("SEMOSS returned an empty result.", statement);
	if (entry.operationType?.includes("ERROR"))
		throw new PixelError(String(entry.output), statement);
	return (entry.output ?? {}) as Row;
}

function toFolder(row: Row): DraftFolder {
	const name = str(row.name);
	return { id: str(row.id), name, path: str(row.path) || name };
}

/** The top-level folders of the owner's mailbox and one level below them, without Drafts. */
export async function listDraftFolders(
	actions: InsightActions,
): Promise<DraftFolder[]> {
	const out = await run(actions, pixel("BrainListDraftFolders"));
	return (Array.isArray(out.folders) ? (out.folders as Row[]) : [])
		.map(toFolder)
		.filter((folder) => folder.id);
}

/** Makes the folder in Outlook, or returns the one that already has that name. */
export async function createDraftFolder(
	actions: InsightActions,
	name: string,
	inInbox: boolean,
): Promise<DraftFolder> {
	const folder = toFolder(
		await run(actions, pixel("BrainCreateDraftFolder", { name, inInbox })),
	);
	if (!folder.id) throw new Error("Outlook did not confirm the new folder.");
	return folder;
}
