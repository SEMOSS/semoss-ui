import { Loader2, Play, Save } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { RunStatus } from "@/pages/workflow/workflow.types";

interface WorkflowCanvasToolbarProps {
	saving: boolean;
	isDirty: boolean;
	running: boolean;
	runStatus: RunStatus | null;
	onSave: () => void;
	onRun: () => void;
}

export function WorkflowCanvasToolbar({
	saving,
	isDirty,
	running,
	runStatus,
	onSave,
	onRun,
}: WorkflowCanvasToolbarProps) {
	return (
		<div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
			<Button
				size="sm"
				variant="outline"
				onClick={onSave}
				disabled={saving || running}
			>
				{saving ? (
					<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
				) : (
					<Save className="mr-1.5 h-3.5 w-3.5" />
				)}
				{saving ? "Saving…" : "Save"}
			</Button>
			<Button size="sm" onClick={onRun} disabled={running || saving}>
				{running ? (
					<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
				) : (
					<Play className="mr-1.5 h-3.5 w-3.5" />
				)}
				{running ? "Running…" : "Run"}
			</Button>
			{isDirty && !saving && (
				<span className="ml-1 text-muted-foreground text-xs">
					• Unsaved changes
				</span>
			)}
			{runStatus === "SUCCESS" && (
				<span className="ml-2 text-green-600 text-xs">
					Run succeeded
				</span>
			)}
			{runStatus === "FAILED" && (
				<span className="ml-2 text-destructive text-xs">
					Run failed
				</span>
			)}
		</div>
	);
}
