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

const scopes = new WeakMap<InsightActions, DownloadScope>();
const MAX_CACHED_FILES = 50;

/**
 * Download-only files never enter an insight bound to an assistant room.
 * The SDK resolves browser downloads after clicking a link, before the transfer
 * completes. Keep the isolated insight alive for the backend session instead of
 * destroying its files on navigation. Weak ownership bounds the client cache to
 * the application scope; reinitialized parents receive a separate download area.
 */
export async function downloadMailAttachmentIsolated(
	owner: DownloadOwner,
	sourceUid: string,
	attachment: SourceAttachment,
): Promise<void> {
	if (!owner.insightId)
		throw new Error(
			"Wait for the workspace to connect before downloading.",
		);
	if (!attachment.isFile)
		throw new Error("Open this linked or embedded attachment in Outlook.");
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
	const { insight, files } = downloadScope;
	const key = JSON.stringify([sourceUid, attachment.id]);
	let staged = files.get(key);
	if (!staged) {
		staged = stageMailAttachment(
			insight.actions,
			insight.insightId,
			sourceUid,
			attachment.id,
			attachment.name,
		);
		files.set(key, staged);
		while (files.size > MAX_CACHED_FILES) {
			const oldest = files.keys().next().value;
			if (oldest === undefined) break;
			files.delete(oldest);
		}
	}
	try {
		const file = await staged;
		await downloadStagedAttachment(insight.actions, file);
	} catch (cause: unknown) {
		// A new explicit click may retry; failed requests never retry themselves.
		if (files.get(key) === staged) files.delete(key);
		throw cause;
	}
}
