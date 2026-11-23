import { useState } from "react";
import {
	type ConnectorSavedFile,
	type SavedMailAttachments,
	saveMailAttachments,
} from "@semoss/connectors";
import { useInsight } from "@semoss/sdk/react";

// what the mail viewer knows a saved email by: its thread
const THREAD_KEY = "conversation:";

interface TwinMailAttachments {
	/** How many of the emails added so far can still have their attachments added. */
	pending: number;
	/** Whether their attachments are being saved into the page's files. */
	isSaving: boolean;
	/** Tell of an item that was just added: an email is remembered, anything else is not. */
	offer: (
		file: Partial<Pick<ConnectorSavedFile, "service" | "itemKey">>,
	) => void;
	/**
	 * Save the attachments of every email remembered into the page's files,
	 * for the host to add as it adds anything a viewer saved. The emails are
	 * forgotten once all of them are read.
	 *
	 * @throws when an email or one of its attachments could not be read; the
	 * emails stay remembered, to try again.
	 */
	save: () => Promise<SavedMailAttachments>;
}

/**
 * What adding attachments did, in a sentence or two.
 *
 * @param count - How many were added.
 * @param skipped - The names of those left out for their size.
 * @param added - Words the ones added, given how many, such as "2 attachments".
 */
export function attachmentsSummary(
	count: number,
	skipped: string[],
	added: (what: string) => string,
): string {
	return [
		count > 0
			? added(`${count} ${count === 1 ? "attachment" : "attachments"}`)
			: skipped.length === 0 && "There were no attachments to add.",
		skipped.length > 0 &&
			// two emails of a thread often carry the same file
			`Left out for being over 25 MB: ${[...new Set(skipped)].join(", ")}.`,
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * Lets a page that adds emails to a twin add what was attached to them too,
 * in one go: it remembers the emails added, and saves their attachments into
 * the page's files when asked.
 */
export function useTwinMailAttachments(): TwinMailAttachments {
	const { insightId } = useInsight();
	const [threads, setThreads] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	return {
		pending: threads.length,
		isSaving,
		offer: (file) => {
			const key = file.itemKey;
			if (file.service !== "outlook-mail" || !key?.startsWith(THREAD_KEY))
				return;
			const thread = key.slice(THREAD_KEY.length);
			setThreads((current) =>
				current.includes(thread) ? current : [...current, thread],
			);
		},
		save: async () => {
			setIsSaving(true);
			try {
				const all: SavedMailAttachments = { saved: [], skipped: [] };
				for (const thread of threads) {
					const { saved, skipped } = await saveMailAttachments(
						insightId,
						thread,
					);
					all.saved.push(...saved);
					all.skipped.push(...skipped);
				}
				// one added meanwhile is still to do
				setThreads((current) =>
					current.filter((thread) => !threads.includes(thread)),
				);
				return all;
			} finally {
				setIsSaving(false);
			}
		},
	};
}
