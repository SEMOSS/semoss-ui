import { PanelRightOpen, Presentation } from "lucide-react";
import { Button, P } from "@semoss/ui/next";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { isTerminalRun } from "@/features/rooms/api/agent-run-api";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { PresentationFile } from "./presentation-file";
import { presentationRunFiles } from "./presentation-run";

const phases: Record<string, string> = {
	authoring: "Preparing slides...",
	editing: "Editing slides...",
	saving: "Saving presentation...",
	validating: "Validating presentation...",
	visual_review: "Reviewing slides...",
	visual_repair: "Refining slides...",
	structural_repair: "Repairing presentation...",
};

/** Persisted execution, delivery and review are displayed independently. */
export function PresentationRunResult({ run }: { run: AgentRun }) {
	const workbench = useToolWorkbench();
	const files = presentationRunFiles(run);
	const terminal = isTerminalRun(run);
	const status =
		run.status === "FAILED"
			? "Presentation generation failed."
			: run.status === "CANCELLED"
				? "Presentation generation cancelled."
				: run.status === "INPUT_REQUIRED"
					? "Needs your input."
					: terminal
						? files.length
							? "Generation finished."
							: "No retrievable presentation was returned."
						: (phases[run.progress?.workflow?.phase ?? ""] ??
							"Preparing presentation...");
	return (
		<section aria-label="PowerPoint result" className="min-w-0 space-y-3">
			<P className="flex items-center gap-2 font-medium">
				<Presentation aria-hidden="true" className="size-4" />
				PowerPoint
			</P>
			<output className="block text-sm">{status}</output>
			{run.errorMessage && (
				<P className="text-destructive text-sm">{run.errorMessage}</P>
			)}
			{(run.warnings ?? []).map((warning) => (
				<P key={warning} className="text-sm text-warning">
					{warning}
				</P>
			))}
			{run.reviewOutcome &&
				run.reviewOutcome.status !== "complete" &&
				terminal &&
				files.length > 0 && (
					<P className="text-sm text-warning">
						Visual review is incomplete.
					</P>
				)}
			{files.map((file) => (
				<PresentationFile
					key={JSON.stringify([
						file.roomId,
						file.path,
						file.sourceHash,
					])}
					file={file}
				/>
			))}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => workbench.openRun(run.runId)}
			>
				<PanelRightOpen aria-hidden="true" />
				View activity
			</Button>
		</section>
	);
}
