import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Muted,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { getMail, safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { OutlookMail } from "@/features/connectors/api/microsoft-schemas";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { SourceMessageBody } from "@/features/email/source-message-body";

interface MailReaderProps {
	/** The email to show: the newest of its conversation in the folder. */
	messageId: string;
	/** The sender as the list names them; the email itself only carries the address. */
	senderName?: string;
	/** How many emails of the conversation the folder lists. */
	count: number;
}

const addresses = (line: string | undefined): string[] =>
	line ? line.split(", ") : [];

/** One email read from Outlook as it is there, so the owner can tell what it is before filing it. */
export function MailReader({ messageId, senderName, count }: MailReaderProps) {
	const { actions } = useInsight();
	const [read, setRead] = useState<{ mail?: OutlookMail; error: string }>({
		error: "",
	});
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		void attempt;
		let isCurrent = true;
		getMail(actions, messageId).then(
			(mail) => {
				if (isCurrent) setRead({ mail, error: "" });
			},
			(cause: unknown) => {
				if (isCurrent)
					setRead({
						error:
							cause instanceof Error
								? cause.message
								: "Could not read this email.",
					});
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [actions, messageId, attempt]);
	const { mail } = read;

	if (read.error)
		return (
			<Alert variant="destructive">
				<AlertDescription className="space-y-2">
					<P className="text-sm">{read.error}</P>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="pointer-coarse:min-h-11"
						onClick={() => {
							setRead({ error: "" });
							setAttempt((value) => value + 1);
						}}
					>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		);
	if (!mail)
		return (
			<output className="block space-y-3">
				<span className="sr-only">Loading email…</span>
				<Skeleton className="h-6 w-2/3" />
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-32 w-full" />
			</output>
		);
	const link = safeSourceUrl(mail.webLink);
	return (
		<article className="min-w-0 space-y-4">
			<EmailMessageHeader
				subject={mail.subject ?? ""}
				name={senderName}
				address={mail.from}
				at={mail.receivedDate ?? mail.sentDate}
				to={addresses(mail.to)}
				cc={addresses(mail.cc)}
				actions={
					link && (
						<Button asChild variant="outline" size="sm">
							<a
								href={link}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink aria-hidden="true" />
								Open in Outlook
							</a>
						</Button>
					)
				}
			/>
			<SourceMessageBody
				body={
					mail.displayBody ?? {
						contentType: "text",
						content: mail.body ?? "",
					}
				}
				channel="email"
				title={mail.subject ?? "Email"}
				presentation="reader"
			/>
			{count > 1 && (
				<Muted className="block border-t pt-3 font-normal text-xs">
					This is the newest of {count} emails in this conversation.
					Adding it files the whole conversation.
				</Muted>
			)}
		</article>
	);
}
