import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { RefObject } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Textarea,
} from "@semoss/ui/next";

/** Props for {@link ResponseFeedbackDialog}. */
interface ResponseFeedbackDialogProps {
	/** The rating the comment goes with: true for thumbs up. */
	rating: boolean;
	/** The comment typed so far. */
	feedbackText: string;
	/** Change the comment. */
	onFeedbackTextChange: (text: string) => void;
	/** Save the rating with its comment. */
	onSubmit: () => void;
	/** Close without saving, by Cancel, Escape, or a click outside. */
	onCancel: () => void;
	/** The button focus goes back to once the dialog closes. */
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Asks for an optional comment with a new rating, named by the rating. The
 * owner renders it only while a rating waits for its comment.
 */
export const ResponseFeedbackDialog = ({
	rating,
	feedbackText,
	onFeedbackTextChange,
	onSubmit,
	onCancel,
	returnFocusRef,
}: ResponseFeedbackDialogProps) => {
	const { t } = useTranslation("chat");
	const Icon = rating ? ThumbsUpIcon : ThumbsDownIcon;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				aria-describedby={undefined}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon
							aria-hidden="true"
							className="size-5"
							fill="currentColor"
						/>
						{rating
							? t("response.goodResponse")
							: t("response.poorResponse")}
					</DialogTitle>
				</DialogHeader>
				<Textarea
					aria-label={t("response.feedbackPlaceholder")}
					placeholder={t("response.feedbackPlaceholder")}
					value={feedbackText}
					onChange={(e) => onFeedbackTextChange(e.target.value)}
					rows={3}
					className="text-sm"
				/>
				<div className="flex justify-end gap-2">
					<Button variant="ghost" onClick={onCancel}>
						{t("response.feedbackCancel")}
					</Button>
					<Button onClick={onSubmit}>
						{t("response.feedbackSubmit")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
