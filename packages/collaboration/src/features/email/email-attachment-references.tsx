import { FileText, Paperclip } from "lucide-react";
import { P, Small } from "@semoss/ui/next";

/** Display-only attachments without a downloadable native attachment identity. */
export function EmailAttachmentReferences({
	attachments,
	provider = "Outlook",
}: {
	attachments: { name: string }[];
	provider?: string;
}) {
	if (!attachments.length) return null;
	return (
		<section
			aria-label="Attachments"
			className="space-y-3 border-border border-t pt-4"
		>
			<Small className="flex items-center gap-2 font-medium">
				<Paperclip className="size-4" aria-hidden="true" />
				Attachments · {attachments.length}
			</Small>
			<ul className="grid min-w-0 gap-2">
				{attachments.map((attachment, index) => (
					<li
						key={`${index}:${attachment.name}`}
						className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
					>
						<FileText
							className="size-5 shrink-0 text-muted-foreground"
							aria-hidden="true"
						/>
						<P className="min-w-0 break-words text-sm">
							{attachment.name}
							<span className="text-muted-foreground">
								{" "}
								— open in {provider}
							</span>
						</P>
					</li>
				))}
			</ul>
		</section>
	);
}
