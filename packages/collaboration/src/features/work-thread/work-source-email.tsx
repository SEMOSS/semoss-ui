import { CornerUpRight, ExternalLink, Reply } from "lucide-react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { EmailAttachmentReferences } from "@/features/email/email-attachment-references";
import { EmailCollapseButton } from "@/features/email/email-collapse-button";
import { hasDisplayContent } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { SourceMessageBody } from "@/features/email/source-message-body";
import { useWorkEmail } from "./work-email.context";
import { WorkEmailAttachments } from "./work-email-attachments";
import { WorkEmailMenu } from "./work-email-menu";

/** One full source email, shared by the thread list and the individual reader. */
export function WorkSourceEmail({
	messageId,
	showMenu = false,
	disclosure,
}: {
	messageId: string;
	showMenu?: boolean;
	/** Thread-owned disclosure; standalone readers always show the complete message. */
	disclosure?: {
		isExpanded: boolean;
		onExpandedChange: (isExpanded: boolean) => void;
	};
}) {
	const { thread, workspace, composer, allowedSources } = useWorkEmail();
	const { state } = useCollaborationSession();
	const message = workspace.messages.find((item) => item.id === messageId);
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
	const name =
		message.fromName ?? person?.name ?? participant?.name ?? "Participant";
	const email = message.fromAddress ?? person?.email ?? participant?.email;
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
	const isExpanded = disclosure?.isExpanded ?? true;
	const subject = message.subject || thread.subject || "Email";
	const attachments = message.attachments ?? [];
	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={disclosure?.onExpandedChange}
			asChild
		>
			<section
				aria-label="Email reader"
				className="min-w-0 rounded-lg bg-background p-4"
			>
				<EmailMessageHeader
					subject={subject}
					isExpanded={isExpanded}
					name={name}
					avatar={
						<PersonAvatar name={name} initials={person?.initials} />
					}
					address={email}
					at={message.at}
					to={message.to}
					cc={message.cc}
					status={
						!allowedSources.has(message.id) && (
							<Badge variant="outline">
								Excluded from assistant context
							</Badge>
						)
					}
					actions={
						thread.channel === "email" ||
						webLink ||
						disclosure ||
						showMenu ? (
							<>
								{thread.channel === "email" && (
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="pointer-coarse:size-11"
												aria-label="Reply"
												onClick={() =>
													composer.requestEmailDraft({
														id: `reply:${message.id}`,
														mode: "reply",
														sourceUid: message.id,
														subject:
															message.subject ||
															thread.subject,
													})
												}
											>
												<Reply aria-hidden="true" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Reply</TooltipContent>
									</Tooltip>
								)}
								{thread.channel === "email" && (
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="pointer-coarse:size-11"
												aria-label="Forward email"
												onClick={() =>
													composer.requestEmailDraft({
														id: `forward:${message.id}`,
														mode: "forward",
														sourceUid: message.id,
														subject:
															message.subject ||
															thread.subject,
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
												size="icon-sm"
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
								{showMenu && (
									<WorkEmailMenu
										messageId={message.id}
										subject={subject}
									/>
								)}
								{disclosure && (
									<EmailCollapseButton
										isExpanded={isExpanded}
										subject={subject}
									/>
								)}
							</>
						) : undefined
					}
				/>
				<CollapsibleContent
					forceMount
					hidden={!isExpanded}
					className="space-y-2 pt-2 data-[state=closed]:hidden"
				>
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
							showAttachments={attachments.length === 0}
						/>
					) : message.text ? (
						<P className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">
							{message.text}
						</P>
					) : (
						<P className="text-muted-foreground">
							No message text is available. Open the original
							email in Outlook for more details.
						</P>
					)}
					{attachments.length > 0 ? (
						<WorkEmailAttachments
							attachments={attachments}
							webLink={webLink}
						/>
					) : (
						isOriginal &&
						!message.displayBody?.attachments?.length &&
						workspace.assets.length > 0 && (
							<EmailAttachmentReferences
								attachments={workspace.assets}
							/>
						)
					)}
					{message.isTruncated && (
						<P className="text-warning">
							Source text was truncated. Open the original email
							in Outlook to read everything.
						</P>
					)}
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}
