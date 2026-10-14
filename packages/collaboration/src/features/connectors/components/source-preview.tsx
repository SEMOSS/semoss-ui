import { CornerUpRight, ExternalLink, MailPlus } from "lucide-react";
import { useState } from "react";
import { Button, H3, P } from "@semoss/ui/next";
import { hasDisplayContent } from "@/features/email/email-html";
import { EmailMessageHeader } from "@/features/email/email-message-header";
import { SourceMessageBody } from "@/features/email/source-message-body";
import { safeSourceUrl } from "../api/microsoft";
import type { ImportedSource } from "../types";
import { DeleteEmailDialog } from "./delete-email-dialog";
import { EmailDraftDialog } from "./email-draft-dialog";
import { MailAttachmentList } from "./mail-attachment-list";

interface SourcePreviewProps {
	source: ImportedSource;
	isLoading: boolean;
	onImport: (source: ImportedSource) => void;
	onDraftReply?: () => void;
}

/** Review actual selected source text before adding it to the local Work session. */
export function SourcePreview({
	source,
	isLoading,
	onImport,
	onDraftReply,
}: SourcePreviewProps) {
	const [isDeleted, setIsDeleted] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [draftMode, setDraftMode] = useState<"reply" | "forward" | null>(
		null,
	);
	const [importedId, setImportedId] = useState<string | null>(null);
	const identity = `${source.sourceKind}:${source.nativeId}`;
	const sourceUrl = safeSourceUrl(source.sourceUrl);
	const mail =
		source.sourceKind === "outlook"
			? source.messages.find((message) => message.id === source.nativeId)
			: undefined;
	const displayBody = mail?.displayBody;
	const hasBody =
		displayBody &&
		(displayBody.contentType === "html"
			? hasDisplayContent(displayBody.content, "email")
			: Boolean(displayBody.content.trim()));
	function handleImport(): void {
		onImport(source);
		setImportedId(identity);
	}
	if (isDeleted) return <output>Email moved to Outlook Trash.</output>;
	return (
		<section
			aria-label="Selected source"
			aria-busy={isLoading}
			className="min-w-0 rounded-lg border border-border bg-background p-4 sm:p-6"
		>
			{source.sourceKind === "outlook" ? (
				<EmailMessageHeader
					subject={source.title}
					name={mail?.senderName}
					address={
						mail?.senderAddress ||
						source.participants.find(
							(person) => person.role === "from",
						)?.address
					}
					at={source.receivedAt}
					to={source.participants
						.filter((person) => person.role === "to")
						.map(
							(person) =>
								person.address || person.name || "Participant",
						)}
					cc={source.participants
						.filter((person) => person.role === "cc")
						.map(
							(person) =>
								person.address || person.name || "Participant",
						)}
				/>
			) : (
				<>
					<H3>{source.title}</H3>
					<P className="break-words text-muted-foreground">
						{source.participants
							.map(
								(person) =>
									person.name ||
									person.address ||
									"Participant",
							)
							.join(" · ")}
					</P>
				</>
			)}
			<div className="my-4 flex flex-wrap gap-2">
				<Button
					type="button"
					disabled={isLoading}
					onClick={handleImport}
				>
					{importedId === identity ? "Update in Work" : "Add to Work"}
				</Button>
				{source.sourceKind === "outlook" && (
					<>
						{onDraftReply && (
							<Button
								type="button"
								variant="outline"
								disabled={isLoading}
								onClick={onDraftReply}
							>
								Draft reply
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							disabled={isLoading}
							onClick={() => setIsDeleting(true)}
						>
							Delete email
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={isLoading}
							onClick={() => setDraftMode("reply")}
						>
							<MailPlus aria-hidden="true" />
							Reply
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={isLoading}
							onClick={() => setDraftMode("forward")}
						>
							<CornerUpRight aria-hidden="true" />
							Forward
						</Button>
					</>
				)}
				{sourceUrl && (
					<Button
						asChild
						variant="link"
						size="sm"
						className="h-auto min-h-8 max-w-full self-center whitespace-normal text-left"
					>
						<a
							href={sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							{source.sourceKind === "outlook" && (
								<ExternalLink aria-hidden="true" />
							)}
							{source.sourceKind === "outlook" ||
							source.sourceKind === "calendar"
								? "Open in Outlook"
								: "Open source"}
						</a>
					</Button>
				)}
			</div>
			<output className="block text-muted-foreground text-sm">
				{importedId === identity
					? "Added to Work for this session."
					: ""}
			</output>
			{source.isTruncated && (
				<P className="text-muted-foreground">
					This preview was truncated by the source connector.
				</P>
			)}
			{source.sourceKind === "outlook" ? (
				<div className="min-w-0 py-4">
					<SourceMessageBody
						key={identity}
						body={
							hasBody && displayBody
								? displayBody
								: {
										contentType: "text",
										content:
											source.body || "No message text.",
										isTruncated: displayBody?.isTruncated,
										attachments: displayBody?.attachments,
									}
						}
						channel="email"
						title={source.title}
						showAttachments={source.attachments.length === 0}
					/>
				</div>
			) : (
				<div className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-4">
					<P>{source.body || "No message text."}</P>
				</div>
			)}
			{source.sourceKind === "outlook" &&
				source.attachments.length > 0 && (
					<div className="mt-4">
						<P className="mb-3 font-medium">
							Attachments · {source.attachments.length}
						</P>
						<MailAttachmentList
							key={source.nativeId}
							sourceUid={source.nativeId}
							attachments={source.attachments}
						/>
					</div>
				)}
			{isDeleting && (
				<DeleteEmailDialog
					sourceId={source.nativeId}
					subject={source.title}
					onDeleted={() => setIsDeleted(true)}
					onClose={() => setIsDeleting(false)}
				/>
			)}
			{draftMode && (
				<EmailDraftDialog
					key={`${identity}:${draftMode}`}
					isOpen
					mode={draftMode}
					sourceUid={source.nativeId}
					initialSubject={source.title}
					replyContext={{
						name: mail?.senderName,
						address:
							mail?.senderAddress ||
							source.participants.find(
								(person) => person.role === "from",
							)?.address,
					}}
					onOpenChange={(open) => {
						if (!open) setDraftMode(null);
					}}
				/>
			)}
		</section>
	);
}
