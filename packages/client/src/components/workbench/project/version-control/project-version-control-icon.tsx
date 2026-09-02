import { GitBranchIcon } from "lucide-react";
import { cn } from "@semoss/ui/next";
import { useProjectGitStatus } from "./use-project-git-status";

/** Props for the live Version Control panel icon. */
interface ProjectVersionControlIconProps {
	/** Class names supplied by workbench chrome. */
	className?: string;
}

/** Render the Version Control icon with a dot when changes are present. */
export const ProjectVersionControlIcon = ({
	className,
}: ProjectVersionControlIconProps) => {
	const status = useProjectGitStatus();
	const hasChanges = Boolean(status.data && !status.data.clean);

	return (
		<span className="inline-grid">
			<GitBranchIcon
				className={cn("col-start-1 row-start-1", className)}
			/>
			{hasChanges ? (
				<span
					className="col-start-1 row-start-1 ml-3 size-2 rounded-full border border-background bg-primary"
					aria-hidden="true"
				/>
			) : null}
			{hasChanges ? (
				<span className="sr-only">Git changes available</span>
			) : null}
		</span>
	);
};
