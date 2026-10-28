import {
	CircleCheck,
	CircleQuestionMark,
	CircleStop,
	CircleX,
	Hourglass,
	LoaderCircle,
	Trash2,
} from "lucide-react";
import type { ReactElement } from "react";
import { Badge, cn } from "@semoss/ui/next";
import {
	SERVED_MODEL_STATE_LABELS,
	servingLabel,
} from "./model-serving-labels";

export interface ServedModelStateBadgeProps {
	/** The model's state, such as READY or WAITING_FOR_GPU */
	state: string;
}

const ICON_CLASS = "size-3.5";
const SPINNING = "motion-safe:animate-spin";

/** A served model's state, as an icon in its status color beside the word. */
export function ServedModelStateBadge({
	state,
}: ServedModelStateBadgeProps): ReactElement {
	return (
		<Badge variant="outline" className="gap-1">
			{state === "READY" ? (
				<CircleCheck
					className={cn(ICON_CLASS, "text-success")}
					aria-hidden
				/>
			) : state === "STARTING" ? (
				<LoaderCircle
					className={cn(ICON_CLASS, "text-primary", SPINNING)}
					aria-hidden
				/>
			) : state === "WAITING_FOR_GPU" ? (
				<Hourglass
					className={cn(ICON_CLASS, "text-warning")}
					aria-hidden
				/>
			) : state === "FAILED" ? (
				<CircleX
					className={cn(ICON_CLASS, "text-destructive")}
					aria-hidden
				/>
			) : state === "STOPPING" ? (
				<LoaderCircle
					className={cn(
						ICON_CLASS,
						"text-muted-foreground",
						SPINNING,
					)}
					aria-hidden
				/>
			) : state === "STOPPED" ? (
				<CircleStop
					className={cn(ICON_CLASS, "text-muted-foreground")}
					aria-hidden
				/>
			) : state === "REMOVING" ? (
				<Trash2
					className={cn(ICON_CLASS, "text-muted-foreground")}
					aria-hidden
				/>
			) : (
				<CircleQuestionMark
					className={cn(ICON_CLASS, "text-muted-foreground")}
					aria-hidden
				/>
			)}
			{servingLabel(SERVED_MODEL_STATE_LABELS, state)}
		</Badge>
	);
}
