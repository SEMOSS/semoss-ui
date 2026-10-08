import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { AutomationJevQuestion } from "../../../domain/automation-workflow.types";

interface JevQuestionEditorProps {
	question: AutomationJevQuestion;
	index: number;
	questionCount: number;
	onChange: (question: AutomationJevQuestion) => void;
	onRemove: () => void;
	readOnly: boolean;
}

/** Edits one named Choice, Score, or Noul question in a JEV request. */
export function JevQuestionEditor({
	question,
	index,
	questionCount,
	onChange,
	onRemove,
	readOnly,
}: JevQuestionEditorProps) {
	const [open, setOpen] = useState(index === 0);
	const prefix = `jev-question-${index}`;
	const choiceEntries =
		question.type === "choice" &&
		question.criteria &&
		!Array.isArray(question.criteria)
			? Object.entries(question.criteria)
			: [];
	const scoreLevels =
		question.type === "score" && Array.isArray(question.criteria)
			? question.criteria
			: [];
	const noulCriteria =
		question.type === "noul" &&
		question.criteria &&
		!Array.isArray(question.criteria)
			? question.criteria
			: { true: "Yes", false: "No" };

	const handleTypeChange = (type: AutomationJevQuestion["type"]): void => {
		onChange({
			...question,
			type,
			...(type === "choice"
				? { criteria: { option_1: "" } }
				: type === "score"
					? { criteria: ["Low", "High"] }
					: { criteria: { true: "Yes", false: "No" } }),
		});
	};
	const nextChoiceKey = (): string => {
		const keys = new Set(choiceEntries.map(([key]) => key));
		let index = keys.size + 1;
		while (keys.has(`option_${index}`)) index += 1;
		return `option_${index}`;
	};

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="rounded-lg border bg-card p-3"
		>
			<div className="flex items-center justify-between gap-2">
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						className="h-auto min-w-0 flex-1 justify-start gap-2 p-0 text-left hover:bg-transparent"
					>
						<ChevronDown
							className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
							aria-hidden="true"
						/>
						<span className="min-w-0">
							<span className="block truncate font-medium text-sm">
								{question.key || `Question ${index + 1}`}
							</span>
							<span className="block text-muted-foreground text-xs capitalize">
								{question.type === "noul"
									? "Yes / no"
									: question.type}
							</span>
						</span>
					</Button>
				</CollapsibleTrigger>
				{!readOnly && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8 text-muted-foreground hover:text-destructive"
						disabled={questionCount === 1}
						onClick={onRemove}
						aria-label={`Remove question ${index + 1}`}
					>
						<Trash2 className="size-4" aria-hidden="true" />
					</Button>
				)}
			</div>
			<CollapsibleContent className="flex flex-col gap-3 pt-3">
				<div className="grid gap-3">
					<Field>
						<FieldLabel htmlFor={`${prefix}-key`}>
							Response key
						</FieldLabel>
						<Input
							id={`${prefix}-key`}
							value={question.key}
							onChange={(event) =>
								onChange({
									...question,
									key: event.target.value,
								})
							}
							placeholder="department"
							readOnly={readOnly}
							aria-required="true"
						/>
						<FieldDescription>
							Use letters, numbers, and underscores.
						</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor={`${prefix}-type`}>
							Answer type
						</FieldLabel>
						<Select
							value={question.type}
							onValueChange={(value) =>
								handleTypeChange(
									value as AutomationJevQuestion["type"],
								)
							}
							disabled={readOnly}
						>
							<SelectTrigger
								id={`${prefix}-type`}
								className="w-full"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="choice">Choice</SelectItem>
								<SelectItem value="score">Score</SelectItem>
								<SelectItem value="noul">Yes / no</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</div>
				<Field>
					<FieldLabel htmlFor={`${prefix}-instructions`}>
						Instructions
					</FieldLabel>
					<Textarea
						id={`${prefix}-instructions`}
						value={question.instructions}
						onChange={(event) =>
							onChange({
								...question,
								instructions: event.target.value,
							})
						}
						placeholder="What should JEV decide?"
						readOnly={readOnly}
						aria-required="true"
						rows={3}
					/>
				</Field>
				{question.type === "choice" && (
					<div className="flex flex-col gap-2">
						<div>
							<p className="font-medium text-sm">Choices</p>
							<p className="text-muted-foreground text-xs">
								Give each possible answer a stable key and
								description.
							</p>
						</div>
						{choiceEntries.map(
							([key, description], choiceIndex) => (
								<div
									// Choices cannot be reordered; the index keeps focus while its editable key changes.
									// biome-ignore lint/suspicious/noArrayIndexKey: stable authoring identity
									key={choiceIndex}
									className="flex items-start gap-2 rounded-md border bg-muted/20 p-2"
								>
									<div className="flex min-w-0 flex-1 flex-col gap-2">
										<Input
											value={key}
											onChange={(event) => {
												const next = Object.fromEntries(
													choiceEntries.map(
														(
															[
																candidateKey,
																candidateDescription,
															],
															index,
														) =>
															index ===
															choiceIndex
																? [
																		event
																			.target
																			.value,
																		description,
																	]
																: [
																		candidateKey,
																		candidateDescription,
																	],
													),
												);
												onChange({
													...question,
													criteria: next,
												});
											}}
											placeholder="billing"
											aria-label={`Choice ${choiceIndex + 1} key`}
											readOnly={readOnly}
										/>
										<Input
											value={description}
											onChange={(event) =>
												onChange({
													...question,
													criteria: {
														...Object.fromEntries(
															choiceEntries,
														),
														[key]: event.target
															.value,
													},
												})
											}
											placeholder="Payments and refunds"
											aria-label={`Choice ${choiceIndex + 1} description`}
											readOnly={readOnly}
										/>
									</div>
									{!readOnly && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-9 text-muted-foreground hover:text-destructive"
											disabled={
												choiceEntries.length === 1
											}
											onClick={() => {
												const next =
													Object.fromEntries(
														choiceEntries,
													);
												delete next[key];
												onChange({
													...question,
													criteria: next,
												});
											}}
											aria-label={`Remove choice ${choiceIndex + 1}`}
										>
											<Trash2
												className="size-4"
												aria-hidden="true"
											/>
										</Button>
									)}
								</div>
							),
						)}
						{!readOnly && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									onChange({
										...question,
										criteria: {
											...Object.fromEntries(
												choiceEntries,
											),
											[nextChoiceKey()]: "",
										},
									})
								}
							>
								<Plus className="size-4" aria-hidden="true" />
								Add choice
							</Button>
						)}
					</div>
				)}
				{question.type === "score" && (
					<Field>
						<FieldLabel htmlFor={`${prefix}-rubric`}>
							Score rubric
						</FieldLabel>
						<Textarea
							id={`${prefix}-rubric`}
							value={scoreLevels.join("\n")}
							onChange={(event) =>
								onChange({
									...question,
									criteria: event.target.value.split("\n"),
								})
							}
							placeholder={"Low\nMedium\nHigh"}
							readOnly={readOnly}
							rows={3}
						/>
						<FieldDescription>
							Lowest to highest, one level per line.
						</FieldDescription>
					</Field>
				)}
				{question.type === "noul" && (
					<div className="flex flex-col gap-2">
						<div>
							<p className="font-medium text-sm">
								Yes / No meaning
							</p>
							<p className="text-muted-foreground text-xs">
								Clarify both outcomes. JEV returns the
								probability of Yes.
							</p>
						</div>
						<div className="grid gap-2">
							<Input
								value={noulCriteria.true ?? ""}
								onChange={(event) =>
									onChange({
										...question,
										criteria: {
											...noulCriteria,
											true: event.target.value,
										},
									})
								}
								placeholder="Yes means..."
								aria-label="Yes outcome description"
								readOnly={readOnly}
							/>
							<Input
								value={noulCriteria.false ?? ""}
								onChange={(event) =>
									onChange({
										...question,
										criteria: {
											...noulCriteria,
											false: event.target.value,
										},
									})
								}
								placeholder="No means..."
								aria-label="No outcome description"
								readOnly={readOnly}
							/>
						</div>
					</div>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
