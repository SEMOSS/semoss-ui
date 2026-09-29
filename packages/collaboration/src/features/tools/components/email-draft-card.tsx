import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, P, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { EmailBody } from "@/features/email/email-body";
import { draftText } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import type { ConversationTool } from "@/features/messages/types/message";

// Reactor/MCP tool names both end in this, e.g. "MicrosoftOutlookSaveDraft"
// or an MCP-prefixed "mcp__outlook__SaveDraft".
const SAVE_DRAFT_SUFFIX = "SaveDraft";

/** Whether a tool call is the Outlook "save draft" write, whatever name it arrived under. */
export function isEmailDraftTool(tool: ConversationTool): boolean {
	const candidates = [
		tool.name,
		tool.metadata?.SMSS_ORIGINAL_TOOL_NAME,
		tool.metadata?.SMSS_FUNCTION_NAME,
	];
	return candidates.some(
		(name) => typeof name === "string" && name.endsWith(SAVE_DRAFT_SUFFIX),
	);
}

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

/** Dedicated card for a saved Outlook draft, shown in place of the generic tool card. */
export function EmailDraftCard({ tool }: { tool: ConversationTool }) {
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
			? `Could not save draft: ${tool.error || "Something went wrong."}`
			: tool.status === "COMPLETED"
				? "Saved to Outlook drafts"
				: tool.status === "REJECTED" || tool.status === "CANCELLED"
					? "Draft not saved"
					: "Saving draft...";

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
			aria-label="Email draft"
			className="min-w-0 space-y-4 border-border border-t p-4"
		>
			<EmailMessageHeader
				subject={subject || "Email draft"}
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
						{isLong && !expanded ? "…" : ""}
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
