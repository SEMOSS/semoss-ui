import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge, Button, cn, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { isLongText, messageSegments, textParts } from "../message-text";
import type { Channel, WorkspaceMessage } from "../state/collaboration.types";
import { PersonAvatar } from "./person-avatar";

/** One source message: who, when, to whom, the text, and any forwarded or earlier mail under it. */
export function ThreadMessage({
	message,
	name,
	initials,
	channel,
	isIncluded,
	isEmpty,
}: {
	message: WorkspaceMessage;
	name: string;
	initials?: string;
	channel: Channel;
	isIncluded: boolean;
	isEmpty: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isLong = !isEmpty && isLongText(message.text);
	const segments = messageSegments(message.text, message.history);
	const recipients = [...(message.to ?? []), ...(message.cc ?? [])];
	return (
		<article className="group flex gap-3">
			<div className="flex shrink-0 flex-col items-center gap-1">
				<PersonAvatar name={name} initials={initials} />
				<span
					aria-hidden="true"
					className="min-h-3 w-px flex-1 bg-border group-last:hidden"
				/>
			</div>
			<div className="min-w-0 flex-1 space-y-1 pb-5">
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<Small className="font-medium">{name}</Small>
					<Small className="text-muted-foreground text-xs">
						{"\u00b7"} {dateLabel(message.at)}
					</Small>
					{isEmpty ? (
						<Badge variant="secondary">No text</Badge>
					) : (
						!isIncluded && <Badge variant="outline">Excluded</Badge>
					)}
					{message.history && !isEmpty && (
						<Badge variant="secondary" className="font-normal">
							Includes earlier mail
						</Badge>
					)}
					{message.webLink && (
						<a
							href={message.webLink}
							target="_blank"
							rel="noreferrer"
							className="ml-auto inline-flex items-center gap-1 text-muted-foreground text-xs opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
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
				{isEmpty ? (
					<P className="text-muted-foreground leading-relaxed">
						Nothing to read here: an invite, an image, or only a
						quoted reply.
					</P>
				) : (
					<div
						className={cn(
							"space-y-3",
							isLong &&
								!isExpanded &&
								"relative max-h-72 overflow-hidden after:absolute after:inset-x-0 after:bottom-0 after:h-12 after:bg-gradient-to-t after:from-background after:to-transparent",
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

// plain text; only http(s) links become anchors
function MessageText({ text }: { text: string }) {
	return (
		<P className="whitespace-pre-wrap break-words leading-relaxed">
			{textParts(text).map((part, index) =>
				part.kind === "link" ? (
					<a
						// biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reorder
						key={index}
						href={part.href}
						target="_blank"
						rel="noreferrer"
						className="break-all text-primary underline underline-offset-2"
					>
						{part.href}
					</a>
				) : (
					part.text
				),
			)}
		</P>
	);
}
