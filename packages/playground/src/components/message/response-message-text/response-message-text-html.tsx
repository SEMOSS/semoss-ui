import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ResponseMessageStore, RoomStore } from "@/stores";
import { HtmlPreviewBlock } from "./html-preview-block";

interface ResponseMessageTextHtmlProps {
	/** HTML content for this chunk (may grow during streaming). */
	html: string;

	/**
	 * True when this chunk is the currently-active one in the queue.
	 * Waiting chunks (isActive=false, isDone=false) render nothing.
	 */
	isActive: boolean;

	/**
	 * True when this chunk has already completed (index < activeIndex).
	 * Renders the block directly without any gating.
	 */
	isDone: boolean;

	/**
	 * True when no more tokens will arrive for this chunk (fence is closed,
	 * or streaming has ended). Passed as `!isLoading` to HtmlPreviewBlock.
	 */
	isFinalized: boolean;

	/** Room store, forwarded to HtmlPreviewBlock for "Save in Room". */
	room?: RoomStore;

	/** Parent response message (used for translation context). */
	message: ResponseMessageStore;

	/** Called when this chunk is done and the next chunk may start. */
	onComplete: () => void;
}

export const ResponseMessageTextHtml: React.FC<
	ResponseMessageTextHtmlProps
> = ({ html, isActive, isDone, isFinalized, room, onComplete }) => {
	const { t } = useTranslation("chat");

	// Guard against calling onComplete more than once
	const onCompleteCalledRef = useRef(false);
	useEffect(() => {
		if (isActive) {
			onCompleteCalledRef.current = false;
		}
	}, [isActive]);

	const fireOnComplete = useCallback(() => {
		if (!onCompleteCalledRef.current) {
			onCompleteCalledRef.current = true;
			onComplete();
		}
	}, [onComplete]);

	// Fire onComplete as soon as the fence closes (isFinalized becomes true).
	// HtmlPreviewBlock manages its own internal streaming throttle and iframe
	// load state — we don't need to wait for the iframe before advancing the
	// queue. The next md chunk starting while the HTML preview settles is fine.
	useEffect(() => {
		if (isFinalized && isActive) {
			fireOnComplete();
		}
	}, [isFinalized, isActive, fireOnComplete]);

	// Waiting chunks render nothing until it's their turn
	if (!isActive && !isDone) {
		return null;
	}

	return (
		<HtmlPreviewBlock
			html={html}
			room={room}
			isLoading={!isFinalized}
			copyTooltip="Copy"
			copySuccessMessage={t("notifications.copySuccess")}
			copyLabel="Copy"
		/>
	);
};
