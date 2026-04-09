/**
 * AskUserTool Component
 *
 * Unified overlay for MCP askUser tool interactions. Supports:
 * - Multiple pending questions (paged navigation with Next/Submit all buttons)
 * - Multiple input types (text, single_select, multi_select, yes_no, buttons)
 * - Multi-question sequences within a single tool
 * - Per-tool/per-question answer persistence across navigation
 *
 * When a single question is provided, all navigation UI is hidden automatically.
 */

import {
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	SendIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Checkbox,
	Input,
	RadioGroup,
	RadioGroupItem,
	Textarea,
} from "@semoss/ui/next";
import type { RoomStore, ToolStore } from "@/stores";

interface AskUserToolProps {
	/** Room store for processing tool responses */
	room: RoomStore;

	/** AskUser tools from the latest response. The first pending tool is used. */
	tools: ToolStore[];

	/** Callback when overlay is dismissed (X button clicked) */
	onClose: () => void;
}

type InputType =
	| "text"
	| "single_select"
	| "multi_select"
	| "yes_no"
	| "buttons";

interface AskUserParams {
	question?: string;
	questions?: Array<string | AskUserQuestionConfig>;
	input_type?: InputType;
	options?: string[];
	placeholder?: string;
}

interface AskUserQuestionConfig {
	question: string;
	input_type: InputType;
	options: string[];
	placeholder: string;
}

interface QuestionAnswerDraft {
	textValue: string;
	singleValue: string;
	multiValues: string[];
}

interface ToolAnswerDraft {
	questionDrafts: QuestionAnswerDraft[];
	currentQuestionIndex: number;
}

const EMPTY_QUESTION_DRAFT: QuestionAnswerDraft = {
	textValue: "",
	singleValue: "",
	multiValues: [],
};

const buildQuestionDrafts = (
	length: number,
	existing?: QuestionAnswerDraft[],
): QuestionAnswerDraft[] =>
	Array.from({ length }, (_, idx) => ({
		textValue: existing?.[idx]?.textValue ?? "",
		singleValue: existing?.[idx]?.singleValue ?? "",
		multiValues: existing?.[idx]?.multiValues ?? [],
	}));

export const AskUserTool: React.FC<AskUserToolProps> = observer(
	({ room, tools, onClose }) => {
		// Unique ID for input elements
		const baseId = useId();
		const pendingTools = tools && tools.length > 0 ? tools : [];

		const activeTool = pendingTools[0];

		// Extract parameters from current tool
		const params = (activeTool?.parameters || {}) as Partial<AskUserParams>;
		const questionConfigs: AskUserQuestionConfig[] = (() => {
			const rawQuestions = Array.isArray(params.questions)
				? params.questions
				: [];

			const normalized = rawQuestions
				.map((item) => {
					if (typeof item === "string") {
						const question = item.trim();
						if (!question) {
							return null;
						}

						return {
							question,
							input_type: params.input_type || "text",
							options: params.options || [],
							placeholder:
								params.placeholder || "Type your answer...",
						} satisfies AskUserQuestionConfig;
					}

					if (typeof item === "object" && item !== null) {
						const candidate =
							item as Partial<AskUserQuestionConfig>;
						const question =
							typeof candidate.question === "string"
								? candidate.question.trim()
								: "";
						if (!question) {
							return null;
						}

						return {
							question,
							input_type:
								candidate.input_type ||
								params.input_type ||
								"text",
							options: candidate.options || params.options || [],
							placeholder:
								candidate.placeholder ||
								params.placeholder ||
								"Type your answer...",
						} satisfies AskUserQuestionConfig;
					}

					return null;
				})
				.filter((item): item is AskUserQuestionConfig => item !== null);

			if (normalized.length > 0) {
				return normalized;
			}

			const fallbackQuestion =
				typeof params.question === "string"
					? params.question.trim()
					: "";

			return [
				{
					question:
						fallbackQuestion ||
						"The assistant has a question for you.",
					input_type: params.input_type || "text",
					options: params.options || [],
					placeholder: params.placeholder || "Type your answer...",
				},
			];
		})();
		const questions = questionConfigs.map((item) => item.question);
		const questionCounts = new Map<string, number>();
		const questionEntries = questions.map((question) => {
			const count = (questionCounts.get(question) || 0) + 1;
			questionCounts.set(question, count);

			return {
				key: `${baseId}-question-${question}-${count}`,
				question,
			};
		});

		// Unified answer draft store keyed by tool ID
		const [answersByToolId, setAnswersByToolId] = useState<
			Record<string, ToolAnswerDraft>
		>({});
		const [isQuestionMenuOpen, setIsQuestionMenuOpen] = useState(false);
		const [isSubmitting, setIsSubmitting] = useState(false);

		const isPagedQuestionFlow = questionConfigs.length > 1;
		const activeDraft = activeTool
			? answersByToolId[activeTool.id]
			: undefined;
		const currentQuestionIndex = Math.min(
			activeDraft?.currentQuestionIndex ?? 0,
			Math.max(questionConfigs.length - 1, 0),
		);
		const questionDrafts =
			activeDraft?.questionDrafts ??
			buildQuestionDrafts(questionConfigs.length);
		const currentQuestionDraft =
			questionDrafts[currentQuestionIndex] ?? EMPTY_QUESTION_DRAFT;
		const currentQuestionConfig =
			questionConfigs[currentQuestionIndex] ?? questionConfigs[0];
		const inputType: InputType =
			currentQuestionConfig?.input_type || "text";
		const options = currentQuestionConfig?.options || [];
		const placeholder =
			currentQuestionConfig?.placeholder || "Type your answer...";
		const textValue = currentQuestionDraft.textValue;
		const singleValue = currentQuestionDraft.singleValue;
		const multiValues = currentQuestionDraft.multiValues;
		const isLastPagedQuestionPage =
			isPagedQuestionFlow &&
			currentQuestionIndex === questionConfigs.length - 1;

		useEffect(() => {
			if (!activeTool) {
				return;
			}

			setAnswersByToolId((prev) => {
				const existing = prev[activeTool.id];
				const nextQuestionDrafts = buildQuestionDrafts(
					questionConfigs.length,
					existing?.questionDrafts,
				);
				const nextQuestionIndex = Math.min(
					existing?.currentQuestionIndex ?? 0,
					Math.max(questionConfigs.length - 1, 0),
				);

				if (
					existing &&
					existing.questionDrafts.length === questionConfigs.length &&
					existing.currentQuestionIndex === nextQuestionIndex
				) {
					return prev;
				}

				return {
					...prev,
					[activeTool.id]: {
						questionDrafts: nextQuestionDrafts,
						currentQuestionIndex: nextQuestionIndex,
					},
				};
			});
		}, [activeTool, questionConfigs.length]);

		useEffect(() => {
			if (!activeTool) {
				return;
			}

			setIsQuestionMenuOpen(false);
		}, [activeTool]);

		const messageId = activeTool?.toolCallMessage?.id;

		const resolveQuestionAnswer = (
			questionInputType: InputType,
			questionDraft?: QuestionAnswerDraft,
		): string => {
			if (questionInputType === "single_select") {
				return questionDraft?.singleValue ?? "";
			}

			if (
				questionInputType === "yes_no" ||
				questionInputType === "buttons"
			) {
				return questionDraft?.singleValue ?? "";
			}

			if (questionInputType === "multi_select") {
				return (questionDraft?.multiValues ?? []).join(", ");
			}

			return questionDraft?.textValue ?? "";
		};

		// Submit answer for a single tool (used when not in paged flow)
		const handleSubmit = async (answer: string) => {
			if (!answer.trim() || isSubmitting || !messageId || !activeTool)
				return;
			setIsSubmitting(true);

			try {
				await room.processTool(
					messageId,
					activeTool.id,
					answer,
					"success",
					{
						...params,
						user_response: answer,
					},
				);
			} catch (e) {
				console.error("askUser submit failed:", e);
			} finally {
				setIsSubmitting(false);
			}
		};

		const handleSubmitAllQuestionAnswers = async () => {
			if (isSubmitting || !activeTool || !messageId) return;

			setIsSubmitting(true);

			try {
				const answer = isPagedQuestionFlow
					? JSON.stringify(
							questionConfigs.map((item, idx) => ({
								question: item.question,
								answer: resolveQuestionAnswer(
									item.input_type || "text",
									questionDrafts[idx],
								),
							})),
						)
					: resolveQuestionAnswer(inputType, currentQuestionDraft);

				await room.processTool(
					messageId,
					activeTool.id,
					answer,
					"success",
					{
						...params,
						user_response: answer,
					},
				);
			} catch (e) {
				console.error("askUser submit failed:", e);
			} finally {
				setIsSubmitting(false);
			}
		};

		// Handle button clicks for yes_no and buttons input types
		// In paged flow: just save the selection and move to next
		// Not in paged flow: submit immediately
		const handleButtonClick = (value: string) => {
			if (!activeTool) return;

			if (isPagedQuestionFlow) {
				setAnswersByToolId((prev) => ({
					...prev,
					[activeTool.id]: {
						questionDrafts: questionDrafts.map((draft, idx) =>
							idx === currentQuestionIndex
								? { ...draft, singleValue: value }
								: draft,
						),
						currentQuestionIndex:
							prev[activeTool.id]?.currentQuestionIndex ?? 0,
					},
				}));
				return;
			}

			handleSubmit(value);
		};

		// Submit multi_select answers as comma-separated string
		const handleMultiSubmit = () => {
			if (multiValues.length === 0) return;
			handleSubmit(multiValues.join(", "));
		};

		// Toggle a multi_select option on/off
		const toggleMultiValue = (value: string) => {
			if (!activeTool) return;

			setAnswersByToolId((prev) => {
				const currentDraft = prev[activeTool.id];
				const currentValues =
					currentDraft?.questionDrafts?.[currentQuestionIndex]
						?.multiValues ?? [];
				const nextValues = currentValues.includes(value)
					? currentValues.filter((v) => v !== value)
					: [...currentValues, value];

				return {
					...prev,
					[activeTool.id]: {
						questionDrafts: questionDrafts.map((draft, idx) =>
							idx === currentQuestionIndex
								? { ...draft, multiValues: nextValues }
								: draft,
						),
						currentQuestionIndex:
							currentDraft?.currentQuestionIndex ?? 0,
					},
				};
			});
		};

		if (!activeTool) {
			return null;
		}

		return (
			<div className="flex max-h-96 flex-col rounded-xl border border-border bg-background shadow-lg">
				{/* Header: question navigation, optional question menu, close */}
				<div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
					<span className="text-muted-foreground text-sm">
						Follow-up Questions
					</span>
					<div className="relative flex items-center gap-1">
						{questionConfigs.length > 1 && (
							<>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() =>
										setAnswersByToolId((prev) => ({
											...prev,
											[activeTool.id]: {
												questionDrafts,
												currentQuestionIndex: Math.max(
													0,
													currentQuestionIndex - 1,
												),
											},
										}))
									}
									disabled={
										isSubmitting ||
										currentQuestionIndex === 0
									}
									aria-label="Previous question"
								>
									<ChevronLeftIcon className="size-4" />
								</Button>
								<span className="min-w-16 text-center text-muted-foreground text-xs">
									{currentQuestionIndex + 1}/
									{questionConfigs.length}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() =>
										setAnswersByToolId((prev) => ({
											...prev,
											[activeTool.id]: {
												questionDrafts,
												currentQuestionIndex: Math.min(
													questionConfigs.length - 1,
													currentQuestionIndex + 1,
												),
											},
										}))
									}
									disabled={
										isSubmitting ||
										currentQuestionIndex ===
											questionConfigs.length - 1
									}
									aria-label="Next question"
								>
									<ChevronRightIcon className="size-4" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										setIsQuestionMenuOpen((prev) => !prev)
									}
									disabled={isSubmitting}
									aria-expanded={isQuestionMenuOpen}
									aria-haspopup="menu"
								>
									Questions
								</Button>
							</>
						)}
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={onClose}
							aria-label="Close"
						>
							<XIcon className="size-4" />
						</Button>

						{isQuestionMenuOpen && questionConfigs.length > 1 && (
							<div className="absolute right-0 bottom-9 z-20 max-h-64 w-72 overflow-y-auto rounded-md border border-border bg-background p-2 shadow-lg">
								<div className="mb-1 px-1 text-muted-foreground text-xs">
									Jump to question
								</div>
								<div className="flex flex-col gap-1">
									{questionConfigs.map((item, idx) => {
										const label =
											item.question ||
											`Question ${idx + 1}`;
										const draft = questionDrafts[idx];
										const pendingInputType =
											item.input_type || "text";
										const isAnswered =
											pendingInputType === "multi_select"
												? (draft?.multiValues?.length ??
														0) > 0
												: pendingInputType ===
															"single_select" ||
														pendingInputType ===
															"yes_no" ||
														pendingInputType ===
															"buttons"
													? Boolean(
															draft?.singleValue,
														)
													: Boolean(
															draft?.textValue?.trim(),
														);

										return (
											<Button
												key={`${questionEntries[idx]?.key || baseId}-menu-item`}
												type="button"
												variant={
													idx === currentQuestionIndex
														? "default"
														: "ghost"
												}
												className={
													idx === currentQuestionIndex
														? "w-full justify-start"
														: isAnswered
															? "w-full justify-start text-primary"
															: "w-full justify-start"
												}
												onClick={() => {
													setAnswersByToolId(
														(prev) => ({
															...prev,
															[activeTool.id]: {
																questionDrafts,
																currentQuestionIndex:
																	idx,
															},
														}),
													);
													setIsQuestionMenuOpen(
														false,
													);
												}}
												disabled={isSubmitting}
											>
												{isAnswered &&
													idx !==
														currentQuestionIndex && (
														<CheckIcon className="mr-1.5 size-3.5 shrink-0 text-primary" />
													)}
												<span className="truncate text-left">
													{idx + 1}. {label}
												</span>
											</Button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Scrollable content area */}
				<div className="flex-1 overflow-y-auto px-4">
					{/* Question display */}
					<p className="mb-3 font-medium text-base">
						{questionEntries[currentQuestionIndex]?.question}
					</p>

					{/* Text input (single or multi-question) */}
					{inputType === "text" &&
						(isPagedQuestionFlow ? (
							<div className="flex flex-col gap-3">
								{/* Question progress indicator */}
								<p className="text-muted-foreground text-xs">
									Question {currentQuestionIndex + 1} of{" "}
									{questions.length}
								</p>

								{/* Multi-question textarea */}
								<Textarea
									placeholder={placeholder}
									value={
										questionDrafts[currentQuestionIndex]
											?.textValue || ""
									}
									onChange={(e) => {
										if (!activeTool) return;

										setAnswersByToolId((prev) => {
											const currentDraft =
												prev[activeTool.id];
											const nextQuestionDrafts =
												buildQuestionDrafts(
													questionConfigs.length,
													currentDraft?.questionDrafts,
												).map((draft, idx) =>
													idx === currentQuestionIndex
														? {
																...draft,
																textValue:
																	e.target
																		.value,
															}
														: draft,
												);

											return {
												...prev,
												[activeTool.id]: {
													questionDrafts:
														nextQuestionDrafts,
													currentQuestionIndex:
														currentDraft?.currentQuestionIndex ??
														0,
												},
											};
										});
									}}
									className="min-h-20 resize-none"
									disabled={isSubmitting}
								/>

								<div className="h-1" />
							</div>
						) : (
							/* Single-question textarea with keyboard submit support */
							<Textarea
								placeholder={placeholder}
								value={textValue}
								onChange={(e) => {
									if (!activeTool) return;

									setAnswersByToolId((prev) => ({
										...prev,
										[activeTool.id]: {
											questionDrafts: questionDrafts.map(
												(draft, idx) =>
													idx === currentQuestionIndex
														? {
																...draft,
																textValue:
																	e.target
																		.value,
															}
														: draft,
											),
											currentQuestionIndex:
												prev[activeTool.id]
													?.currentQuestionIndex ?? 0,
										},
									}));
								}}
								className="min-h-20 resize-none"
								disabled={isSubmitting}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										if (isPagedQuestionFlow) {
											if (isLastPagedQuestionPage) {
												handleSubmitAllQuestionAnswers();
											} else {
												setAnswersByToolId((prev) => ({
													...prev,
													[activeTool.id]: {
														questionDrafts,
														currentQuestionIndex:
															Math.min(
																questionConfigs.length -
																	1,
																currentQuestionIndex +
																	1,
															),
													},
												}));
											}
										} else {
											handleSubmit(textValue);
										}
									}
								}}
							/>
						))}

					{/* Single select (radio group with custom input option) */}
					{inputType === "single_select" && (
						<RadioGroup
							value={singleValue}
							onValueChange={(value) => {
								if (!activeTool) return;

								setAnswersByToolId((prev) => ({
									...prev,
									[activeTool.id]: {
										questionDrafts: questionDrafts.map(
											(draft, idx) =>
												idx === currentQuestionIndex
													? {
															...draft,
															singleValue: value,
														}
													: draft,
										),
										currentQuestionIndex:
											prev[activeTool.id]
												?.currentQuestionIndex ?? 0,
									},
								}));
							}}
						>
							{options.map((option, idx) => (
								<label
									key={option}
									htmlFor={`${baseId}-single-${idx}`}
									className={
										singleValue === option
											? "flex cursor-pointer items-center gap-3 border-primary/50 border-b bg-primary/10 py-3 last:border-b-0"
											: "flex cursor-pointer items-center gap-3 border-border border-b py-3 last:border-b-0"
									}
								>
									<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
										{idx + 1}
									</span>
									<span className="flex-1 text-sm">
										{option}
									</span>
									<RadioGroupItem
										id={`${baseId}-single-${idx}`}
										value={option}
										className="sr-only"
									/>
									{singleValue === option && (
										<CheckIcon className="size-4 text-primary" />
									)}
								</label>
							))}
							{/* Custom input option for single_select */}
							<label
								htmlFor={`${baseId}-single-custom`}
								className="flex cursor-pointer items-center gap-3 py-3"
							>
								<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
									✎
								</span>
								<Input
									id={`${baseId}-single-custom`}
									placeholder="Type your answer..."
									className="flex-1"
									value={
										singleValue &&
										!options.includes(singleValue)
											? singleValue
											: ""
									}
									onChange={(e) =>
										activeTool &&
										setAnswersByToolId((prev) => ({
											...prev,
											[activeTool.id]: {
												questionDrafts:
													questionDrafts.map(
														(draft, idx) =>
															idx ===
															currentQuestionIndex
																? {
																		...draft,
																		singleValue:
																			e
																				.target
																				.value,
																	}
																: draft,
													),
												currentQuestionIndex:
													prev[activeTool.id]
														?.currentQuestionIndex ??
													0,
											},
										}))
									}
									onFocus={() => {
										if (options.includes(singleValue)) {
											activeTool &&
												setAnswersByToolId((prev) => ({
													...prev,
													[activeTool.id]: {
														questionDrafts:
															questionDrafts.map(
																(draft, idx) =>
																	idx ===
																	currentQuestionIndex
																		? {
																				...draft,
																				singleValue:
																					"",
																			}
																		: draft,
															),
														currentQuestionIndex:
															prev[activeTool.id]
																?.currentQuestionIndex ??
															0,
													},
												}));
										}
									}}
								/>
							</label>
						</RadioGroup>
					)}

					{/* Multi select (checkboxes) */}
					{inputType === "multi_select" && (
						<div className="flex flex-col">
							{options.map((option, idx) => (
								<label
									key={option}
									htmlFor={`${baseId}-multi-${idx}`}
									className={
										multiValues.includes(option)
											? "flex cursor-pointer items-center gap-3 border-primary/50 border-b bg-primary/10 py-3 last:border-b-0"
											: "flex cursor-pointer items-center gap-3 border-border border-b py-3 last:border-b-0"
									}
								>
									<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
										{idx + 1}
									</span>
									<span className="flex-1 text-sm">
										{option}
									</span>
									<Checkbox
										id={`${baseId}-multi-${idx}`}
										checked={multiValues.includes(option)}
										onCheckedChange={() =>
											toggleMultiValue(option)
										}
									/>
								</label>
							))}
						</div>
					)}

					{/* Yes/No buttons */}
					{inputType === "yes_no" && (
						<div className="flex gap-3 py-2">
							<Button
								variant="outline"
								className={
									singleValue === "Yes"
										? "flex-1 border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
										: "flex-1 bg-background"
								}
								size="lg"
								onClick={() => handleButtonClick("Yes")}
								disabled={isSubmitting}
							>
								Yes
							</Button>
							<Button
								variant="outline"
								className={
									singleValue === "No"
										? "flex-1 border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
										: "flex-1 bg-background"
								}
								size="lg"
								onClick={() => handleButtonClick("No")}
								disabled={isSubmitting}
							>
								No
							</Button>
						</div>
					)}

					{/* Custom button options */}
					{inputType === "buttons" && (
						<div className="flex flex-wrap gap-2 py-2">
							{options.map((option) => (
								<Button
									key={option}
									variant={
										singleValue === option
											? "default"
											: "outline"
									}
									className={
										singleValue === option
											? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
											: "bg-background"
									}
									onClick={() => handleButtonClick(option)}
									disabled={isSubmitting}
								>
									{option}
								</Button>
							))}
						</div>
					)}

					{/* Submit button */}
					{(inputType === "text" ||
						inputType === "single_select" ||
						inputType === "multi_select" ||
						(inputType === "yes_no" && isPagedQuestionFlow) ||
						(inputType === "buttons" && isPagedQuestionFlow)) && (
						<div className="pt-3 pb-1">
							<Button
								className="w-full"
								size="sm"
								onClick={() => {
									if (inputType === "multi_select") {
										if (isPagedQuestionFlow) {
											if (isLastPagedQuestionPage) {
												handleSubmitAllQuestionAnswers();
											} else {
												setAnswersByToolId((prev) => ({
													...prev,
													[activeTool.id]: {
														questionDrafts,
														currentQuestionIndex:
															Math.min(
																questionConfigs.length -
																	1,
																currentQuestionIndex +
																	1,
															),
													},
												}));
											}
										} else {
											handleMultiSubmit();
										}
									} else if (inputType === "single_select") {
										if (isPagedQuestionFlow) {
											if (isLastPagedQuestionPage) {
												handleSubmitAllQuestionAnswers();
											} else {
												setAnswersByToolId((prev) => ({
													...prev,
													[activeTool.id]: {
														questionDrafts,
														currentQuestionIndex:
															Math.min(
																questionConfigs.length -
																	1,
																currentQuestionIndex +
																	1,
															),
													},
												}));
											}
										} else {
											handleSubmit(singleValue);
										}
									} else if (
										inputType === "yes_no" ||
										inputType === "buttons"
									) {
										if (isPagedQuestionFlow) {
											if (isLastPagedQuestionPage) {
												handleSubmitAllQuestionAnswers();
											} else {
												setAnswersByToolId((prev) => ({
													...prev,
													[activeTool.id]: {
														questionDrafts,
														currentQuestionIndex:
															Math.min(
																questionConfigs.length -
																	1,
																currentQuestionIndex +
																	1,
															),
													},
												}));
											}
										} else {
											handleSubmit(singleValue);
										}
									} else if (isPagedQuestionFlow) {
										if (isLastPagedQuestionPage) {
											handleSubmitAllQuestionAnswers();
										} else {
											setAnswersByToolId((prev) => ({
												...prev,
												[activeTool.id]: {
													questionDrafts,
													currentQuestionIndex:
														Math.min(
															questionConfigs.length -
																1,
															currentQuestionIndex +
																1,
														),
												},
											}));
										}
									} else {
										handleSubmit(textValue);
									}
								}}
								disabled={
									isSubmitting ||
									(inputType === "text" &&
										(isPagedQuestionFlow
											? false
											: isPagedQuestionFlow
												? false
												: !textValue.trim())) ||
									(inputType === "single_select" &&
										!isPagedQuestionFlow &&
										!singleValue) ||
									(inputType === "multi_select" &&
										!isPagedQuestionFlow &&
										multiValues.length === 0) ||
									((inputType === "yes_no" ||
										inputType === "buttons") &&
										!isPagedQuestionFlow &&
										!singleValue)
								}
							>
								<SendIcon className="size-4" />
								{isSubmitting
									? "Sending..."
									: isPagedQuestionFlow &&
											!isLastPagedQuestionPage
										? "Next"
										: isPagedQuestionFlow
											? "Submit all"
											: "Submit"}
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	},
);
