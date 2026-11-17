import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { ResponseMessageStore } from "../../room/store/response-message.store";

/** What {@link useResponseFeedback} returns. */
interface UseResponseFeedbackReturn {
	/**
	 * The rating waiting for its comment, while the feedback text dialog is
	 * open; null while it is closed.
	 */
	pendingRating: boolean | null;
	/** The comment typed so far. */
	feedbackText: string;
	/** Change the comment. */
	setFeedbackText: (text: string) => void;
	/**
	 * Rate the response, or clear its rating when it is rated so already.
	 * With feedback text on, a new rating opens the dialog instead of saving.
	 */
	rate: (rating: boolean) => Promise<void>;
	/** Save the pending rating with its comment, and close the dialog. */
	submit: () => Promise<void>;
	/** Close the dialog without saving. */
	cancel: () => void;
}

/**
 * Rating a response, thumbs up or down, with a toast either way. With
 * feedback text on, a new rating first asks for an optional comment; a failed
 * save keeps the dialog open with what was typed.
 *
 * @param message - The response being rated.
 * @param isFeedbackTextEnabled - Whether a new rating asks for a comment.
 * @returns The pending rating, its comment, and the actions.
 */
export const useResponseFeedback = (
	message: ResponseMessageStore,
	isFeedbackTextEnabled: boolean,
): UseResponseFeedbackReturn => {
	const { t } = useTranslation("chat");
	const [pendingRating, setPendingRating] = useState<boolean | null>(null);
	const [feedbackText, setFeedbackText] = useState("");

	const cancel = () => {
		setPendingRating(null);
		setFeedbackText("");
	};

	const rate = async (rating: boolean) => {
		const isClearing = message.feedback?.rating === rating;

		if (isFeedbackTextEnabled && !isClearing) {
			setPendingRating(rating);
			setFeedbackText("");
			return;
		}

		try {
			await message.recordFeedback(isClearing ? null : rating);
			if (!isClearing) {
				toast.success(t("notifications.feedbackSuccess"));
			}
		} catch (e: unknown) {
			toast.error(getErrorMessage(e));
		}
	};

	const submit = async () => {
		if (pendingRating === null) return;
		try {
			await message.recordFeedback(pendingRating, feedbackText.trim());
			toast.success(t("notifications.feedbackSuccess"));
			setPendingRating(null);
		} catch (e: unknown) {
			toast.error(getErrorMessage(e));
		}
	};

	return {
		pendingRating,
		feedbackText,
		setFeedbackText,
		rate,
		submit,
		cancel,
	};
};
