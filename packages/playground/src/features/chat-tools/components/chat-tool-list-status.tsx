import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted, Skeleton } from "@semoss/ui/next";

/** Placeholder rows while a list loads. */
const SKELETON_ROWS = ["a", "b", "c"];

/** Props for {@link ChatToolListStatus}. */
export interface ChatToolListStatusProps {
	/**
	 * What the list is doing instead of showing tools: still loading, failed
	 * to load, or holding nothing (or a note in place of its tools).
	 */
	status: "loading" | "error" | "empty";
	/** What to say, for an error or an empty list. */
	message?: string;
	/** Load the list again, offered with an error. */
	onRetry?: () => void;
}

/**
 * A tool list's loading, error, or empty state as rows of the list, the same
 * in every section of Tools and inside every group. Render it inside the
 * list's `ul`.
 */
export const ChatToolListStatus = ({
	status,
	message,
	onRetry,
}: ChatToolListStatusProps) => {
	const { t } = useTranslation(["common"]);

	if (status === "loading") {
		return SKELETON_ROWS.map((row) => (
			<li key={row} className="px-3 py-2">
				<Skeleton className="h-6 w-full" />
			</li>
		));
	}
	if (status === "error") {
		return (
			<li
				role="alert"
				className="flex min-w-0 items-center gap-3 px-3 py-2"
			>
				<TriangleAlertIcon
					aria-hidden
					className="size-4 shrink-0 text-destructive"
				/>
				<Muted className="min-w-0 flex-1 font-normal">{message}</Muted>
				{onRetry ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shrink-0"
						onClick={onRetry}
					>
						{t("common:buttons.retry")}
					</Button>
				) : null}
			</li>
		);
	}
	return (
		<li className="px-3 py-2.5">
			<Muted className="font-normal">{message}</Muted>
		</li>
	);
};
