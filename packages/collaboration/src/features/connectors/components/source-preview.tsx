import { useState } from "react";
import { Button, H3, P } from "@semoss/ui/next";
import { safeSourceUrl } from "../api/microsoft";
import type { ImportedSource } from "../types";
import { EmailDraftDialog } from "./email-draft-dialog";
import { MailAttachmentList } from "./mail-attachment-list";

interface SourcePreviewProps {
	source: ImportedSource;
	isLoading: boolean;
	onImport: (source: ImportedSource) => void;
}

/** Review actual selected source text before adding it to the local Work session. */
export function SourcePreview({
	source,
	isLoading,
	onImport,
}: SourcePreviewProps) {
	const [draftMode, setDraftMode] = useState<"reply" | "forward" | null>(
		null,
	);
	const [importedId, setImportedId] = useState<string | null>(null);
	const identity = `${source.sourceKind}:${source.nativeId}`;
	const sourceUrl = safeSourceUrl(source.sourceUrl);
	function handleImport(): void {
		onImport(source);
		setImportedId(identity);
	}
	return (
		<section
			aria-label="Selected source"
			aria-busy={isLoading}
			className="min-w-0 rounded-lg border border-border bg-background p-4 sm:p-6"
		>
			<H3>{source.title}</H3>
			<P className="break-words text-muted-foreground">
				{source.participants
					.map(
						(person) =>
							person.name || person.address || "Participant",
					)
					.join(" · ")}
			</P>
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
						<Button
							type="button"
							variant="outline"
							disabled={isLoading}
							onClick={() => setDraftMode("reply")}
						>
							Draft reply
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={isLoading}
							onClick={() => setDraftMode("forward")}
						>
							Draft forward
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
			<div className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-4">
				<P>{source.body || "No message text."}</P>
			</div>
			{source.sourceKind === "outlook" &&
				source.attachments.length > 0 && (
					<div className="mt-4">
						<H3>Attachments</H3>
						<MailAttachmentList
							key={source.nativeId}
							sourceUid={source.nativeId}
							attachments={source.attachments}
						/>
					</div>
				)}
			{draftMode && (
				<EmailDraftDialog
					key={`${identity}:${draftMode}`}
					isOpen
					mode={draftMode}
					sourceUid={source.nativeId}
					initialSubject={source.title}
					onOpenChange={(open) => {
						if (!open) setDraftMode(null);
					}}
				/>
			)}
		</section>
	);
}
