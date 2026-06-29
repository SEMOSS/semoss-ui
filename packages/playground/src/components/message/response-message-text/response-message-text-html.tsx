import { useEffect } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ChunkStatus } from "@/hooks";
import type { RoomStore } from "@/stores";
import { HtmlPreviewBlock } from "./html-preview-block";

interface ResponseMessageTextHtmlProps {
	/** HTML content for this chunk (may grow during streaming). */
	html: string;

	/**
	 * Animation status for this chunk, controlled by the parent.
	 * - "not_started": waiting in queue, renders nothing
	 * - "active": currently streaming, shows loading state in preview
	 * - "done": fence closed and complete, renders full preview
	 */
	status: ChunkStatus;

	/** Room store, forwarded to HtmlPreviewBlock for "Save in Room". */
	room?: RoomStore;

	/** Called when this chunk is done so the parent can advance to the next chunk. */
	onComplete: () => void;
}

export const ResponseMessageTextHtml: React.FC<
	ResponseMessageTextHtmlProps
> = ({ html, status, room, onComplete }) => {
	const { t } = useTranslation("chat");

	// Advance the queue as soon as this chunk becomes done.
	// The parent flips status from "active" → "done" once the closing fence
	// is detected and the next chunk exists (or streaming has ended).
	// Duplicate-call protection lives in the parent (handleChunkComplete).
	useEffect(() => {
		if (status === "done") {
			onComplete();
		}
	}, [status, onComplete]);

	// Waiting chunks render nothing until it's their turn
	if (status === "not_started") {
		return null;
	}

	return (
		<HtmlPreviewBlock
			html={html}
			room={room}
			isLoading={status === "active"}
			copyTooltip="Copy"
			copySuccessMessage={t("notifications.copySuccess")}
			copyLabel="Copy"
		/>
	);
};
