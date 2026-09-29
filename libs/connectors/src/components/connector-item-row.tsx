import { LoaderCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button, cn } from "@semoss/ui/next";
import type { ConnectorItemActions } from "./connector-item-actions";
import { ConnectorItemMenu } from "./connector-item-menu";
import { ConnectorItemQuickAction } from "./connector-item-quick-action";

/** Lays out a row's icon, text, and detail, whether or not it is a button. */
const ROW_CONTENT_CLASS =
	"flex h-auto min-w-0 flex-1 items-center justify-start gap-2 px-2 py-1.5 text-start font-normal";

/** Props for {@link ConnectorItemRow}. */
export interface ConnectorItemRowProps {
	/** Identifies the item, so focus can return to its row. */
	itemKey: string;
	/** The item's icon, drawn at the start of the row. */
	icon: ReactNode;
	/** The item's name or subject. */
	title: string;
	/** A second line, such as the sender or the folder's size. */
	description?: string;
	/** A short detail at the end, such as a date. */
	meta?: string;
	/** Marks the item as new, as for unread mail. */
	isEmphasized?: boolean;
	/**
	 * Opens the item: enters a folder, or shows a message. Without it, the row
	 * is not a button.
	 */
	onOpen?: () => void;
	/**
	 * The open button's accessible name, when the visible text alone does not
	 * say what opening does.
	 */
	openLabel?: string;
	/** Whether the item is being saved. */
	isBusy?: boolean;
	/**
	 * What can be done with the item: one action as a button at the end of the
	 * row, and all of them on a right-click, as the file explorer does it.
	 */
	actions?: ConnectorItemActions | null;
}

/**
 * One item in a viewer's list: a file, an email, a message, or an event.
 */
export const ConnectorItemRow = ({
	itemKey,
	icon,
	title,
	description,
	meta,
	isEmphasized = false,
	onOpen,
	openLabel,
	isBusy = false,
	actions,
}: ConnectorItemRowProps) => {
	// spans only: the text sits inside a button, which cannot hold paragraphs.
	// The title shares its line with the meta, so a date lines up with what it
	// dates, and the icon stays beside the title when a second line follows.
	const content = (
		<>
			<span
				className={cn(
					"flex size-4 shrink-0 items-center justify-center text-muted-foreground",
					description && "mt-0.5 self-start",
				)}
			>
				{icon}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="flex min-w-0 items-center gap-2">
					{isEmphasized ? (
						// the open label says the item is unread; the dot and the
						// weight say it on screen
						<span
							aria-hidden
							className="size-2 shrink-0 rounded-full bg-primary"
						/>
					) : null}
					<span
						className={cn(
							"min-w-0 flex-1 truncate text-foreground text-sm",
							isEmphasized && "font-medium",
						)}
						title={title}
					>
						{title}
					</span>
					{meta ? (
						<span className="shrink-0 text-muted-foreground text-xs">
							{meta}
						</span>
					) : null}
				</span>
				{description ? (
					<span
						className="truncate text-muted-foreground text-xs"
						title={description}
					>
						{description}
					</span>
				) : null}
			</span>
		</>
	);

	return (
		<ConnectorItemMenu actions={actions}>
			<li
				className="flex min-w-0 items-center gap-1 rounded-md hover:bg-accent"
				aria-busy={isBusy || undefined}
			>
				{onOpen ? (
					<Button
						variant="ghost"
						className={ROW_CONTENT_CLASS}
						aria-label={openLabel}
						data-item-key={itemKey}
						onClick={onOpen}
					>
						{content}
					</Button>
				) : (
					<div className={cn(ROW_CONTENT_CLASS, "rounded-md")}>
						{content}
					</div>
				)}
				{isBusy ? (
					<LoaderCircleIcon
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground motion-safe:animate-spin"
					/>
				) : null}
				{actions ? (
					<ConnectorItemQuickAction actions={actions} />
				) : null}
			</li>
		</ConnectorItemMenu>
	);
};
