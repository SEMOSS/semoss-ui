import { CornerUpRight, ExternalLink, Mail, Reply } from "lucide-react";
import { createElement } from "react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	P,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { OutlookDraftLink } from "@/features/connectors/components/outlook-draft-link";
import { EmailAttachmentReferences } from "@/features/email/email-attachment-references";
import { EmailBody } from "@/features/email/email-body";
import { hasDisplayContent } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { SourceMessageBody } from "@/features/email/source-message-body";
import { ToolContent } from "@/features/tools/components/tool-content";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { emailDraftToolPreview } from "@/features/tools/utils/email-draft-tool";
import { useWorkEmail } from "./work-email.context";

interface EmailPanelConfig {
	kind: "source" | "tool";
	itemId: string;
}

/** Full email reader backed by live source data or the original draft tool result. */
export function WorkEmailPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<EmailPanelConfig>(id);
	const { thread, workspace, composer, allowedSources } = useWorkEmail();
	const { state } = useCollaborationSession();
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
				className="h-full min-w-0 space-y-6 overflow-y-auto bg-background @md/workspace:p-6 p-4"
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
	const message = workspace.messages.find(
		(item) => item.id === config.itemId,
	);
	if (!message)
		return (
			<P className="p-4">
				This email is no longer available in the thread.
			</P>
		);
	const person = state.people.find((person) => person.id === message.fromId);
	const participant = thread.participants.find(
		(person) => person.personId === message.fromId,
	);
	const name = person?.name ?? participant?.name ?? "Participant";
	const email = person?.email ?? participant?.email;
	const sourceUid =
		thread.source?.kind === "outlook" ? thread.source.nativeId : undefined;
	const isOriginal = sourceUid === message.id;
	const webLink = safeSourceUrl(
		message.webLink || (isOriginal ? thread.source?.webLink : undefined),
	);
	const hasBody =
		message.displayBody &&
		(message.displayBody.contentType === "html"
			? hasDisplayContent(message.displayBody.content, "email")
			: Boolean(message.displayBody.content.trim()));
	return (
		<section
			aria-label="Email reader"
			className="h-full min-w-0 space-y-6 overflow-y-auto bg-background @md/workspace:p-6 p-4"
		>
			<EmailMessageHeader
				subject={thread.subject || "Email"}
				name={name}
				avatar={
					<PersonAvatar name={name} initials={person?.initials} />
				}
				address={email}
				at={message.at}
				to={message.to}
				cc={message.cc}
				status={
					<>
						<Small className="inline-flex items-center gap-1 text-muted-foreground">
							<Mail
								aria-hidden="true"
								className="size-4 text-primary"
							/>
							Email
						</Small>
						{!allowedSources.has(message.id) && (
							<Badge variant="outline">
								Excluded from assistant context
							</Badge>
						)}
					</>
				}
				actions={
					isOriginal || webLink ? (
						<>
							{isOriginal && (
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										composer.requestEmailDraft({
											id: `reply:${sourceUid}`,
											mode: "reply",
											sourceUid,
											subject: thread.subject,
										})
									}
								>
									<Reply aria-hidden="true" />
									Reply
								</Button>
							)}
							{isOriginal && (
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="pointer-coarse:size-11"
											aria-label="Forward email"
											onClick={() =>
												composer.requestEmailDraft({
													id: `forward:${sourceUid}`,
													mode: "forward",
													sourceUid,
													subject: thread.subject,
												})
											}
										>
											<CornerUpRight aria-hidden="true" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Forward email
									</TooltipContent>
								</Tooltip>
							)}

							{webLink && (
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="pointer-coarse:size-11"
											asChild
										>
											<a
												aria-label="Open in Outlook"
												href={webLink}
												target="_blank"
												rel="noreferrer"
											>
												<ExternalLink aria-hidden="true" />
											</a>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Open in Outlook
									</TooltipContent>
								</Tooltip>
							)}
						</>
					) : undefined
				}
			/>
			{message.displayBody ? (
				<SourceMessageBody
					key={message.id}
					body={
						hasBody
							? message.displayBody
							: {
									...message.displayBody,
									contentType: "text",
									content:
										message.text ||
										"No message text is available. Open the original email in Outlook for more details.",
								}
					}
					channel="email"
					title={`Email from ${name}`}
					presentation="reader"
				/>
			) : message.text ? (
				<P className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">
					{message.text}
				</P>
			) : (
				<P className="text-muted-foreground">
					No message text is available. Open the original email in
					Outlook for more details.
				</P>
			)}
			{isOriginal &&
				!message.displayBody?.attachments?.length &&
				workspace.assets.length > 0 && (
					<EmailAttachmentReferences attachments={workspace.assets} />
				)}
			{message.isTruncated && (
				<P className="mt-4 text-warning">
					Source text was truncated. Open the original email in
					Outlook to read everything.
				</P>
			)}
		</section>
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
