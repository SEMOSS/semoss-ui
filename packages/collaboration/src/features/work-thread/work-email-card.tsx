import { ArrowUpRight, Mail, Paperclip } from "lucide-react";
import { Badge, Button, cn, Small } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import { ThreadMenu } from "@/features/collaboration/components/thread-menu";
import { dateLabel } from "@/features/collaboration/date-label";
import type {
	Thread,
	WorkspaceMessage,
} from "@/features/collaboration/state/collaboration.types";
import { draftText } from "@/features/email/email-html";
import { WORK_REFERENCE_CARD_CLASS_NAME } from "./work-reference.styles";

/** Compact source reference; opening it never changes the assistant's source selection. */
export function WorkEmailCard({
	thread,
	message,
	name,
	initials,
	subject,
	isIncluded,
	onOpen,
}: {
	thread: Thread;
	message: WorkspaceMessage;
	name: string;
	/** Reuse the sender's existing Work initials when available. */
	initials?: string;
	subject: string;
	isIncluded: boolean;
	onOpen: (messageId: string, trigger: HTMLElement) => void;
}) {
	const preview = (
		message.text ||
		(message.displayBody
			? draftText(
					message.displayBody.content,
					message.displayBody.contentType,
				)
			: "")
	)
		.replace(/\s+/g, " ")
		.trim();
	return (
		<ThreadMenu
			thread={thread}
			sourceMessageId={message.id}
			isSourceIncluded={isIncluded}
		>
			{(menu) => (
				<article className="flex min-w-0 items-start gap-2">
					<Button
						type="button"
						variant="outline"
						className={cn(
							WORK_REFERENCE_CARD_CLASS_NAME,
							"group/email flex-1",
						)}
						aria-label={`Open email: ${subject}, from ${name}`}
						data-preserve-reading-position
						onClick={(event) =>
							onOpen(message.id, event.currentTarget)
						}
					>
						<PersonAvatar name={name} initials={initials} />
						<span className="flex min-w-0 flex-1 flex-col gap-1">
							<Small className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-muted-foreground">
								<span className="break-words font-medium text-foreground">
									{name}
								</span>
								<span className="inline-flex items-center gap-1 font-normal">
									<Mail
										aria-hidden="true"
										className="size-3 text-primary"
									/>
									Email
								</span>
								<time dateTime={message.at}>
									{dateLabel(message.at)}
								</time>
								{!isIncluded && (
									<Badge variant="outline">Excluded</Badge>
								)}
							</Small>
							<Small className="break-words font-medium text-base">
								{subject || "Email"}
							</Small>
							<Small className="line-clamp-2 break-words font-normal text-base text-muted-foreground leading-relaxed">
								{preview ||
									"No message text · open email for details"}
							</Small>
							{Boolean(
								message.displayBody?.attachments?.length,
							) && (
								<Small className="flex items-center gap-1 text-muted-foreground">
									<Paperclip
										className="size-3"
										aria-hidden="true"
									/>
									{message.displayBody?.attachments?.length}{" "}
									attachments
								</Small>
							)}
						</span>
						<ArrowUpRight
							aria-hidden="true"
							className="mt-1 size-4 shrink-0 text-muted-foreground group-hover/email:text-primary group-focus-visible/email:text-primary"
						/>
					</Button>
					{menu}
				</article>
			)}
		</ThreadMenu>
	);
}
