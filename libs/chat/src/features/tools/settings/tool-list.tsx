import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted, Skeleton } from "@semoss/ui/next";
import type { ToolsRead } from "./use-tools-read";

/** The bordered list every section's rows sit in. */
const TOOL_LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border";

/**
 * A list inside a group row, indented so its rows' chevrons sit under the
 * group's icon.
 */
const GROUP_LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border border-border border-t ps-7";

/** Placeholder rows while a list loads. */
const SKELETON_ROWS = ["a", "b", "c"];

/** Props for {@link ToolList}. */
interface ToolListProps {
	/**
	 * How reading the rows went. Defaults to `ready`, for rows that are always
	 * known. Rows already read stay shown while they are read again.
	 */
	status?: ToolsRead["status"];
	/** Whether there are no rows, so the list shows `emptyMessage`. */
	isEmpty?: boolean;
	/** What the list says when its rows cannot be read. */
	errorMessage?: string;
	/** What the list says when it has no rows, or a note in place of them. */
	emptyMessage?: string;
	/** Read the rows again, offered with the error. */
	onRetry?: () => void;
	/** A section's own list, or one inside a group row. Defaults to a section's. */
	variant?: "section" | "group";
	/** The rows, each an `li`. */
	children?: ReactNode;
}

/**
 * One list of tool rows, the same in every section of Tools and inside every
 * group: its rows, or the row that says it is loading, failed to load, or
 * holds nothing.
 */
export const ToolList = ({
	status = "ready",
	isEmpty = false,
	errorMessage,
	emptyMessage,
	onRetry,
	variant = "section",
	children,
}: ToolListProps) => {
	const { t } = useTranslation(["common"]);

	// the rows, or the row that stands in for them
	let rows: ReactNode = children;
	if (status === "error") {
		rows = (
			<li
				role="alert"
				className="flex min-w-0 items-center gap-3 px-3 py-2"
			>
				<TriangleAlertIcon
					aria-hidden
					className="size-4 shrink-0 text-destructive"
				/>
				<Muted className="min-w-0 flex-1 font-normal">
					{errorMessage}
				</Muted>
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
	} else if (isEmpty && status === "ready") {
		rows = (
			<li className="px-3 py-2.5">
				<Muted className="font-normal">{emptyMessage}</Muted>
			</li>
		);
	} else if (isEmpty) {
		rows = SKELETON_ROWS.map((row) => (
			<li key={row} className="px-3 py-2">
				<Skeleton className="h-6 w-full" />
			</li>
		));
	}

	return (
		<ul
			className={
				variant === "section"
					? TOOL_LIST_CLASS_NAME
					: GROUP_LIST_CLASS_NAME
			}
		>
			{rows}
		</ul>
	);
};
