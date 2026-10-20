import { ChevronDown, Workflow } from "lucide-react";
import { lazy, Suspense } from "react";
import type { AutomationFlow } from "@semoss/automation/flow-preview";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	P,
	Spinner,
} from "@semoss/ui/next";
import { RoutineFlowBoundary } from "./routine-flow-boundary";

const AutomationFlowPreview = lazy(() =>
	import("@semoss/automation/flow-preview").then((module) => ({
		default: module.AutomationFlowPreview,
	})),
);

interface RoutineFlowSectionProps {
	/** Routine name used to label its expandable flow. */
	title: string;
	/** Safe graph supplied by the routine read; older servers may omit it. */
	flow?: AutomationFlow;
}

/** Expands the routine's read-only graph inline without loading the editor or running it. */
export function RoutineFlowSection({ title, flow }: RoutineFlowSectionProps) {
	return (
		<Collapsible className="min-w-0">
			<CollapsibleTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					className="group min-h-11"
					aria-label={`View flow for ${title}`}
				>
					<Workflow aria-hidden="true" />
					View flow
					<ChevronDown
						className="group-data-[state=open]:rotate-180"
						aria-hidden="true"
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent asChild>
				<section className="pt-3" aria-label={`${title} flow`}>
					{flow ? (
						<RoutineFlowBoundary>
							<Suspense
								fallback={
									<output className="flex h-80 items-center justify-center gap-2 text-muted-foreground sm:h-96">
										<Spinner aria-hidden="true" />
										Loading flow…
									</output>
								}
							>
								<AutomationFlowPreview workflow={flow} />
							</Suspense>
						</RoutineFlowBoundary>
					) : (
						<P>
							The flow is unavailable. Refresh the page to try
							again.
						</P>
					)}
				</section>
			</CollapsibleContent>
		</Collapsible>
	);
}
