import { cn, P, Small } from "@semoss/ui/next";
import { EmailAttachmentReferences } from "./email-attachment-references";
import { EmailBody } from "./email-body";
import { teamsHtml } from "./email-html";
import type { DisplayBody } from "./message-body";

/** Source-specific rendering; every HTML path sanitizes immediately before insertion. */
export function SourceMessageBody({
	body,
	channel,
	title,
	presentation,
	showAttachments = true,
}: {
	body: DisplayBody;
	channel: string;
	title: string;
	presentation?: "inline" | "reader";
	/** Native attachment lists supplied by a host replace display-only references. */
	showAttachments?: boolean;
}) {
	return (
		<div
			className={cn(
				"min-w-0",
				channel === "teams" ? "space-y-2" : "space-y-6",
			)}
		>
			{body.contentType === "html" ? (
				channel === "teams" ? (
					<div
						className="min-w-0 overflow-x-auto break-words leading-relaxed [&_[data-mention]]:font-semibold [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:font-mono [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: teamsHtml returns an allowlisted, sanitized fragment with no source CSS or media.
						dangerouslySetInnerHTML={{
							__html: teamsHtml(body.content),
						}}
					/>
				) : (
					<EmailBody
						html={body.content}
						title={title}
						presentation={presentation}
					/>
				)
			) : (
				<P
					className={cn(
						"whitespace-pre-wrap break-words",
						channel !== "teams" && "max-w-prose leading-relaxed",
					)}
				>
					{body.content}
				</P>
			)}
			{showAttachments && body.attachments?.length ? (
				channel === "teams" ? (
					body.attachments.map((attachment, index) => (
						<Small
							key={`${index}:${attachment.name}`}
							className="block text-muted-foreground"
						>
							{attachment.name} — open in Teams
						</Small>
					))
				) : (
					<EmailAttachmentReferences attachments={body.attachments} />
				)
			) : null}
			{body.isTruncated && (
				<Small className="block text-warning">
					Original formatting is too large to display. Showing source
					text.
				</Small>
			)}
		</div>
	);
}
