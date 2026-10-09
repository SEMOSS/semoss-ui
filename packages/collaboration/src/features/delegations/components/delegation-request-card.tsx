import { Inbox, Link2 } from "lucide-react";
import { MessageMarkdown } from "@/features/messages/components/message-markdown";
import type { DelegationRequest } from "@/features/messages/types/message";
import { FileChip } from "./file-chip";

/** The request a delegation room was made for, shown as the requester's ask. */
export function DelegationRequestCard({
	request,
}: {
	request: DelegationRequest;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-primary/30 bg-card">
			<header className="flex items-center gap-2.5 border-b bg-sidebar px-3 py-2">
				<Inbox
					aria-hidden="true"
					className="size-4 shrink-0 text-primary"
				/>
				<p className="min-w-0 flex-1 truncate text-sm">
					<span className="font-semibold">{request.requester}</span>{" "}
					<span className="text-muted-foreground">
						asked you for help
					</span>
				</p>
				{request.dueAt && (
					<span className="shrink-0 rounded-sm bg-warning/10 px-2 py-0.5 font-medium text-warning text-xs">
						Due {request.dueAt}
					</span>
				)}
			</header>
			<div className="flex flex-col gap-3 px-3 py-3 text-sm">
				<p className="wrap-break-word whitespace-pre-wrap font-semibold leading-6">
					{request.question}
				</p>
				{request.context && (
					<div>
						<p className="font-medium text-muted-foreground text-xs">
							Context
						</p>
						<MessageMarkdown
							text={request.context}
							isStreaming={false}
						/>
					</div>
				)}
				{request.responseFormat && (
					<div>
						<p className="font-medium text-muted-foreground text-xs">
							What they want back
						</p>
						<p className="wrap-break-word whitespace-pre-wrap leading-6">
							{request.responseFormat}
						</p>
					</div>
				)}
			</div>
			{request.files && request.files.length > 0 && (
				<div className="border-t px-3 py-2">
					<p className="mb-1.5 text-muted-foreground text-xs">
						Files (your own copies)
					</p>
					<ul
						aria-label="Files sent with the request"
						className="flex flex-wrap gap-2"
					>
						{request.files.map((file) => (
							<li key={file.path}>
								<FileChip file={file} />
							</li>
						))}
					</ul>
				</div>
			)}
			{request.links && request.links.length > 0 && (
				<div className="border-t px-3 py-2">
					<p className="mb-1.5 text-muted-foreground text-xs">
						Links (open at the source; access is controlled there)
					</p>
					<ul
						aria-label="Linked documents"
						className="flex flex-wrap gap-2"
					>
						{request.links.map((link) => (
							<li key={link.url}>
								<a
									href={link.url}
									target="_blank"
									rel="noreferrer"
									title={link.url}
									className="inline-flex max-w-64 items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-primary text-xs hover:bg-accent"
								>
									<Link2
										aria-hidden="true"
										className="size-3.5 shrink-0"
									/>
									<span className="truncate">
										{link.title || link.url}
									</span>
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
			<p className="border-t bg-sidebar px-3 py-2 text-muted-foreground text-xs">
				Work on it here with your agent. When you're ready, ask it to
				send your answer back to {request.requester}; you'll confirm
				exactly what goes.
			</p>
		</div>
	);
}
