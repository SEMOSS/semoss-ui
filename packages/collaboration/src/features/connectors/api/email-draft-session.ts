import { Insight } from "@semoss/sdk";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import type { EmailDraftInput, SavedEmailDraft } from "../types";
import { saveEmailDraft, UncertainDraftError } from "./microsoft";

type NewDraftInput = Omit<
	Extract<EmailDraftInput, { mode: "new" }>,
	"attachments"
>;

/** Owns new-draft files separately from all conversation and download insights. */
export class EmailDraftSession {
	private insight: Insight | null = null;
	private staged = new WeakMap<File, string>();
	private pending = false;
	private disposed = false;
	private hasUncertainSave = false;

	/** Retain successful uploads across an explicit retry or Save a new copy. */
	async save(input: NewDraftInput, files: File[]): Promise<SavedEmailDraft> {
		if (this.disposed) throw new Error("Reopen this draft before saving.");
		if (this.pending) throw new Error("This draft is already being saved.");
		this.pending = true;
		try {
			if (!this.insight) this.insight = new Insight();
			const insight = this.insight;
			if (!insight.isReady) {
				this.staged = new WeakMap();
				await insight.initialize({ disableRoom: true });
			}
			if (!insight.isReady || !insight.insightId)
				throw new Error(
					"Could not prepare this draft's attachments. Please try again.",
				);
			const attachments: string[] = [];
			for (const file of files) {
				let location = this.staged.get(file);
				if (!location) {
					const prefix = `${crypto.randomUUID()}-`;
					const basename =
						file.name
							.split(/[\\/]/)
							.pop()
							?.replace(/[^\p{L}\p{N}._-]/gu, "_") ||
						"attachment";
					const upload = new File([file], `${prefix}${basename}`, {
						type: file.type,
						lastModified: file.lastModified,
					});
					const [receipt] = await uploadRoomFiles(insight.insightId, [
						upload,
					]);
					const path = receipt?.fileLocation
						.replace(/\\/g, "/")
						.replace(/^\/+/, "");
					if (
						!receipt ||
						!receipt.fileName.startsWith(prefix) ||
						/[\\/]/.test(receipt.fileName) ||
						path !== receipt.fileName
					)
						throw new Error(
							`The upload for ${file.name} could not be confirmed. Your files are still selected.`,
						);
					location = path;
					this.staged.set(file, location);
				}
				attachments.push(location);
			}
			try {
				return await saveEmailDraft(insight.actions, {
					...input,
					attachments,
				});
			} catch (cause: unknown) {
				if (cause instanceof UncertainDraftError)
					this.hasUncertainSave = true;
				throw cause;
			}
		} finally {
			this.pending = false;
			if (this.disposed) this.destroy();
		}
	}

	/** Unmount may occur during a save; keep its files until that request finishes. */
	dispose(): void {
		this.disposed = true;
		if (!this.pending) this.destroy();
	}

	private destroy(): void {
		// A lost response cannot prove the server finished reading attachments.
		// Keep this unbound insight for server-session cleanup in that case.
		if (this.hasUncertainSave) return;
		const insight = this.insight;
		this.insight = null;
		this.staged = new WeakMap();
		if (insight) void insight.destroy().catch(() => undefined);
	}
}
