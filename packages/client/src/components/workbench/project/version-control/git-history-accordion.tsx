import { GitCommitHorizontalIcon } from "lucide-react";
import { useEffect } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { GitCommitRow } from "./git-commit-row";
import type { ProjectGitCommit } from "./version-control.types";

interface GitHistoryAccordionProps {
	projectId: string;
}

const PAGE_SIZE = 20;

/** Paginated project commit history with lazy changed-file summaries. */
export const GitHistoryAccordion = ({
	projectId,
}: GitHistoryAccordionProps) => {
	const history = usePixel<ProjectGitCommit[]>(
		`ProjectCommitDetails(project=[${JSON.stringify(projectId)}], limit=["${PAGE_SIZE}"], offset=["0"]);`,
	);
	const events = useWorkbench((state) => state.events.actions);

	useEffect(() => {
		return events.subscribe("git:branch-changed", history.refresh);
	}, [events, history.refresh]);

	return (
		<AccordionItem value="history">
			<AccordionTrigger className="px-3 py-2 hover:no-underline">
				<span className="flex items-center gap-2">
					<GitCommitHorizontalIcon
						className="size-4"
						aria-hidden="true"
					/>
					<span className="font-medium text-sm">Commit History</span>
				</span>
			</AccordionTrigger>
			<AccordionContent className="pb-1">
				{history.status === "INITIAL" ||
				history.status === "LOADING" ? (
					<div className="flex flex-col gap-2 px-3 py-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : null}
				{history.status === "ERROR" ? (
					<div
						className="flex flex-col items-start gap-2 px-3 py-2"
						role="alert"
					>
						<Muted>Unable to load commit history.</Muted>
						<Button
							size="sm"
							variant="outline"
							onClick={history.refresh}
						>
							Retry
						</Button>
					</div>
				) : null}
				{history.status === "SUCCESS" && history.data?.length === 0 ? (
					<Muted className="block px-3 py-2">No commits yet.</Muted>
				) : null}
				{history.data?.map((commit) => (
					<GitCommitRow
						key={commit.commitId}
						projectId={projectId}
						commit={commit}
					/>
				))}
			</AccordionContent>
		</AccordionItem>
	);
};
