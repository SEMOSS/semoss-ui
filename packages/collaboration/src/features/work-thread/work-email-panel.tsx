import { Mail } from "lucide-react";
import { createElement } from "react";
import { Alert, AlertDescription, Badge, P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { OutlookDraftLink } from "@/features/connectors/components/outlook-draft-link";
import { EmailBody } from "@/features/email/email-body";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { ToolContent } from "@/features/tools/components/tool-content";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { emailDraftToolPreview } from "@/features/tools/utils/email-draft-tool";
import { WorkSourceEmail } from "./work-source-email";

interface EmailPanelConfig {
	kind: "source" | "tool";
	itemId: string;
}

/** Full email reader backed by live source data or the original draft tool result. */
export function WorkEmailPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<EmailPanelConfig>(id);
	const workbench = useToolWorkbench();
	if (config.kind === "tool") {
		const tool = workbench.tools[config.itemId];
		if (!tool)
			return (
				<P className="p-4">
					This draft is no longer available in the conversation.
				</P>
			);
		if (
			workbench.pendingApprovals.some(
				(approval) => approval.toolId === tool.id,
			)
		)
			return <ToolContent toolId={tool.id} />;
		const preview = emailDraftToolPreview(tool);
		return (
			<section
				aria-label="Email draft preview"
				className="h-full min-w-0 space-y-2 overflow-y-auto bg-background p-4"
			>
				<EmailMessageHeader
					subject={preview.subject || "Email draft"}
					to={preview.to ? [preview.to] : []}
					cc={preview.cc ? [preview.cc] : []}
					status={
						<Badge
							variant={
								tool.status === "FAILED"
									? "destructive"
									: "secondary"
							}
						>
							{preview.status}
						</Badge>
					}
					actions={
						tool.status === "COMPLETED" ? (
							<OutlookDraftLink webLink={preview.webLink} />
						) : undefined
					}
				/>
				{tool.status === "FAILED" && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>
							{tool.error || "The draft could not be saved."}
						</AlertDescription>
					</Alert>
				)}
				{preview.body ? (
					preview.isHtml ? (
						<EmailBody
							key={tool.id}
							html={preview.body}
							title={preview.subject || "Email draft"}
							presentation="reader"
						/>
					) : (
						<P className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">
							{preview.body}
						</P>
					)
				) : (
					<P className="text-muted-foreground">
						The tool did not provide the draft body.
					</P>
				)}
			</section>
		);
	}
	return (
		<div className="h-full overflow-y-auto">
			<WorkSourceEmail messageId={config.itemId} />
		</div>
	);
}

export const WORK_EMAIL_PANEL: WorkbenchPanelConfig<EmailPanelConfig> = {
	name: "Email",
	icon: ({ className }) =>
		createElement(Mail, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.kind === b.kind && a.itemId === b.itemId,
	content: WorkEmailPanel,
};
