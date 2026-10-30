import { useId } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Textarea,
} from "@semoss/ui/next";
import type { VisioTextEditFailure } from "../../../hooks/use-visio-text-recovery";

interface VisioTextEditNoticeProps {
	failure: VisioTextEditFailure;
	onDismiss: () => void;
}

/** Keeps refused text copyable while explaining why the drawing was not changed. */
export const VisioTextEditNotice = ({
	failure,
	onDismiss,
}: VisioTextEditNoticeProps) => {
	const descriptionId = useId();
	return (
		<Alert variant="destructive">
			<AlertTitle>Text edit could not be applied</AlertTitle>
			<AlertDescription>
				<p id={descriptionId}>{failure.message}</p>
				<p>
					Your draft is preserved below. You can copy it before
					dismissing this message. The text in the diagram was not
					changed.
				</p>
				<Textarea
					aria-label="Unapplied shape text"
					aria-describedby={descriptionId}
					readOnly
					value={failure.text}
					placeholder="(Empty text)"
					className="max-h-32 w-full resize-none text-foreground"
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onDismiss}
				>
					Dismiss draft
				</Button>
			</AlertDescription>
		</Alert>
	);
};
