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
import { useEffect, useId, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	Checkbox,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Textarea,
} from "@semoss/ui/next";
import {
	type ContextReturnPlan,
	type ContextReturnPlanItem,
	estimateTokens,
	RETURN_BUDGET_MIN_CHARS,
	RETURN_BUDGET_STEP_CHARS,
	returnBudgetOptions,
} from "../domain/selected-text";
import type {
	RemoteBrowserContextLimits,
	SelectedTextContext,
} from "../types/browserEvents";

interface SelectedTextContextsPanelProps {
	open: boolean;
	contexts: SelectedTextContext[];
	limits: RemoteBrowserContextLimits;
	returnPlan: ContextReturnPlan;
	returnBudgetChars: number;
	includedContextIds: ReadonlySet<string>;
	onToggle: () => void;
	onCopy: (context: SelectedTextContext) => void;
	onDelete: (contextId: string) => void;
	onSave: (contextId: string, content: string) => void;
	onToggleIncluded: (contextId: string, include: boolean) => void;
	onReturnBudgetChange: (chars: number) => void;
}

function contextLabel(context: SelectedTextContext, index: number): string {
	if (context.label?.trim()) return context.label;
	if (context.title?.trim())
		return `${context.title} · ${context.kind === "full-page-text" ? "Full page" : "Selection"} ${index + 1}`;
	return `${context.kind === "full-page-text" ? "Full page text" : "Selected text"} ${index + 1}`;
}

function dispositionBadge(item: ContextReturnPlanItem | undefined): {
	label: string;
	className: string;
} {
	switch (item?.disposition) {
		case "partially-included":
			return {
				label: `Partially included: ${item.returnedChars.toLocaleString()} of ${item.capturedChars.toLocaleString()} chars`,
				className: "border-warning text-warning",
			};
		case "excluded-by-budget":
			return {
				label: "Not included: return limit",
				className: "border-warning text-warning",
			};
		case "excluded-by-user":
			return {
				label: "Not included: user choice",
				className: "text-muted-foreground",
			};
		default:
			return { label: "Included", className: "" };
	}
}

function captureTruncationMessage(context: SelectedTextContext): string | null {
	if (!context.stats.truncated) return null;
	const {
		originalCharacterCount,
		includedCharacterCount,
		omittedCharacterCount,
	} = context.stats;
	if (
		typeof originalCharacterCount === "number" &&
		typeof includedCharacterCount === "number" &&
		typeof omittedCharacterCount === "number"
	) {
		return `Capture truncated: retained ${includedCharacterCount.toLocaleString()} of ${originalCharacterCount.toLocaleString()} source characters; ${omittedCharacterCount.toLocaleString()} omitted.`;
	}
	return "Capture truncated by the browser context limit.";
}

export const SelectedTextContextsPanel: React.FC<
	SelectedTextContextsPanelProps
> = ({
	open,
	contexts,
	limits,
	returnPlan,
	returnBudgetChars,
	includedContextIds,
	onToggle,
	onCopy,
	onDelete,
	onSave,
	onToggleIncluded,
	onReturnBudgetChange,
}) => {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const panelId = useId();
	const budgetOptions = returnBudgetOptions(limits);
	const [customBudget, setCustomBudget] = useState(
		() =>
			!budgetOptions.some((option) => option.chars === returnBudgetChars),
	);
	// Tracks the slider while dragging so the readout stays live before commit.
	const [budgetDraft, setBudgetDraft] = useState(returnBudgetChars);
	useEffect(() => {
		setBudgetDraft(returnBudgetChars);
	}, [returnBudgetChars]);
	useEffect(() => {
		if (
			editingId &&
			!contexts.some((context) => context.id === editingId)
		) {
			setEditingId(null);
			setDraft("");
		}
	}, [contexts, editingId]);
	const summary = returnPlan.summary;
	const planById = new Map(
		returnPlan.items.map((item) => [item.contextId, item]),
	);
	return (
		<section className="border-line border-b bg-surface-raised/30">
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
					<div className="flex items-center gap-1.5 font-semibold text-sm">
						<FileText className="size-3.5 text-accent" />
						Captured contexts
					</div>
					<div className="text-muted-foreground text-xs">
						{contexts.length === 0
							? "Selected visible website text"
							: `${summary.capturedContextCount} contexts captured · ${summary.returnedChars.toLocaleString()} / ${summary.limitChars.toLocaleString()} characters selected for Playground`}
					</div>
					{contexts.length > 0 && (
						<div className="text-muted-foreground text-xs">
							approximately{" "}
							{estimateTokens(
								summary.returnedChars,
							).toLocaleString()}{" "}
							tokens (estimate)
						</div>
					)}
				</div>
				<Badge variant="secondary">{contexts.length}</Badge>
			</div>
			{open && (
				<div className="border-line border-t bg-canvas/40 p-2.5">
					{contexts.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Choose Capture Context, then drag over website text.
						</p>
					) : (
						<>
							<div className="mb-2.5 space-y-1.5">
								<Label
									htmlFor={`${panelId}-budget`}
									className="text-xs"
								>
									Playground return budget
								</Label>
								<Select
									value={
										customBudget
											? "custom"
											: String(returnBudgetChars)
									}
									onValueChange={(value) => {
										if (value === "custom") {
											setCustomBudget(true);
											return;
										}
										setCustomBudget(false);
										onReturnBudgetChange(Number(value));
									}}
								>
									<SelectTrigger
										id={`${panelId}-budget`}
										size="sm"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{budgetOptions.map((option) => (
											<SelectItem
												key={option.chars}
												value={String(option.chars)}
											>
												{option.label} —{" "}
												{Math.round(
													option.chars / 1000,
												)}
												k
											</SelectItem>
										))}
										<SelectItem value="custom">
											Custom
										</SelectItem>
									</SelectContent>
								</Select>
								{customBudget && (
									<div className="space-y-1.5 pt-0.5">
										<Slider
											aria-label="Custom Playground return budget"
											value={[budgetDraft]}
											min={RETURN_BUDGET_MIN_CHARS}
											max={
												limits.maximumReturnBudgetChars
											}
											step={RETURN_BUDGET_STEP_CHARS}
											onValueChange={([value]) =>
												setBudgetDraft(value)
											}
											onValueCommit={([value]) =>
												onReturnBudgetChange(value)
											}
										/>
										<p className="text-muted-foreground text-xs">
											{budgetDraft.toLocaleString()}{" "}
											characters · approximately{" "}
											{estimateTokens(
												budgetDraft,
											).toLocaleString()}{" "}
											tokens (estimate)
										</p>
									</div>
								)}
								{summary.truncated && (
									<p className="text-warning text-xs">
										{summary.omittedChars.toLocaleString()}{" "}
										selected characters exceed the return
										budget and will not be sent. Raise the
										budget or deselect a context.
									</p>
								)}
							</div>
							<Accordion type="multiple" className="space-y-2.5">
								{contexts.map((context, index) => {
									const isEditing = editingId === context.id;
									const planItem = planById.get(context.id);
									const badge = dispositionBadge(planItem);
									const truncationMessage =
										captureTruncationMessage(context);
									return (
										<AccordionItem
											key={context.id}
											value={context.id}
											className="overflow-hidden rounded-lg border border-accent/20 bg-surface shadow-sm"
										>
											<AccordionTrigger className="border-accent border-l-2 px-3 py-3 hover:bg-accent/5 hover:no-underline">
												<span className="min-w-0 flex-1 text-left">
													<span className="block truncate font-semibold">
														{contextLabel(
															context,
															index,
														)}
													</span>
													<span className="mt-1 flex items-center gap-1 truncate text-muted-foreground text-xs">
														<Globe2 className="size-3 shrink-0" />
														<span className="truncate">
															{context.url}
														</span>
													</span>
												</span>
											</AccordionTrigger>
											<AccordionContent className="border-line border-t px-3 pt-3 pb-3">
												<div className="mb-2 flex flex-wrap gap-1">
													<Badge>
														{context.kind ===
														"full-page-text"
															? "Full page"
															: "Selected text"}
													</Badge>
													<Badge variant="secondary">
														{context.extractionMethod ===
														"dom-native-selection"
															? "Browser selection"
															: context.extractionMethod ===
																	"dom-range"
																? "Exact range"
																: context.extractionMethod ===
																		"full-page-dom"
																	? "Auto-scrolled DOM"
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
													<Badge
														variant="outline"
														className={
															badge.className
														}
													>
														{badge.label}
													</Badge>
													{context.stats
														.truncated && (
														<Badge
															variant="outline"
															className="border-warning text-warning"
														>
															Truncated
														</Badge>
													)}
												</div>
												<div className="mb-2 flex items-center gap-2">
													<Checkbox
														id={`${panelId}-include-${context.id}`}
														checked={includedContextIds.has(
															context.id,
														)}
														onCheckedChange={(
															checked,
														) =>
															onToggleIncluded(
																context.id,
																checked ===
																	true,
															)
														}
													/>
													<Label
														htmlFor={`${panelId}-include-${context.id}`}
														className="text-xs"
													>
														Include in Playground
														result
													</Label>
												</div>
												{truncationMessage && (
													<p className="mb-2 text-warning text-xs">
														{truncationMessage}
													</p>
												)}
												{context.stats
													.scrollLimitReached && (
													<p className="mb-2 text-warning text-xs">
														Page capture stopped
														after the configured
														scroll limit; some page
														content may be missing.
													</p>
												)}
												{isEditing ? (
													<Textarea
														value={draft}
														onChange={(event) =>
															setDraft(
																event.target
																	.value,
															)
														}
														rows={8}
														aria-label="Selected website text"
													/>
												) : (
													<div className="rounded-md border border-line bg-canvas shadow-black/10 shadow-inner">
														<div className="border-line border-b px-2.5 py-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
															Extracted website
															text
														</div>
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
																	setDraft(
																		"",
																	);
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
																	setDraft(
																		"",
																	);
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
																	onCopy(
																		context,
																	)
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
						</>
					)}
				</div>
			)}
		</section>
	);
};
