import { Button, H3 } from "@semoss/ui/next";
import { displayToolName } from "@/components/assistant/assistant-tools";
import { useAssistant } from "@/hooks/use-assistant";
import type { BuildRun, BuildTool } from "@/stores/assistant/assistant.runs";
import { AssistantToolContent } from "./assistant-tool-content";
import {
	getAssistantToolResource,
	getAssistantToolUi,
	isToolViewReady,
} from "./assistant-tool-ui";

interface AssistantToolActivityProps {
	/** The call's owning run. */
	run: BuildRun;
	/** Metadata-aware tool entry. */
	tool: BuildTool;
}

/** Authored views remain outside automatically collapsing activity phases. */
export const AssistantToolActivity = ({
	run,
	tool,
}: AssistantToolActivityProps) => {
	const openToolPanel = useAssistant((state) => state.openToolPanel);
	const ui = getAssistantToolUi(tool.metadata);
	if (ui?.displayLocation === "hidden") return null;
	return (
		<section className="min-w-0 rounded-lg border border-border bg-card">
			<div className="flex min-h-12 items-center gap-3 px-3 py-2">
				<H3 className="wrap-break-word min-w-0 flex-1 font-medium text-sm leading-5">
					{displayToolName(tool)}
				</H3>
				{ui?.displayLocation !== "inline" && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shadow-none"
						onClick={() => openToolPanel(run.runId, tool.id)}
					>
						Open tool
					</Button>
				)}
			</div>
			{!isToolViewReady(run, tool) &&
				ui?.displayLocation !== "inline" && (
					<output className="block px-3 pb-3 text-muted-foreground text-xs">
						{ui?.loadingMessage || "Running tool…"}
					</output>
				)}
			{ui?.displayLocation === "inline" && (
				<AssistantToolContent
					run={run}
					tool={tool}
					showApprovals={Boolean(getAssistantToolResource(run, tool))}
				/>
			)}
		</section>
	);
};
