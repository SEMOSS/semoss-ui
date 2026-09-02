import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@semoss/ui/next";
import { GitChangeRow } from "./git-change-row";
import type {
	ProjectGitFile,
	ProjectGitStageAction,
} from "./version-control.types";

/** Props for one categorized group of project Git changes. */
interface GitChangeGroupProps {
	/** Visible group label. */
	label: string;
	/** Files in the group. */
	files: ProjectGitFile[];
	/** Optional index action offered for each file. */
	action?: ProjectGitStageAction;
	/** Whether file actions are disabled. */
	disabled: boolean;
	/** Run the selected index action for a file. */
	onAction: (file: ProjectGitFile, action: ProjectGitStageAction) => void;
	/** Open a file-specific view, such as the conflict resolver. */
	onOpen?: (file: ProjectGitFile) => void;
}

/** Render one collapsible group of project Git changes. */
export const GitChangeGroup = ({
	label,
	files,
	action,
	disabled,
	onAction,
	onOpen,
}: GitChangeGroupProps) => {
	if (files.length === 0) {
		return null;
	}

	return (
		<AccordionItem value={label}>
			<AccordionTrigger className="px-3 py-2 hover:no-underline">
				<span className="flex min-w-0 items-center gap-2">
					<span className="truncate font-medium text-sm">
						{label}
					</span>
					<span className="text-muted-foreground text-xs">
						{files.length}
					</span>
				</span>
			</AccordionTrigger>
			<AccordionContent className="pb-1">
				<ul aria-label={label}>
					{files.map((file) => (
						<li key={`${file.status}-${file.path}`}>
							<GitChangeRow
								file={file}
								action={action}
								disabled={disabled}
								onAction={onAction}
								onOpen={onOpen}
							/>
						</li>
					))}
				</ul>
			</AccordionContent>
		</AccordionItem>
	);
};
