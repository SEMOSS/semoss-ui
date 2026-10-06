import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, P, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { EmailBody } from "@/features/email/email-body";
import { draftText } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import type { ConversationTool } from "@/features/messages/types/message";

/** A recipient argument as either a comma/semicolon separated string or an array. */
function addressList(value: unknown): string[] {
	if (Array.isArray(value))
		return value.filter((item): item is string => typeof item === "string");
	if (typeof value === "string")
		return value
			.split(/[,;\n]/)
			.map((address) => address.trim())
			.filter(Boolean);
	return [];
}

function textArg(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/** First matching string field of a JSON tool result, if present. */
function outputField(
	output: string | undefined,
	keys: string[],
): string | undefined {
	if (!output) return undefined;
	try {
		const parsed: unknown = JSON.parse(output);
		if (!parsed || typeof parsed !== "object") return undefined;
		for (const key of keys) {
			const value = (parsed as Record<string, unknown>)[key];
			if (typeof value === "string" && value) return value;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

/** Only an https link is safe to render as an outbound "Open in Outlook" action. */
function safeHttpsLink(value: string | undefined): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : undefined;
	} catch {
		return undefined;
	}
}

const BODY_CLAMP_CHARS = 800;
const BODY_CLAMP_LINES = 12;

const DRAFT_STATUS: Partial<Record<ConversationTool["status"], string>> = {
	COMPLETED: "Saved to Outlook drafts",
	REJECTED: "Draft not saved",
	CANCELLED: "Draft not saved",
};
const COMPOSE_STATUS: Partial<Record<ConversationTool["status"], string>> = {
	COMPLETED: "Not saved or sent",
};
const SEND_STATUS: Partial<Record<ConversationTool["status"], string>> = {
	INPUT_REQUIRED: "Waiting for your approval to send",
	COMPLETED: "Sent",
	REJECTED: "Not sent",
	CANCELLED: "Not sent",
};

const STATUS_BY_MODE = {
	draft: DRAFT_STATUS,
	send: SEND_STATUS,
	compose: COMPOSE_STATUS,
};
const PENDING_BY_MODE = {
	draft: "Saving draft...",
	send: "Sending...",
	compose: "Writing...",
};

/**
 * The email a mail tool writes, shown in place of the generic tool card: a
 * draft it saves to Outlook, a message it sends once approved, or one written
 * for the owner's editor that is not saved anywhere.
 */
export function EmailDraftCard({
	tool,
	mode = "draft",
}: {
	tool: ConversationTool;
	mode?: "draft" | "send" | "compose";
}) {
	const [expanded, setExpanded] = useState(false);
	const [copied, setCopied] = useState(false);
	const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	useEffect(() => () => clearTimeout(copyTimer.current), []);

	const to = addressList(tool.arguments.to);
	const cc = addressList(tool.arguments.cc);
	const subject = textArg(tool.arguments.subject);
	const rawBody = textArg(tool.arguments.message);
	const isHtml =
		tool.arguments.html === true || tool.arguments.html === "true";
	const body = useMemo(
		() => (isHtml ? draftText(rawBody, "html") : rawBody),
		[isHtml, rawBody],
	);

	const webLink = safeHttpsLink(outputField(tool.output, ["webLink"]));

	const statusText =
		tool.status === "FAILED"
			? `${mode === "send" ? "Could not send" : "Could not save draft"}: ${tool.error || "Something went wrong."}`
			: (STATUS_BY_MODE[mode][tool.status] ?? PENDING_BY_MODE[mode]);

	const lines = body.split("\n");
	const isLong =
		body.length > BODY_CLAMP_CHARS || lines.length > BODY_CLAMP_LINES;
	const clamped = lines.slice(0, BODY_CLAMP_LINES).join("\n");
	const displayBody =
		isLong && !expanded ? clamped.slice(0, BODY_CLAMP_CHARS) : body;

	async function handleCopy(): Promise<void> {
		try {
			await copyTextToClipboard(body);
			setCopied(true);
			clearTimeout(copyTimer.current);
			copyTimer.current = setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Could not copy the draft body.");
		}
	}

	return (
		<section
			aria-label={mode === "send" ? "Email" : "Email draft"}
			className="min-w-0 space-y-4 border-border border-t p-4"
		>
			<EmailMessageHeader
				subject={subject || (mode === "send" ? "Email" : "Email draft")}
				to={to}
				cc={cc}
				status={
					<Badge
						variant={
							tool.status === "FAILED"
								? "destructive"
								: "secondary"
						}
					>
						{statusText}
					</Badge>
				}
				actions={
					<>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="min-h-9 pointer-coarse:min-h-11"
							onClick={() => void handleCopy()}
						>
							{copied ? (
								<Check aria-hidden="true" />
							) : (
								<Copy aria-hidden="true" />
							)}
							Copy
						</Button>
						{webLink && tool.status === "COMPLETED" && (
							<Button
								variant="ghost"
								size="sm"
								className="min-h-9 pointer-coarse:min-h-11"
								asChild
							>
								<a
									href={webLink}
									target="_blank"
									rel="noreferrer"
								>
									<ExternalLink aria-hidden="true" />
									Open in Outlook
								</a>
							</Button>
						)}
					</>
				}
			/>
			{isHtml ? (
				<EmailBody
					key={tool.id}
					html={rawBody}
					title={subject || "Email draft"}
				/>
			) : (
				<>
					<P className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">
						{displayBody}
						{isLong && !expanded ? "\u2026" : ""}
					</P>
					{isLong && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-expanded={expanded}
							onClick={() => setExpanded((value) => !value)}
						>
							{expanded ? "Show less" : "Show more"}
						</Button>
					)}
				</>
			)}
		</section>
	);
}
