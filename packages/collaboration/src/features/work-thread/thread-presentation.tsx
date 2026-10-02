import { PanelRightOpen } from "lucide-react";
import { Button, P } from "@semoss/ui/next";
import { Section } from "@/features/collaboration/components/section";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { PresentationFile } from "./presentation-file";
import { isPresentationTool, presentationFiles } from "./presentation-tools";

const labels = {
	QUEUED: "Queued",
	RUNNING: "Preparing presentation...",
	INPUT_REQUIRED: "Needs your input",
	COMPLETED: "Completed",
	FAILED: "Preparation failed",
	REJECTED: "Not approved",
	CANCELLED: "Cancelled",
};

/** Legacy tool results share the managed run's retrieval gate and file actions. */
export function ThreadPresentation() {
	const workbench = useToolWorkbench();
	const tools = Object.values(workbench.tools).filter(isPresentationTool);
	const files = [
		...new Map(
			tools
				.flatMap((tool) => presentationFiles(tool, workbench.roomId))
				.map((file) => [file.path, file]),
		).values(),
	];
	if (!tools.length) return null;
	return (
		<Section title="Presentation" variant="widget">
			{tools.map((tool) => (
				<div key={tool.id} className="space-y-2">
					<P className="break-words">{tool.title || "PowerPoint"}</P>
					<output className="block text-muted-foreground text-sm">
						{labels[tool.status]}
					</output>
					{tool.error && (
						<P className="text-destructive">{tool.error}</P>
					)}
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => workbench.openWorkbench(tool.id)}
					>
						<PanelRightOpen aria-hidden="true" />
						{tool.status === "INPUT_REQUIRED"
							? "Review request"
							: tool.status === "FAILED"
								? "Review failure"
								: "View activity"}
					</Button>
				</div>
			))}
			{files.map((file) => (
				<PresentationFile
					key={file.path}
					file={{ ...file, roomId: workbench.roomId }}
				/>
			))}
		</Section>
	);
}
