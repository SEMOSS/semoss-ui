import { GitCommitHorizontalIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Muted,
	Skeleton,
	Spinner,
} from "@semoss/ui/next";
import type { GitCommit } from "./git.types";
import type { GitDataStatus } from "./git-commit-row";

/** Props for standalone Git commit history. */
export interface GitHistoryProps {
	/** Commits to display. */
	commits?: GitCommit[];
	/** Current state of the history request. */
	status: GitDataStatus;
	/** Retry loading commit history. */
	onRetry: () => void;
	/** Render the domain adapter for a commit row. */
	renderCommit: (commit: GitCommit) => ReactNode;
	/** Whether another page of commits is available. */
	hasMore?: boolean;
	/** Whether another page is currently loading. */
	isLoadingMore?: boolean;
	/** Whether loading the next page failed. */
	loadMoreError?: boolean;
	/** Load the next page of commits. */
	onLoadMore?: () => void;
}

/** Display repository commit history and its request states. */
export const GitHistory = ({
	commits,
	status,
	onRetry,
	renderCommit,
	hasMore = false,
	isLoadingMore = false,
	loadMoreError = false,
	onLoadMore,
}: GitHistoryProps) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const scrollRoot = scrollRef.current;
		const loadMoreTarget = loadMoreRef.current;
		if (
			!scrollRoot ||
			!loadMoreTarget ||
			!hasMore ||
			isLoadingMore ||
			loadMoreError ||
			!onLoadMore
		) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					onLoadMore();
				}
			},
			{
				root: scrollRoot,
				rootMargin: "0px 0px 200px",
				threshold: 0,
			},
		);

		observer.observe(loadMoreTarget);
		return () => observer.disconnect();
	}, [hasMore, isLoadingMore, loadMoreError, onLoadMore]);

	return (
		<div ref={scrollRef} className="h-full min-h-0 overflow-y-auto">
			<Accordion
				type="multiple"
				defaultValue={["history"]}
				className="min-h-full"
			>
				<AccordionItem value="history">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<span className="flex items-center gap-2">
							<GitCommitHorizontalIcon
								className="size-4"
								aria-hidden="true"
							/>
							<span className="font-medium text-sm">
								Commit History
							</span>
						</span>
					</AccordionTrigger>
					<AccordionContent className="pb-1">
						{status === "INITIAL" || status === "LOADING" ? (
							<output
								className="flex flex-col gap-2 px-3 py-2"
								aria-live="polite"
							>
								<span className="sr-only">
									Loading commit history
								</span>
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</output>
						) : null}
						{status === "ERROR" ? (
							<div
								className="flex flex-col items-start gap-2 px-3 py-2"
								role="alert"
							>
								<Muted>Unable to load commit history.</Muted>
								<Button
									size="sm"
									variant="outline"
									onClick={onRetry}
								>
									Retry
								</Button>
							</div>
						) : null}
						{status === "SUCCESS" && commits?.length === 0 ? (
							<Muted className="block px-3 py-2">
								No commits yet.
							</Muted>
						) : null}
						{commits?.map(renderCommit)}
						{hasMore && onLoadMore ? (
							<div
								ref={loadMoreRef}
								className="flex justify-center px-3 py-2"
							>
								<output className="sr-only" aria-live="polite">
									{isLoadingMore
										? "Loading more commits"
										: loadMoreError
											? "Unable to load more commits"
											: ""}
								</output>
								<Button
									size="sm"
									variant="ghost"
									disabled={isLoadingMore}
									onClick={onLoadMore}
								>
									{isLoadingMore ? (
										<Spinner
											className="size-4"
											aria-hidden="true"
										/>
									) : null}
									{isLoadingMore
										? "Loading more commits"
										: loadMoreError
											? "Retry loading commits"
											: "Load more commits"}
								</Button>
							</div>
						) : null}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
};
