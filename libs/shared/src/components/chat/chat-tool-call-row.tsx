import { CheckIcon, XCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { cn, Spinner } from "@semoss/ui/next";

/** Where a tool call is. */
export type ChatToolCallStatus = "running" | "completed" | "failed";

export interface ChatToolCallRowProps {
	/** The tool's name. */
	name: string;
	/** Where the call is. */
	status: ChatToolCallStatus;
}

/**
 * A tool call in a reply, shown by name and status, the way the playground
 * shows its own tool rows. It only displays the call: a chat that runs or
 * approves tools draws its own interactive row.
 */
export const ChatToolCallRow = ({ name, status }: ChatToolCallRowProps) => {
	const { t } = useTranslation("transcript");
	return (
		<div className="flex min-h-8 min-w-0 items-center gap-2 rounded-lg bg-accent/60 px-3 py-1 dark:bg-accent/30">
			<span
				aria-hidden="true"
				className={cn(
					"shrink-0 text-muted-foreground",
					status === "completed" && "text-success",
					status === "failed" && "text-destructive/60",
				)}
			>
				{status === "running" ? (
					<Spinner />
				) : status === "completed" ? (
					<CheckIcon className="size-4" />
				) : (
					<XCircleIcon className="size-4" />
				)}
			</span>
			<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
				<span className="min-w-0 max-w-full break-words text-sm">
					{name}
				</span>
				<span className="min-w-0 max-w-full break-words text-muted-foreground text-xs">
					{t(`toolStatus.${status}`)}
				</span>
			</span>
		</div>
	);
};
