import { useState } from "react";
import { Alert, AlertDescription, Button, P, Small } from "@semoss/ui/next";
import { Section } from "@/features/collaboration/components/section";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { downloadPresentation } from "./api/download-presentation";
import { isPresentationTool, presentationFiles } from "./presentation-tools";
import { useWorkThread } from "./work-thread-context";

const labels = {
	QUEUED: "Queued",
	RUNNING: "Preparing presentation…",
	INPUT_REQUIRED: "Needs your input",
	COMPLETED: "Completed",
	FAILED: "Preparation failed",
	REJECTED: "Not approved",
	CANCELLED: "Cancelled",
};

/** Existing tool runs own generation, approvals, recovery and file identities. */
export function ThreadPresentation() {
	const workbench = useToolWorkbench();
	const { session } = useWorkThread();
	const [error, setError] = useState("");
	const [downloading, setDownloading] = useState<string | null>(null);
	const tools = Object.values(workbench.tools).filter(isPresentationTool);
	const files = [
		...new Map(
			tools
				.flatMap((tool) => presentationFiles(tool, workbench.roomId))
				.map((file) => [file.path, file]),
		).values(),
	];
	if (!tools.length && !files.length) return null;
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
						{tool.status === "INPUT_REQUIRED"
							? "Review request"
							: tool.status === "FAILED"
								? "Review failure"
								: "View activity"}
					</Button>
					{tool.status === "FAILED" && (
						<Small className="block text-muted-foreground">
							Review the failure, then ask Assistant to try again.
						</Small>
					)}
				</div>
			))}
			{files.map((file) => (
				<div key={file.path} className="space-y-2">
					<Small className="block break-words">
						{file.name} · Ready
					</Small>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							aria-label={`Open ${file.name}`}
							onClick={() =>
								workbench.openFile(file.path, file.name)
							}
						>
							Open
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							aria-label={`Download ${file.name}`}
							disabled={downloading !== null}
							onClick={async () => {
								setError("");
								setDownloading(file.path);
								try {
									await downloadPresentation(
										session.insight.actions,
										session.insight.insightId,
										file.path,
									);
								} catch (cause) {
									setError(
										cause instanceof Error
											? cause.message
											: "Download failed. Try again.",
									);
								} finally {
									setDownloading(null);
								}
							}}
						>
							{downloading === file.path
								? "Downloading…"
								: "Download"}
						</Button>
					</div>
				</div>
			))}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</Section>
	);
}
