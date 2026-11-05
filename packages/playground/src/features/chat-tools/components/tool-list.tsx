import type { ReactNode } from "react";
import type { ToolsRead } from "../use-tools-read";
import { ToolListStatus } from "./tool-list-status";

/** The bordered list every section's rows sit in. */
export const TOOL_LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border";

/**
 * A list inside a group row, indented so its rows' chevrons sit under the
 * group's icon.
 */
const GROUP_LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border border-border border-t ps-7";

/** Props for {@link ToolList}. */
export interface ToolListProps {
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
}: ToolListProps) => (
	<ul
		className={
			variant === "section" ? TOOL_LIST_CLASS_NAME : GROUP_LIST_CLASS_NAME
		}
	>
		{status === "error" ? (
			<ToolListStatus
				status="error"
				message={errorMessage}
				onRetry={onRetry}
			/>
		) : !isEmpty ? (
			children
		) : status === "ready" ? (
			<ToolListStatus status="empty" message={emptyMessage} />
		) : (
			<ToolListStatus status="loading" />
		)}
	</ul>
);
