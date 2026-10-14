import { ExternalLink } from "lucide-react";
import { useId, useState } from "react";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { hasDisplayContent } from "@/features/email/email-html";
import { SourceMessageBody } from "@/features/email/source-message-body";
import { dateLabel } from "../date-label";
import { isLongText, messageSegments } from "../message-text";
import type { Channel, WorkspaceMessage } from "../state/collaboration.types";
import { MessageText } from "./message-text";
import { PersonAvatar } from "./person-avatar";

/** One source message: who, when, to whom, the text, and any forwarded or earlier mail under it. */
export function ThreadMessage({
	message,
	name,
	initials,
	channel,
	isIncluded,
	isEmpty,
	isFlat = false,
}: {
	message: WorkspaceMessage;
	name: string;
	initials?: string;
	channel: Channel;
	isIncluded: boolean;
	isEmpty: boolean;
	/** Align source messages with the unframed Work timeline. */
	isFlat?: boolean;
}) {
	const bodyId = useId();
	const [isExpanded, setIsExpanded] = useState(false);
	const hasDisplay = Boolean(
		message.displayBody &&
			((message.displayBody.contentType === "html"
				? hasDisplayContent(message.displayBody.content, channel)
				: message.displayBody.content.trim()) ||
				message.displayBody.attachments?.length),
	);
	const isBodyEmpty = isEmpty && !hasDisplay;
	const isLong = !hasDisplay && !isBodyEmpty && isLongText(message.text);
	const segments = messageSegments(message.text, message.history);
	const recipients = [...(message.to ?? []), ...(message.cc ?? [])];
	return (
		<article className="group flex gap-3">
			<div className="flex shrink-0 flex-col items-center gap-1">
				<PersonAvatar
					name={name}
					initials={initials}
					className={isFlat ? "size-8" : undefined}
				/>
				{!isFlat && (
					<span
						aria-hidden="true"
						className="min-h-3 w-px flex-1 bg-border group-last:hidden"
					/>
				)}
			</div>
			<div
				className={cn(
					"min-w-0 flex-1",
					isFlat ? "space-y-2" : "space-y-1 pb-5",
				)}
			>
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<Small className="font-medium">{name}</Small>
					<Small className="text-muted-foreground text-xs">
						{"\u00b7"} {dateLabel(message.at)}
					</Small>
					{isBodyEmpty ? (
						<Badge variant="secondary">No text</Badge>
					) : (
						!isIncluded && <Badge variant="outline">Excluded</Badge>
					)}
					{message.history && !isBodyEmpty && (
						<Badge variant="secondary" className="font-normal">
							Includes earlier mail
						</Badge>
					)}
					{message.webLink && (
						<a
							href={message.webLink}
							target="_blank"
							rel="noreferrer"
							className="ml-auto inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
						>
							<ExternalLink
								aria-hidden="true"
								className="size-3"
							/>
							{channel === "teams"
								? "Open in Teams"
								: "Open in Outlook"}
						</a>
					)}
				</div>
				{recipients.length > 0 && (
					<Small className="block truncate text-muted-foreground text-xs">
						to {recipients.slice(0, 4).join(", ")}
						{recipients.length > 4 && ` +${recipients.length - 4}`}
					</Small>
				)}
				{isBodyEmpty ? (
					<P className="text-muted-foreground leading-relaxed">
						Nothing to read here: an invite, an image, or only a
						quoted reply.
					</P>
				) : hasDisplay && message.displayBody ? (
					<SourceMessageBody
						key={message.id}
						body={message.displayBody}
						channel={channel}
						title={`${channel === "teams" ? "Message" : "Email"} from ${name}`}
					/>
				) : (
					<div
						id={bodyId}
						className={cn(
							"space-y-3",
							isLong && !isExpanded && "max-h-72 overflow-hidden",
							!isIncluded && "text-muted-foreground",
						)}
					>
						{segments.map((segment, index) =>
							segment.label ? (
								<blockquote
									// biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder
									key={index}
									className="space-y-1 border-border border-l-2 pl-3"
								>
									<Small className="block font-medium text-muted-foreground text-xs">
										{segment.label}
									</Small>
									<MessageText text={segment.text} />
								</blockquote>
							) : (
								// biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder
								<MessageText key={index} text={segment.text} />
							),
						)}
					</div>
				)}
				{isLong && (
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2 text-primary"
						aria-expanded={isExpanded}
						aria-controls={bodyId}
						onClick={() => setIsExpanded((value) => !value)}
					>
						{isExpanded ? "Show less" : "Show more"}
					</Button>
				)}
				{message.isTruncated && (
					<Small className="text-warning">
						Source text was truncated.
					</Small>
				)}
			</div>
		</article>
	);
}
