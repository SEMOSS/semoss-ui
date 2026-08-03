import {
	ChevronDown,
	ChevronRight,
	Clipboard,
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
		<section className="border-line border-b">
			<div className="flex items-center gap-2 px-2 py-1.5">
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
					<div className="font-semibold text-sm">
						Captured contexts
					</div>
					<div className="text-muted-foreground text-xs">
						Selected visible website text
					</div>
				</div>
				<Badge variant="secondary">{contexts.length}</Badge>
			</div>
			{open && (
				<div className="border-line border-t p-2">
					{contexts.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Choose Capture Context, then drag over website text.
						</p>
					) : (
						<Accordion type="multiple" className="space-y-2">
							{contexts.map((context, index) => {
								const isEditing = editingId === context.id;
								return (
									<AccordionItem
										key={context.id}
										value={context.id}
										className="rounded-md border px-3"
									>
										<AccordionTrigger className="py-3 hover:no-underline">
											<span className="min-w-0 text-left">
												<span className="block truncate font-semibold">
													{contextLabel(
														context,
														index,
													)}
												</span>
												<span className="block truncate text-muted-foreground text-xs">
													Step {context.throughStepId}{" "}
													· {context.url}
												</span>
											</span>
										</AccordionTrigger>
										<AccordionContent>
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
													<Badge
														variant="outline"
														className="border-warning text-warning"
													>
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
												<pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-canvas p-2 font-mono text-xs">
													{context.content}
												</pre>
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
															variant="ghost"
															className="text-destructive"
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
