import { Insight } from "@semoss/sdk";
import type { InsightActions } from "@/lib/pixel";
import type { SourceAttachment, StagedSourceAttachment } from "../types";
import { downloadStagedAttachment, stageMailAttachment } from "./microsoft";

interface DownloadOwner {
	/** The parent insight identifies the current signed-in application scope. */
	insightId: string;
	actions: InsightActions;
}

interface DownloadScope {
	parentInsightId: string;
	insight: Insight;
	initializing: Promise<void> | null;
	files: Map<string, Promise<StagedSourceAttachment>>;
}

/** One attachment staged in the download area, with the actions that can read it. */
export interface IsolatedAttachment {
	file: StagedSourceAttachment;
	actions: InsightActions;
}

const scopes = new WeakMap<InsightActions, DownloadScope>();
const MAX_CACHED_FILES = 50;

/**
 * Download and preview files never enter an insight bound to an assistant room.
 * The SDK resolves browser downloads after clicking a link, before the transfer
 * completes. Keep the isolated insight alive for the backend session instead of
 * destroying its files on navigation. Weak ownership bounds the client cache to
 * the application scope; reinitialized parents receive a separate download area.
 */
async function readyScope(owner: DownloadOwner): Promise<DownloadScope> {
	if (!owner.insightId)
		throw new Error(
			"Wait for the workspace to connect before downloading.",
		);
	let scope = scopes.get(owner.actions);
	if (!scope || scope.parentInsightId !== owner.insightId) {
		scope = {
			parentInsightId: owner.insightId,
			insight: new Insight(),
			initializing: null,
			files: new Map(),
		};
		scopes.set(owner.actions, scope);
	}
	const downloadScope = scope;
	if (!downloadScope.insight.isReady) {
		if (!downloadScope.initializing) {
			downloadScope.files.clear();
			downloadScope.initializing = (async () => {
				await downloadScope.insight.initialize({ disableRoom: true });
				if (
					!downloadScope.insight.isReady ||
					!downloadScope.insight.insightId
				)
					throw new Error(
						"Could not prepare the attachment download. Please try again.",
					);
			})().finally(() => {
				downloadScope.initializing = null;
			});
		}
		await downloadScope.initializing;
	}
	return downloadScope;
}

/**
 * Stage one attachment into the download area once; later downloads and
 * previews of the same key reuse that copy.
 *
 * @param owner - The application scope that owns the download area.
 * @param key - Identifies the attachment across calls.
 * @param stage - Writes the file into the given insight.
 * @returns The staged file and the actions of the insight holding it.
 */
export async function stageAttachmentIsolated(
	owner: DownloadOwner,
	key: string,
	stage: (
		actions: InsightActions,
		insightId: string,
	) => Promise<StagedSourceAttachment>,
): Promise<IsolatedAttachment> {
	const { insight, files } = await readyScope(owner);
	let staged = files.get(key);
	if (!staged) {
		staged = stage(insight.actions, insight.insightId);
		files.set(key, staged);
		while (files.size > MAX_CACHED_FILES) {
			const oldest = files.keys().next().value;
			if (oldest === undefined) break;
			files.delete(oldest);
		}
	}
	try {
		return { file: await staged, actions: insight.actions };
	} catch (cause: unknown) {
		// A new explicit click may retry; failed requests never retry themselves.
		if (files.get(key) === staged) files.delete(key);
		throw cause;
	}
}

/**
 * Stage an imported Outlook message's attachment through the connector.
 *
 * @param owner - The application scope that owns the download area.
 * @param sourceUid - The Outlook message carrying the attachment.
 * @param attachment - One of its file attachments.
 * @returns The staged file and the actions of the insight holding it.
 */
export async function stageMailAttachmentIsolated(
	owner: DownloadOwner,
	sourceUid: string,
	attachment: SourceAttachment,
): Promise<IsolatedAttachment> {
	if (!attachment.isFile)
		throw new Error("Open this linked or embedded attachment in Outlook.");
	return stageAttachmentIsolated(
		owner,
		JSON.stringify([sourceUid, attachment.id]),
		(actions, insightId) =>
			stageMailAttachment(
				actions,
				insightId,
				sourceUid,
				attachment.id,
				attachment.name,
			),
	);
}

/**
 * Download an imported Outlook message's attachment without it entering a room.
 *
 * @param owner - The application scope that owns the download area.
 * @param sourceUid - The Outlook message carrying the attachment.
 * @param attachment - One of its file attachments.
 */
export async function downloadMailAttachmentIsolated(
	owner: DownloadOwner,
	sourceUid: string,
	attachment: SourceAttachment,
): Promise<void> {
	const { file, actions } = await stageMailAttachmentIsolated(
		owner,
		sourceUid,
		attachment,
	);
	await downloadStagedAttachment(actions, file);
}
