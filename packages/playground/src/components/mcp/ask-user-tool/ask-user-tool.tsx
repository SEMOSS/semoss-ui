/**
 * AskUserTool Component
 *
 * Overlay for the built-in askUser tool. The LLM sends a single question
 * with optional pre-defined options. Rendering is auto-detected:
 *
 * - options present → clickable buttons + freeform text fallback
 * - no options      → textarea for freeform input
 *
 * Per-tool answer drafts are preserved across dismiss/re-open cycles.
 */

import { CheckIcon, SendIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import { Button, Input, Textarea } from "@semoss/ui/next";
import type { RoomStore, ToolStore } from "@/stores";

interface AskUserToolProps {
	/** Room store for processing tool responses */
	room: RoomStore;

	/** Pending askUser tools. The first tool is rendered as active. */
	tools: ToolStore[];

	/** Callback when the overlay is dismissed */
	onClose: () => void;
}

interface AskUserParams {
	question?: string;
	options?: string[];
}

/** Draft answer for a single tool, persisted by tool ID */
interface ToolDraft {
	textValue: string;
	selectedOption: string;
}

const FALLBACK_QUESTION = "The assistant has a question for you.";

const EMPTY_DRAFT: ToolDraft = { textValue: "", selectedOption: "" };

export const AskUserTool: React.FC<AskUserToolProps> = observer(
	({ room, tools, onClose }) => {
		const baseId = useId();
		const pendingTools = tools && tools.length > 0 ? tools : [];
		const activeTool = pendingTools[0];

		const params = (activeTool?.parameters || {}) as Partial<AskUserParams>;
		const questionText =
			typeof params.question === "string" && params.question.trim()
				? params.question.trim()
				: FALLBACK_QUESTION;

		// Normalize options: trim, filter empties, dedupe
		const options = (() => {
			if (!Array.isArray(params.options)) return [];
			const seen = new Set<string>();
			const result: string[] = [];
			for (const raw of params.options) {
				const trimmed = typeof raw === "string" ? raw.trim() : "";
				if (trimmed && !seen.has(trimmed)) {
					seen.add(trimmed);
					result.push(trimmed);
				}
			}
			return result;
		})();
		const hasOptions = options.length > 0;

		// Per-tool draft state
		const [draftsByToolId, setDraftsByToolId] = useState<
			Record<string, ToolDraft>
		>({});
		const [isSubmitting, setIsSubmitting] = useState(false);

		const draft = activeTool
			? (draftsByToolId[activeTool.id] ?? EMPTY_DRAFT)
			: EMPTY_DRAFT;
		const { textValue, selectedOption } = draft;

		const messageId = activeTool?.toolCallMessage?.id;

		/** Update a single field in the active tool's draft */
		const updateDraft = (patch: Partial<ToolDraft>) => {
			if (!activeTool) return;
			setDraftsByToolId((prev) => ({
				...prev,
				[activeTool.id]: {
					...(prev[activeTool.id] ?? EMPTY_DRAFT),
					...patch,
				},
			}));
		};

		/** Resolve the final answer from the current draft */
		const resolveAnswer = (): string => {
			if (hasOptions) {
				// Custom text takes priority if non-empty
				if (textValue.trim()) return textValue.trim();
				return selectedOption;
			}
			return textValue.trim();
		};

		const canSubmit = !isSubmitting && !!resolveAnswer();

		const handleSubmit = async () => {
			const answer = resolveAnswer();
			if (!answer || isSubmitting || !messageId || !activeTool) return;

			setIsSubmitting(true);
			try {
				await room.processTool(
					messageId,
					activeTool.id,
					answer,
					"success",
					{ ...params, user_response: answer },
				);
			} catch (e) {
				console.error("askUser submit failed:", e);
			} finally {
				setIsSubmitting(false);
			}
		};

		/** Clicking an option selects it and clears custom text */
		const handleOptionClick = (value: string) => {
			if (!activeTool) return;

			// If not using options with freeform, submit immediately
			updateDraft({ selectedOption: value, textValue: "" });
			// Auto-submit when clicking an option (no need for extra step)
			if (!isSubmitting && messageId && activeTool) {
				setIsSubmitting(true);
				room.processTool(messageId, activeTool.id, value, "success", {
					...params,
					user_response: value,
				})
					.catch((e) => console.error("askUser submit failed:", e))
					.finally(() => setIsSubmitting(false));
			}
		};

		if (!activeTool) {
			return null;
		}

		return (
			<div className="flex max-h-96 flex-col rounded-xl border border-border bg-background shadow-lg">
				{/* Header */}
				<div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
					<span className="text-muted-foreground text-sm">
						Follow-up Question
					</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close"
					>
						<XIcon className="size-4" />
					</Button>
				</div>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto px-4">
					<p className="mb-3 font-medium text-base">{questionText}</p>

					{/* Options mode: clickable buttons + custom text input */}
					{hasOptions && (
						<>
							<div className="flex flex-wrap gap-2 py-2">
								{options.map((option) => (
									<Button
										key={`${baseId}-opt-${option}`}
										variant={
											selectedOption === option
												? "default"
												: "outline"
										}
										className={
											selectedOption === option
												? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
												: "bg-background"
										}
										onClick={() =>
											handleOptionClick(option)
										}
										disabled={isSubmitting}
									>
										{selectedOption === option && (
											<CheckIcon className="mr-1 size-3.5" />
										)}
										{option}
									</Button>
								))}
							</div>

							{/* Custom freeform input below options */}
							<div className="flex items-center gap-2 pt-2 pb-1">
								<Input
									id={`${baseId}-custom`}
									placeholder="Or type your own answer..."
									className="flex-1"
									value={textValue}
									onChange={(e) =>
										updateDraft({
											textValue: e.target.value,
											selectedOption: "",
										})
									}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" &&
											!e.shiftKey &&
											canSubmit
										) {
											e.preventDefault();
											handleSubmit();
										}
									}}
									disabled={isSubmitting}
								/>
								<Button
									size="icon-sm"
									onClick={handleSubmit}
									disabled={isSubmitting || !textValue.trim()}
									aria-label="Submit custom answer"
								>
									<SendIcon className="size-4" />
								</Button>
							</div>
						</>
					)}

					{/* Text mode: textarea with Enter to submit */}
					{!hasOptions && (
						<>
							<Textarea
								placeholder="Type your answer..."
								value={textValue}
								onChange={(e) =>
									updateDraft({
										textValue: e.target.value,
									})
								}
								className="min-h-20 resize-none"
								disabled={isSubmitting}
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										!e.shiftKey &&
										canSubmit
									) {
										e.preventDefault();
										handleSubmit();
									}
								}}
							/>
							<div className="pt-3 pb-1">
								<Button
									className="w-full"
									size="sm"
									onClick={handleSubmit}
									disabled={!canSubmit}
								>
									<SendIcon className="size-4" />
									{isSubmitting ? "Sending..." : "Submit"}
								</Button>
							</div>
						</>
					)}
				</div>
			</div>
		);
	},
);
