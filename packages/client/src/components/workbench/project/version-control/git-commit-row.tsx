import { ChevronRightIcon, FileIcon } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import type {
	ProjectGitCommit,
	ProjectGitCommitFile,
} from "./version-control.types";

/** Props for one expandable commit history row. */
interface GitCommitRowProps {
	/** Project that owns the repository. */
	projectId: string;
	/** Commit metadata to display. */
	commit: ProjectGitCommit;
}

/** Format a commit date for the compact history list. */
const formatCommitDate = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
};

/** Render an expandable commit and lazily load its changed files. */
export const GitCommitRow = ({ projectId, commit }: GitCommitRowProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const files = usePixel<ProjectGitCommitFile[]>(
		isOpen
			? `ProjectCommitDiff(project=[${JSON.stringify(projectId)}], commitId=[${JSON.stringify(commit.commitId)}]);`
			: "",
	);
	const subject = commit.commitMessage.split("\n")[0] || "Untitled commit";

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<ChevronRightIcon
						className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-90"
						aria-hidden="true"
					/>
					<span className="min-w-0 flex-1">
						<span
							className="block truncate font-medium text-sm"
							title={subject}
						>
							{subject}
						</span>
						<span className="block truncate text-muted-foreground text-xs">
							{commit.author.userId} ·{" "}
							{formatCommitDate(commit.date)}
						</span>
					</span>
					<span className="font-mono text-muted-foreground text-xs">
						{commit.commitId.slice(0, 7)}
					</span>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				{files.status === "LOADING" ? (
					<div className="flex flex-col gap-2 px-5 py-2">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-3/4" />
					</div>
				) : null}
				{files.status === "ERROR" ? (
					<Muted className="block px-5 py-2">
						Unable to load changed files.
					</Muted>
				) : null}
				{files.status === "SUCCESS" && files.data?.length === 0 ? (
					<Muted className="block px-5 py-2">No changed files.</Muted>
				) : null}
				{files.data?.length ? (
					<ul aria-label={`Files changed by ${subject}`}>
						{files.data.map((file) => (
							<li
								key={`${file.changeType}-${file.fileName}`}
								className="flex items-center gap-2 px-5 py-1"
							>
								<FileIcon
									className="size-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<span
									className="min-w-0 flex-1 truncate font-mono text-sm"
									title={file.fileName}
								>
									{file.fileName}
								</span>
								<span className="text-muted-foreground text-xs">
									{file.changeType}
								</span>
							</li>
						))}
					</ul>
				) : null}
			</CollapsibleContent>
		</Collapsible>
	);
};
