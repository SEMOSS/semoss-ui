import {
	ChevronDown,
	ChevronRight,
	Clipboard,
	FileText,
	Globe2,
	Pencil,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	Muted,
	Small,
	Textarea,
} from "@semoss/ui/next";
import type { SelectedTextContext } from "../types/browserEvents";

interface SelectedTextContextsPanelProps {
	open: boolean;
	contexts: SelectedTextContext[];
	onToggle: () => void;
	onCopy: (context: SelectedTextContext) => void;
	onDelete: (contextId: string) => void;
	onSave: (contextId: string, content: string) => void;
}
function contextLabel(context: SelectedTextContext, index: number): string {
	if (context.label?.trim()) return context.label;
	if (context.title?.trim())
		return `${context.title} · Selection ${index + 1}`;
	return `Selected text ${index + 1}`;
}

export const SelectedTextContextsPanel: React.FC<
	SelectedTextContextsPanelProps
> = ({ open, contexts, onToggle, onCopy, onDelete, onSave }) => {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	useEffect(() => {
		if (
			editingId &&
			!contexts.some((context) => context.id === editingId)
		) {
			setEditingId(null);
			setDraft("");
		}
	}, [contexts, editingId]);
	return (
		<section className="border-border border-b bg-muted">
			<div className="flex items-center gap-2 px-2 py-2">
				<Button
					size="icon-sm"
					variant="ghost"
					disabled={contexts.length === 0}
					onClick={onToggle}
					aria-label={
						open
							? "Collapse captured contexts"
							: "Expand captured contexts"
					}
				>
					{open ? <ChevronDown /> : <ChevronRight />}
				</Button>
				<div className="min-w-0 flex-1">
					<Small className="flex items-center gap-1.5">
						<FileText className="size-3.5 text-primary" />
						Captured contexts
					</Small>
					<Muted className="block text-xs">
						Selected visible website text
					</Muted>
				</div>
				<Badge variant="secondary">{contexts.length}</Badge>
			</div>
			{open && (
				<div className="border-border border-t bg-background p-2.5">
					{contexts.length === 0 ? (
						<Muted>
							Choose Capture Context, then drag over website text.
						</Muted>
					) : (
						<Accordion type="multiple" className="space-y-2.5">
							{contexts.map((context, index) => {
								const isEditing = editingId === context.id;
								return (
									<AccordionItem
										key={context.id}
										value={context.id}
										className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
									>
										<AccordionTrigger className="border-primary border-l-2 px-3 py-3 hover:bg-accent hover:no-underline">
											<div className="min-w-0 flex-1 text-left">
												<Muted className="block truncate text-foreground">
													{contextLabel(
														context,
														index,
													)}
												</Muted>
												<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
													<Globe2 className="size-3 shrink-0" />
													<Muted className="truncate text-xs">
														{context.url}
													</Muted>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="border-border border-t px-3 pt-3 pb-3">
											<div className="mb-2 flex flex-wrap gap-1">
												<Badge>Selected text</Badge>
												<Badge variant="secondary">
													{context.extractionMethod ===
													"dom-range"
														? "Exact range"
														: "Area text"}
												</Badge>
												<Badge variant="outline">
													{context.content.length}{" "}
													chars
												</Badge>
												{context.edited && (
													<Badge variant="outline">
														Edited
													</Badge>
												)}
												{context.stats.truncated && (
													<Badge variant="destructive">
														Bounded
													</Badge>
												)}
											</div>
											{isEditing ? (
												<Textarea
													value={draft}
													onChange={(event) =>
														setDraft(
															event.target.value,
														)
													}
													rows={8}
													aria-label="Selected website text"
												/>
											) : (
												<div className="rounded-md border border-border bg-background shadow-inner">
													<Muted className="block border-border border-b px-2.5 py-1.5 text-xs uppercase tracking-wide">
														Extracted website text
													</Muted>
													<pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words p-3 font-sans text-sm leading-6">
														{context.content}
													</pre>
												</div>
											)}
											<div className="mt-2 flex gap-1">
												{isEditing ? (
													<>
														<Button
															size="sm"
															disabled={
																!draft.trim()
															}
															onClick={() => {
																onSave(
																	context.id,
																	draft.trim(),
																);
																setEditingId(
																	null,
																);
																setDraft("");
															}}
														>
															Save
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setEditingId(
																	null,
																);
																setDraft("");
															}}
														>
															Cancel
														</Button>
													</>
												) : (
													<>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => {
																setEditingId(
																	context.id,
																);
																setDraft(
																	context.content,
																);
															}}
														>
															<Pencil />
															Edit
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																onCopy(context)
															}
														>
															<Clipboard />
															Copy
														</Button>
														<Button
															size="sm"
															variant="destructive"
															onClick={() =>
																onDelete(
																	context.id,
																)
															}
														>
															<Trash2 />
															Delete
														</Button>
													</>
												)}
											</div>
										</AccordionContent>
									</AccordionItem>
								);
							})}
						</Accordion>
					)}
				</div>
			)}
		</section>
	);
};
