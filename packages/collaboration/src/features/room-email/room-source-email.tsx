import { ExternalLink, Reply } from "lucide-react";
import {
	Button,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { EmailAttachmentReferences } from "@/features/email/email-attachment-references";
import { hasDisplayContent } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { SourceMessageBody } from "@/features/email/source-message-body";
import type { RoomSource } from "@/features/rooms/source-import/room-source";

interface RoomSourceEmailProps {
	/** The room's imported envelope metadata and permitted source identities. */
	source: RoomSource;
	/** A currently permitted source message, loaded through its source API. */
	message: WorkspaceMessage;
	isLoading: boolean;
	onReply: (messageId: string) => void;
}

/** The existing Work source-email reader, with its data and actions owned by a room. */
export function RoomSourceEmail({
	source,
	message,
	isLoading,
	onReply,
}: RoomSourceEmailProps) {
	const metadata = source.messages.find((item) => item.id === message.id);
	const name = message.fromName || metadata?.fromName;
	const address = message.fromAddress || metadata?.fromAddress;
	const subject =
		message.subject || metadata?.subject || source.title || "Email";
	const webLink = safeSourceUrl(
		message.webLink ||
			(message.id === source.nativeId ? source.webLink : undefined),
	);
	const hasBody =
		message.displayBody &&
		(message.displayBody.contentType === "html"
			? hasDisplayContent(message.displayBody.content, "email")
			: Boolean(message.displayBody.content.trim()));
	const attachments = message.attachments?.length
		? message.attachments
		: (message.displayBody?.attachments ?? []);
	const canReply =
		source.channel === "email" &&
		source.kind !== "sample" &&
		Boolean(metadata) &&
		!message.excluded;
	return (
		<section
			aria-label="Email reader"
			className="min-w-0 space-y-2 bg-background"
		>
			<EmailMessageHeader
				subject={subject}
				name={name}
				avatar={
					<PersonAvatar name={name || address || "Participant"} />
				}
				address={address}
				at={message.at || metadata?.at}
				to={message.to ?? metadata?.to}
				cc={message.cc ?? metadata?.cc}
				actions={
					<>
						{canReply && (
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className="pointer-coarse:size-11"
										aria-label="Reply"
										disabled={isLoading}
										onClick={() => onReply(message.id)}
									>
										<Reply aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Reply</TooltipContent>
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
											rel="noopener noreferrer"
										>
											<ExternalLink aria-hidden="true" />
										</a>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Open in Outlook</TooltipContent>
							</Tooltip>
						)}
					</>
				}
			/>
			<div className="space-y-2 pt-2">
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
											"No message text is available.",
									}
						}
						channel="email"
						title={`Email from ${name || address || "Participant"}`}
						presentation="reader"
						showAttachments={false}
					/>
				) : (
					<P className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">
						{message.text || "No message text is available."}
					</P>
				)}
				<EmailAttachmentReferences attachments={attachments} />
				{message.isTruncated && !message.displayBody?.isTruncated && (
					<P className="text-warning">
						Source text was truncated. Open the original email in
						Outlook to read everything.
					</P>
				)}
			</div>
		</section>
	);
}
