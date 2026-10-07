import { ScrollText } from "lucide-react";
import { createElement } from "react";
import { Button, H3, H4, P } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { WorkAuditLog } from "./work-audit-log";
import { useWorkThread } from "./work-thread-context";
/** Run inspection and the existing room audit report share one entry point. */
export function WorkActivityPanel() {
	const { snapshot } = useWorkThread();
	const workbench = useToolWorkbench();
	const runs = [
		...new Set(
			snapshot.turn.messages.flatMap((message) =>
				message.runId ? [message.runId] : [],
			),
		),
	];
	const roomId = snapshot.association?.roomId;
	return (
		<div className="h-full min-w-0 space-y-6 overflow-auto p-4">
			<div className="space-y-2">
				<H3 className="text-lg">Activity</H3>
				<P className="text-muted-foreground">
					Runs, delegated work, and activity for this conversation.
				</P>
			</div>
			<section className="space-y-3" aria-label="Agent runs">
				<H4>Agent runs</H4>
				{runs.length === 0 ? (
					<P className="text-muted-foreground">
						No runs yet. Send a message to get started.
					</P>
				) : (
					<div className="flex flex-wrap gap-2">
						{runs.map((runId, index) => (
							<Button
								key={runId}
								type="button"
								variant="outline"
								onClick={() => workbench.openRun(runId)}
							>
								Run {index + 1}
							</Button>
						))}
					</div>
				)}
			</section>
			<section className="min-w-0 space-y-3" aria-label="Activity log">
				<H4>Activity log</H4>
				{roomId ? (
					<WorkAuditLog key={roomId} roomId={roomId} />
				) : (
					<P className="rounded-lg bg-muted p-4 text-muted-foreground">
						Activity is available after this thread has a saved
						conversation.
					</P>
				)}
			</section>
		</div>
	);
}
export const WORK_ACTIVITY_PANEL: WorkbenchPanelConfig = {
	name: "Activity",
	icon: ({ className }) =>
		createElement(ScrollText, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	content: WorkActivityPanel,
};
