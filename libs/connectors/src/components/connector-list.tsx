import { InboxIcon, type LucideIcon } from "lucide-react";
import { type ReactNode, type Ref, useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted, ScrollArea } from "@semoss/ui/next";
import type { ConnectorAccount } from "../core/connector.types";
import type { ConnectorQuery } from "../core/use-connector-query";
import { ConnectorViewerStatus } from "./connector-viewer-status";

/** Props for {@link ConnectorList}. */
export interface ConnectorListProps<T> {
	/** The read behind the list. */
	query: ConnectorQuery<T[]>;
	/** The app's name, for the messages. */
	serviceName: string;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
	/** The account the viewer reads with, for the sign in prompt. */
	account?: ConnectorAccount;
	/** Says the list is empty, or that nothing matches a search. */
	emptyText: string;
	/** A line under that, such as what would fill the list. */
	emptyDescription?: string;
	/** Drawn above the empty text. Defaults to an inbox. */
	emptyIcon?: LucideIcon;
	/**
	 * Clears the search that left the list empty, so the empty state offers a
	 * way back. Give it only while a search is what emptied the list.
	 */
	onClearSearch?: () => void;
	/**
	 * How many items the list was read with. A list that reaches it may have
	 * more, which the list says.
	 */
	limit?: number;
	/**
	 * Whether the list may hold more than was read. By default, whether it has
	 * as many items as `limit`; a list that groups what it read says so itself.
	 */
	isFull?: boolean;
	/** Says where a full list stops, in place of counting its items. */
	limitNote?: string;
	/** Reads more of a list that reached its limit. */
	onShowMore?: () => void;
	/** The list element, so focus can return to a row. */
	listRef?: Ref<HTMLUListElement>;
	/**
	 * Names what the list shows, such as the open folder. When it changes,
	 * focus moves into the list once it loads, since the control that changed
	 * it, a folder's row or a breadcrumb, is gone.
	 */
	focusKey?: string;
	/** Draws the items as list rows. */
	children: (items: T[]) => ReactNode;
}

/**
 * The scrolling body of a viewer: its rows, or what it shows instead while it
 * loads, needs a sign in, fails, or finds nothing. Screen readers hear when
 * the list settles and how many items it holds.
 */
export const ConnectorList = <T,>({
	query,
	serviceName,
	onSignIn,
	account,
	emptyText,
	emptyDescription,
	emptyIcon: EmptyIcon = InboxIcon,
	onClearSearch,
	limit,
	isFull: isFullOverride,
	limitNote,
	onShowMore,
	listRef,
	focusKey,
	children,
}: ConnectorListProps<T>) => {
	const { t } = useTranslation("connectors");
	const bodyRef = useRef<HTMLDivElement>(null);
	const lastFocusKeyRef = useRef(focusKey);
	const isFocusPendingRef = useRef(false);

	useEffect(() => {
		if (focusKey !== lastFocusKeyRef.current) {
			lastFocusKeyRef.current = focusKey;
			isFocusPendingRef.current = true;
		}
	}, [focusKey]);

	useEffect(() => {
		if (!isFocusPendingRef.current || query.status === "loading") {
			return;
		}
		isFocusPendingRef.current = false;
		const body = bodyRef.current;
		const first = body?.querySelector<HTMLElement>(
			"button:not([disabled]), a[href]",
		);
		(first ?? body)?.focus();
	}, [query.status]);
	const items = query.data ?? [];
	const isFull =
		isFullOverride ?? (limit !== undefined && items.length >= limit);

	return (
		<>
			{/* block, not the scroll area's table, so a long title truncates
			    instead of pushing its row's actions out of view */}
			<ScrollArea className="[&>div>div]:block! min-h-0 flex-1">
				<div ref={bodyRef} tabIndex={-1} className="outline-none">
					{query.status === "ready" ? (
						items.length === 0 ? (
							<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
								<EmptyIcon
									aria-hidden
									className="size-8 text-muted-foreground"
								/>
								<div className="flex max-w-xs flex-col gap-1">
									<span className="font-medium text-sm">
										{emptyText}
									</span>
									{emptyDescription ? (
										<Muted>{emptyDescription}</Muted>
									) : null}
								</div>
								{onClearSearch ? (
									<Button
										variant="outline"
										size="sm"
										onClick={onClearSearch}
									>
										{t("common.clearSearch")}
									</Button>
								) : null}
							</div>
						) : (
							<div className="flex flex-col gap-2 pb-2">
								<ul ref={listRef} className="flex flex-col">
									{children(items)}
								</ul>
								{isFull && onShowMore ? (
									<Button
										variant="outline"
										size="sm"
										className="self-center"
										disabled={query.isRefreshing}
										onClick={onShowMore}
									>
										{query.isRefreshing
											? t("common.loadingMore")
											: t("common.showMore")}
									</Button>
								) : isFull ? (
									<Muted className="px-2">
										{limitNote ??
											t("common.limitReached", {
												count: items.length,
											})}
									</Muted>
								) : null}
							</div>
						)
					) : (
						<ConnectorViewerStatus
							query={query}
							serviceName={serviceName}
							account={account}
							onSignIn={onSignIn}
						/>
					)}
				</div>
			</ScrollArea>
			<output className="sr-only">
				{query.status === "loading"
					? t("common.loading")
					: query.status === "ready"
						? t("common.itemCount", { count: items.length })
						: ""}
			</output>
		</>
	);
};
