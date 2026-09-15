import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";
import { toast } from "./sonner";
import { Spinner } from "./spinner";
import { Textarea } from "./textarea";

/** One selectable option in an AgentUserInputCard question. */
export interface AgentUserInputOption {
	/** Display label of the option. */
	label: string;
	/** Value submitted when the option is chosen. */
	value: string;
	/** Optional helper text shown under the label. */
	description?: string;
	/** True when the agent marked this option as recommended. */
	recommended?: boolean;
}

/** One question inside an AgentUserInputCard request. */
export interface AgentUserInputQuestion {
	/** Stable id the answer is keyed by. */
	id: string;
	/** Question text shown to the user. */
	question: string;
	/** Input control the question renders as. */
	type: "single_select" | "multi_select" | "text" | "confirm";
	/** Choices for select-type questions. */
	options?: AgentUserInputOption[];
	/** Whether a free-form "other" answer is allowed; defaults to true. */
	allowOther?: boolean;
}

/** The full structured request rendered as a form. */
export interface AgentUserInputRequest {
	/** Optional heading above the questions. */
	title?: string;
	/** The questions to render, in order. */
	questions: AgentUserInputQuestion[];
}

/** A single question's answer: text, selected values, or a confirmation. */
export type AgentUserInputAnswer = string | string[] | boolean;

// Sentinel answer submitted for questions the user explicitly skipped.
const SKIPPED_USER_INPUT_TEXT =
	"The user skipped this question and did not provide an answer.";

/** Small "Recommended" badge appended to a recommended option label. */
const RecommendedBadge = () => (
	<Badge variant="secondary" className="ml-1.5">
		Recommended
	</Badge>
);

export interface AgentUserInputCardProps {
	/** The parsed RequestUserInput request to render as a form. */
	request: AgentUserInputRequest;
	/** Called with the answers, keyed by question id, once validated. */
	onSubmit: (
		answers: Record<string, AgentUserInputAnswer>,
	) => Promise<void> | void;
	/** Disables the form while a submission is already in flight upstream. */
	disabled?: boolean;
}

/**
 * Platform-shared structured RequestUserInput form: text, confirm,
 * single-select, and multi-select questions with optional "Other" answers
 * and a per-question skip. Requires every question to be answered or explicitly
 * skipped before calling `onSubmit`. Any surface running an agent-harness tool
 * call (workbench chat, playground, etc.) can mount this directly once it has
 * parsed the tool call's arguments into an `AgentUserInputRequest`.
 */
export const AgentUserInputCard = ({
	request,
	onSubmit,
	disabled,
}: AgentUserInputCardProps) => {
	const [answers, setAnswers] = useState<
		Record<string, AgentUserInputAnswer>
	>({});
	const [otherValues, setOtherValues] = useState<Record<string, string>>({});
	const [skippedQuestions, setSkippedQuestions] = useState<
		Record<string, boolean>
	>({});
	const [submitting, setSubmitting] = useState(false);

	const updateAnswer = (questionId: string, value: AgentUserInputAnswer) => {
		setAnswers((current) => ({ ...current, [questionId]: value }));
		setSkippedQuestions((current) => ({ ...current, [questionId]: false }));
	};

	const toggleSkipped = (questionId: string) => {
		setSkippedQuestions((current) => ({
			...current,
			[questionId]: !current[questionId],
		}));
	};

	const submit = async () => {
		if (submitting || disabled) return;

		const normalized: Record<string, AgentUserInputAnswer> = {};
		const unansweredQuestions: string[] = [];
		for (const question of request.questions) {
			if (skippedQuestions[question.id]) {
				normalized[question.id] = SKIPPED_USER_INPUT_TEXT;
				continue;
			}
			const otherKey = `__other__:${question.id}`;
			let answer = answers[question.id];
			if (question.type === "single_select" && answer === otherKey) {
				answer = (otherValues[question.id] || "").trim();
			} else if (question.type === "multi_select") {
				const selected = Array.isArray(answer) ? answer : [];
				answer = selected.filter((value) => value !== otherKey);
				if (
					selected.includes(otherKey) &&
					otherValues[question.id]?.trim()
				) {
					answer = [...answer, otherValues[question.id].trim()];
				}
			}
			const missing =
				answer === undefined ||
				(typeof answer === "string" && !answer.trim()) ||
				(Array.isArray(answer) && answer.length === 0);
			if (missing) {
				unansweredQuestions.push(question.question);
				continue;
			}
			if (!missing && answer !== undefined) {
				normalized[question.id] = answer;
			}
		}

		if (unansweredQuestions.length > 0) {
			toast.error(
				`Please answer or skip: ${unansweredQuestions.map((question) => `"${question}"`).join(", ")}`,
			);
			return;
		}

		setSubmitting(true);
		try {
			await onSubmit(normalized);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to submit these answers.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="rounded-lg border border-border bg-card p-3">
			<p className="font-medium text-sm">
				{request.title?.trim() || "The assistant needs your input"}
			</p>
			<p className="mt-0.5 text-muted-foreground text-xs">
				Your answers will be returned to the assistant so it can
				continue.
			</p>

			<div className="mt-3 flex flex-col gap-4">
				{request.questions.map((question) => {
					const options = Array.isArray(question.options)
						? question.options
						: [];
					const allowOther = question.allowOther !== false;
					const otherKey = `__other__:${question.id}`;
					const current = answers[question.id];
					const selected = Array.isArray(current) ? current : [];
					const skipped = skippedQuestions[question.id] === true;
					const fieldDisabled = submitting || disabled || skipped;
					return (
						<div key={question.id} className="flex flex-col gap-2">
							<div className="flex items-start justify-between gap-3">
								<Label className="text-xs leading-5">
									{question.question}
								</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="shrink-0 text-muted-foreground"
									disabled={submitting || disabled}
									onClick={() => toggleSkipped(question.id)}
								>
									{skipped ? "Answer instead" : "Skip"}
								</Button>
							</div>

							{skipped ? (
								<div className="rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground text-xs">
									Skipped. The assistant will be told that you
									chose not to answer this question.
								</div>
							) : null}

							{question.type === "text" ? (
								<Textarea
									value={
										typeof current === "string"
											? current
											: ""
									}
									onChange={(event) =>
										updateAnswer(
											question.id,
											event.target.value,
										)
									}
									disabled={fieldDisabled}
									className="min-h-20 text-xs"
								/>
							) : null}

							{question.type === "confirm" ? (
								<Select
									value={
										typeof current === "boolean"
											? String(current)
											: undefined
									}
									onValueChange={(value) =>
										updateAnswer(
											question.id,
											value === "true",
										)
									}
									disabled={fieldDisabled}
								>
									<SelectTrigger
										className="w-full text-xs"
										size="sm"
									>
										<SelectValue placeholder="Choose yes or no" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="true">
											Yes
										</SelectItem>
										<SelectItem value="false">
											No
										</SelectItem>
									</SelectContent>
								</Select>
							) : null}

							{question.type === "single_select" ? (
								<>
									<Select
										value={
											typeof current === "string"
												? current
												: undefined
										}
										onValueChange={(value) =>
											updateAnswer(question.id, value)
										}
										disabled={fieldDisabled}
									>
										<SelectTrigger
											className="w-full text-xs"
											size="sm"
										>
											<SelectValue placeholder="Choose an option" />
										</SelectTrigger>
										<SelectContent>
											{options.map((option) => (
												<SelectItem
													key={option.value}
													value={option.value}
												>
													{option.label}
													{option.recommended ? (
														<RecommendedBadge />
													) : null}
												</SelectItem>
											))}
											{allowOther ? (
												<SelectItem value={otherKey}>
													Other
												</SelectItem>
											) : null}
										</SelectContent>
									</Select>
									{current === otherKey ? (
										<Input
											value={
												otherValues[question.id] || ""
											}
											onChange={(event) =>
												setOtherValues((values) => ({
													...values,
													[question.id]:
														event.target.value,
												}))
											}
											placeholder="Enter another answer"
											disabled={fieldDisabled}
											className="h-8 text-xs"
										/>
									) : null}
								</>
							) : null}

							{question.type === "multi_select" ? (
								<div className="flex flex-col gap-2 rounded-md border border-border p-2">
									{options.map((option) => (
										<label
											key={option.value}
											htmlFor={`${question.id}-${option.value}`}
											className="flex cursor-pointer items-start gap-2 text-xs"
										>
											<Checkbox
												id={`${question.id}-${option.value}`}
												checked={selected.includes(
													option.value,
												)}
												onCheckedChange={(checked) =>
													updateAnswer(
														question.id,
														checked
															? [
																	...selected,
																	option.value,
																]
															: selected.filter(
																	(value) =>
																		value !==
																		option.value,
																),
													)
												}
												disabled={fieldDisabled}
												className="mt-0.5"
											/>
											<span>
												<span className="font-medium">
													{option.label}
													{option.recommended ? (
														<RecommendedBadge />
													) : null}
												</span>
												{option.description ? (
													<span className="block text-muted-foreground text-xs">
														{option.description}
													</span>
												) : null}
											</span>
										</label>
									))}
									{allowOther ? (
										<div className="flex flex-col gap-1.5">
											<label
												htmlFor={`${question.id}-${otherKey}`}
												className="flex cursor-pointer items-center gap-2 text-xs"
											>
												<Checkbox
													id={`${question.id}-${otherKey}`}
													checked={selected.includes(
														otherKey,
													)}
													onCheckedChange={(
														checked,
													) =>
														updateAnswer(
															question.id,
															checked
																? [
																		...selected,
																		otherKey,
																	]
																: selected.filter(
																		(
																			value,
																		) =>
																			value !==
																			otherKey,
																	),
														)
													}
													disabled={fieldDisabled}
												/>
												Other
											</label>
											{selected.includes(otherKey) ? (
												<Input
													value={
														otherValues[
															question.id
														] || ""
													}
													onChange={(event) =>
														setOtherValues(
															(values) => ({
																...values,
																[question.id]:
																	event.target
																		.value,
															}),
														)
													}
													placeholder="Enter another answer"
													disabled={fieldDisabled}
													className="h-8 text-xs"
												/>
											) : null}
										</div>
									) : null}
								</div>
							) : null}
						</div>
					);
				})}
			</div>

			<div className="mt-3 flex justify-end">
				<Button
					type="button"
					size="sm"
					disabled={disabled || submitting}
					onClick={() => void submit()}
				>
					{submitting ? (
						<Spinner className="size-3.5" />
					) : (
						<CheckIcon className="size-3.5" />
					)}
					Submit answers
				</Button>
			</div>
		</div>
	);
};
