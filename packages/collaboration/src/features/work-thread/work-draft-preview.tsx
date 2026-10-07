import { FilePenLine, Paperclip } from "lucide-react";
import type { ReactNode } from "react";
import { Button, Collapsible, CollapsibleContent, P } from "@semoss/ui/next";
import { EmailBody } from "@/features/email/email-body";
import { EmailCollapseButton } from "@/features/email/email-collapse-button";
import { draftText } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";

interface WorkDraftPreviewProps {
	/** Stable thread search and scroll identity, shared with the retained editor. */
	itemId: string;
	subject: string;
	to: string;
	cc: string;
	body: string;
	attachments?: string[];
	status: ReactNode;
	isExpanded: boolean;
	onExpandedChange: (isExpanded: boolean) => void;
	/** Open the separate editor without modifying or saving the draft. */
	onOpen: () => void;
}

/** Read-only mail surface for drafts arriving in the source thread. */
export function WorkDraftPreview({
	itemId,
	subject,
	to,
	cc,
	body,
	attachments = [],
	status,
	isExpanded,
	onExpandedChange,
	onOpen,
}: WorkDraftPreviewProps) {
	const text = draftText(body, "html");
	return (
		<Collapsible open={isExpanded} onOpenChange={onExpandedChange} asChild>
			<article
				aria-label={`Email draft: ${subject}`}
				data-scroll-anchor={itemId}
				data-search-item={itemId}
				data-search-text={[subject, to, cc, text, ...attachments].join(
					" ",
				)}
				className="min-w-0 rounded-lg border border-border bg-background p-4"
			>
				<EmailMessageHeader
					subject={subject}
					to={to
						.split(/[,;\n]/)
						.map((address) => address.trim())
						.filter(Boolean)}
					cc={cc
						.split(/[,;\n]/)
						.map((address) => address.trim())
						.filter(Boolean)}
					isExpanded={isExpanded}
					status={status}
					actions={
						<>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11"
								aria-label={`Open draft: ${subject}`}
								onClick={onOpen}
							>
								<FilePenLine aria-hidden="true" />
								Open draft
							</Button>
							<EmailCollapseButton
								isExpanded={isExpanded}
								subject={subject}
							/>
						</>
					}
				/>
				<CollapsibleContent
					forceMount
					hidden={!isExpanded}
					className="space-y-2 pt-2 data-[state=closed]:hidden"
				>
					{text ? (
						<EmailBody
							html={body}
							title={`Draft: ${subject}`}
							presentation="reader"
						/>
					) : (
						<P className="text-muted-foreground">
							Continue writing your draft.
						</P>
					)}
					{attachments.length > 0 && (
						<ul
							aria-label="Draft attachments"
							className="flex flex-wrap gap-2"
						>
							{attachments.map((name, index) => (
								<li
									key={`${index}:${name}`}
									className="inline-flex min-w-0 items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-base"
								>
									<Paperclip
										aria-hidden="true"
										className="size-4 shrink-0"
									/>
									<span className="min-w-0 break-all">
										{name}
									</span>
								</li>
							))}
						</ul>
					)}
				</CollapsibleContent>
			</article>
		</Collapsible>
	);
}
