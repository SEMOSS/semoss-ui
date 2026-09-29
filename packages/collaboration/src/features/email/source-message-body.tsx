import { P, Small } from "@semoss/ui/next";
import { EmailBody } from "./email-body";
import { teamsHtml } from "./email-html";
import type { DisplayBody } from "./message-body";

/** Source-specific rendering; every HTML path sanitizes immediately before insertion. */
export function SourceMessageBody({
	body,
	channel,
	title,
}: {
	body: DisplayBody;
	channel: string;
	title: string;
}) {
	return (
		<div className="min-w-0 space-y-2">
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
					<EmailBody html={body.content} title={title} />
				)
			) : (
				<P className="whitespace-pre-wrap break-words">
					{body.content}
				</P>
			)}
			{body.attachments?.map((attachment, index) => (
				<Small
					key={`${index}:${attachment.name}`}
					className="block text-muted-foreground"
				>
					{attachment.name} — open in{" "}
					{channel === "teams" ? "Teams" : "Outlook"}
				</Small>
			))}
			{body.isTruncated && (
				<Small className="block text-warning">
					Original formatting is too large to display. Showing source
					text.
				</Small>
			)}
		</div>
	);
}
