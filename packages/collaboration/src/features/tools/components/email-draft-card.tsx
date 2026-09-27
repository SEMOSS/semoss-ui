import { Check, Copy, ExternalLink, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, cn, Muted, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
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

/** Strip tags from an HTML draft body down to readable plain text. */
function htmlToText(html: string): string {
	try {
		const doc = new DOMParser().parseFromString(html, "text/html");
		return doc.body.textContent ?? "";
	} catch {
		return html.replace(/<[^>]*>/g, "");
	}
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

	const to = addressList(tool.arguments.to);
	const cc = addressList(tool.arguments.cc);
	const subject = textArg(tool.arguments.subject);
	const rawBody = textArg(tool.arguments.message);
	const isHtml =
		tool.arguments.html === true || tool.arguments.html === "true";
	const body = useMemo(
		() => (isHtml ? htmlToText(rawBody) : rawBody),
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

	async function handleCopy() {
		try {
			await copyTextToClipboard(body);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Could not copy the draft body.");
		}
	}

	return (
		<div className="flex flex-col gap-2 border-t p-3 text-sm">
			<div className="flex items-center gap-2">
				<Mail
					aria-hidden="true"
					className="size-4 shrink-0 text-muted-foreground"
				/>
				<span className="font-medium">Email draft</span>
				<Muted
					className={cn(
						"text-xs",
						tool.status === "FAILED" && "text-destructive",
					)}
				>
					{statusText}
				</Muted>
			</div>
			<div className="flex flex-col gap-1 text-muted-foreground text-xs">
				{to.length > 0 && (
					<p>
						<span className="font-medium text-foreground">To </span>
						{to.join(", ")}
					</p>
				)}
				{cc.length > 0 && (
					<p>
						<span className="font-medium text-foreground">Cc </span>
						{cc.join(", ")}
					</p>
				)}
			</div>
			{subject && <p className="font-semibold">{subject}</p>}
			<p className="wrap-break-word whitespace-pre-wrap leading-6">
				{displayBody}
				{isLong && !expanded ? "..." : ""}
			</p>
			{isLong && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="w-fit px-2"
					onClick={() => setExpanded((value) => !value)}
				>
					{expanded ? "Show less" : "Show more"}
				</Button>
			)}
			<div className="flex items-center gap-2 pt-1">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => void handleCopy()}
				>
					{copied ? (
						<Check aria-hidden="true" className="size-3.5" />
					) : (
						<Copy aria-hidden="true" className="size-3.5" />
					)}
					Copy
				</Button>
				{webLink && (
					<a
						href={webLink}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-primary text-xs underline"
					>
						<ExternalLink aria-hidden="true" className="size-3.5" />
						Open in Outlook
					</a>
				)}
			</div>
		</div>
	);
}
