import { Circle } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@semoss/ui/next";
import {
	dueLabel,
	type Step,
} from "@/features/collaboration/components/work-items-list";
import { threadPath } from "@/lib/workspace-paths";
import { shortDate } from "./short-date";
import { linkClassName } from "./topic-work-item";

/** The owner's steps under the topic that belong to no work item, each opening the thread it came from. */
export function TopicWorkSingleSteps({ steps }: { steps: Step[] }) {
	return (
		<ul
			aria-label="Steps not in a work item"
			className="divide-y divide-border overflow-hidden rounded-lg border bg-background"
		>
			{steps.map((step) => {
				const due = dueLabel(step.due);
				const since = shortDate(step.createdAt);
				return (
					<li
						key={step.id}
						className="flex items-start gap-2.5 px-3 py-2 text-sm"
					>
						<Circle
							aria-hidden="true"
							className="mt-0.5 size-4 shrink-0 text-primary"
						/>
						<span className="wrap-anywhere min-w-0">
							{step.threadId ? (
								<Link
									to={threadPath(step.threadId)}
									className={linkClassName}
								>
									{step.text}
								</Link>
							) : (
								step.text
							)}
							{due || since ? (
								<span className="block text-muted-foreground text-xs">
									{due ? (
										<span
											className={cn(
												due.soon && "text-destructive",
											)}
										>
											Due {due.text}
										</span>
									) : null}
									{due && since ? " · " : null}
									{since ? `Since ${since}` : null}
								</span>
							) : null}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
