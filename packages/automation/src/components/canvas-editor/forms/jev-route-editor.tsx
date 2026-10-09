import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
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
} from "@semoss/ui/next";
import type {
	AutomationJevQuestion,
	AutomationJevRoute,
	AutomationJevRouteCondition,
	AutomationJevRouteField,
	AutomationJevRouteOperator,
} from "../../../domain/automation-workflow.types";

interface JevRouteEditorProps {
	route: AutomationJevRoute;
	questions: AutomationJevQuestion[];
	index: number;
	routeCount: number;
	onChange: (route: AutomationJevRoute) => void;
	onMove: (direction: -1 | 1) => void;
	onRemove: () => void;
	readOnly: boolean;
}

const SELECT_TRIGGER_CLASS_NAME =
	"w-full min-w-0 [&>[data-slot=select-value]]:block [&>[data-slot=select-value]]:min-w-0 [&>[data-slot=select-value]]:truncate";

const SELECT_CONTENT_CLASS_NAME =
	"w-(--radix-select-trigger-width) min-w-0 max-w-(--radix-select-trigger-width) [&_[data-slot=select-item]>span:last-child]:block [&_[data-slot=select-item]>span:last-child]:min-w-0 [&_[data-slot=select-item]>span:last-child]:truncate";

const NUMERIC_OPERATORS: Array<{
	value: AutomationJevRouteOperator;
	label: string;
}> = [
	{ value: "greaterThanOrEqual", label: "is at least" },
	{ value: "greaterThan", label: "is greater than" },
	{ value: "lessThanOrEqual", label: "is at most" },
	{ value: "lessThan", label: "is less than" },
	{ value: "equals", label: "equals" },
	{ value: "notEquals", label: "does not equal" },
];

const TEXT_OPERATORS: Array<{
	value: AutomationJevRouteOperator;
	label: string;
}> = [
	{ value: "equals", label: "equals" },
	{ value: "notEquals", label: "does not equal" },
];

function fieldsForQuestion(
	question: AutomationJevQuestion,
): Array<{ value: AutomationJevRouteField; label: string }> {
	if (question.type === "choice") {
		return [
			{ value: "choice", label: "Selected choice" },
			{ value: "confidence", label: "Answer confidence" },
			{ value: "probability", label: "Choice probability" },
		];
	}
	if (question.type === "score") {
		return [
			{ value: "score", label: "Score" },
			{ value: "confidence", label: "Answer confidence" },
			{ value: "probability", label: "Rubric probability" },
		];
	}
	return [{ value: "noul", label: "Probability of Yes" }];
}

function optionsForQuestion(
	question: AutomationJevQuestion,
): Array<{ value: string; label: string }> {
	if (question.type === "choice") {
		return question.criteria && !Array.isArray(question.criteria)
			? Object.entries(question.criteria)
					.filter(([value]) => value.trim() !== "")
					.map(([value, label]) => ({
						value,
						label: label ? `${value} — ${label}` : value,
					}))
			: [];
	}
	if (question.type === "score" && Array.isArray(question.criteria)) {
		return question.criteria.map((label, index) => ({
			value: String(index),
			label: `${index} — ${label}`,
		}));
	}
	return [];
}

function defaultCondition(
	question: AutomationJevQuestion,
): AutomationJevRouteCondition {
	if (question.type === "choice") {
		const firstChoice = optionsForQuestion(question)[0]?.value ?? "";
		return {
			questionKey: question.key,
			field: "choice",
			operator: "equals",
			value: firstChoice,
		};
	}
	if (question.type === "score") {
		return {
			questionKey: question.key,
			field: "score",
			operator: "greaterThanOrEqual",
			value: 0.5,
		};
	}
	return {
		questionKey: question.key,
		field: "noul",
		operator: "greaterThanOrEqual",
		value: 0.5,
	};
}

function normalizeCondition(
	condition: AutomationJevRouteCondition,
	question: AutomationJevQuestion,
	field: AutomationJevRouteField,
): AutomationJevRouteCondition {
	if (field === "choice") {
		return {
			questionKey: question.key,
			field,
			operator: "equals",
			value: optionsForQuestion(question)[0]?.value ?? "",
		};
	}
	if (field === "probability") {
		return {
			questionKey: question.key,
			field,
			operator: "greaterThanOrEqual",
			option: optionsForQuestion(question)[0]?.value ?? "",
			value: 0.5,
		};
	}
	return {
		...condition,
		questionKey: question.key,
		field,
		operator: "greaterThanOrEqual",
		value: 0.5,
		option: undefined,
	};
}

/** Edits one ordered JEV route and the answer rules that select it. */
export function JevRouteEditor({
	route,
	questions,
	index,
	routeCount,
	onChange,
	onMove,
	onRemove,
	readOnly,
}: JevRouteEditorProps) {
	const [open, setOpen] = useState(index === 0);
	const conditions = route.conditions ?? [];
	const selectableQuestions = questions.filter(
		(question, questionIndex) =>
			question.key.trim() !== "" &&
			questions.findIndex(
				(candidate) => candidate.key === question.key,
			) === questionIndex,
	);
	const prefix = `jev-route-${route.id}`;
	const updateCondition = (
		conditionIndex: number,
		condition: AutomationJevRouteCondition,
	): void => {
		onChange({
			...route,
			conditions: conditions.map((candidate, candidateIndex) =>
				candidateIndex === conditionIndex ? condition : candidate,
			),
		});
	};

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="min-w-0 rounded-lg border bg-card p-3"
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
								{route.description || `Route ${index + 1}`}
							</span>
							<span className="block text-muted-foreground text-xs">
								{conditions.length}{" "}
								{conditions.length === 1 ? "rule" : "rules"}
							</span>
						</span>
					</Button>
				</CollapsibleTrigger>
				{!readOnly && (
					<div className="flex items-center">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={index === 0}
							onClick={() => onMove(-1)}
							aria-label={`Move route ${index + 1} up`}
						>
							<ArrowUp className="size-4" aria-hidden="true" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={index === routeCount - 1}
							onClick={() => onMove(1)}
							aria-label={`Move route ${index + 1} down`}
						>
							<ArrowDown className="size-4" aria-hidden="true" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 text-muted-foreground hover:text-destructive"
							disabled={routeCount === 1}
							onClick={onRemove}
							aria-label={`Remove route ${index + 1}`}
						>
							<Trash2 className="size-4" aria-hidden="true" />
						</Button>
					</div>
				)}
			</div>
			<CollapsibleContent className="flex flex-col gap-3 pt-3">
				<Field>
					<FieldLabel htmlFor={`${prefix}-description`}>
						Route name
					</FieldLabel>
					<Input
						id={`${prefix}-description`}
						value={route.description}
						onChange={(event) =>
							onChange({
								...route,
								description: event.target.value,
							})
						}
						placeholder="Send to urgent review"
						readOnly={readOnly}
						aria-required="true"
					/>
				</Field>
				{conditions.length > 1 && (
					<Field>
						<FieldLabel htmlFor={`${prefix}-match`}>
							Continue when
						</FieldLabel>
						<Select
							value={route.match ?? "all"}
							onValueChange={(match) =>
								onChange({
									...route,
									match: match === "any" ? "any" : "all",
								})
							}
							disabled={readOnly}
						>
							<SelectTrigger
								id={`${prefix}-match`}
								className={SELECT_TRIGGER_CLASS_NAME}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								className={SELECT_CONTENT_CLASS_NAME}
							>
								<SelectItem value="all">
									Every rule matches
								</SelectItem>
								<SelectItem value="any">
									Any rule matches
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				)}
				<div className="flex flex-col gap-2">
					{conditions.map((condition, conditionIndex) => {
						const question =
							selectableQuestions.find(
								(candidate) =>
									candidate.key === condition.questionKey,
							) ?? selectableQuestions[0];
						if (!question) return null;
						const fields = fieldsForQuestion(question);
						const field = fields.some(
							(candidate) => candidate.value === condition.field,
						)
							? condition.field
							: fields[0].value;
						const options = optionsForQuestion(question);
						const operators =
							field === "choice"
								? TEXT_OPERATORS
								: NUMERIC_OPERATORS;
						return (
							<div
								key={`${route.id}-condition-${conditionIndex}`}
								className="flex min-w-0 flex-col gap-2 rounded-md border bg-muted/20 p-2"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="font-medium text-xs">
										Rule {conditionIndex + 1}
									</p>
									{!readOnly && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-7 text-muted-foreground hover:text-destructive"
											disabled={conditions.length === 1}
											onClick={() =>
												onChange({
													...route,
													conditions:
														conditions.filter(
															(
																_,
																candidateIndex,
															) =>
																candidateIndex !==
																conditionIndex,
														),
												})
											}
											aria-label={`Remove rule ${conditionIndex + 1} from route ${index + 1}`}
										>
											<Trash2
												className="size-3.5"
												aria-hidden="true"
											/>
										</Button>
									)}
								</div>
								<div className="grid min-w-0 grid-cols-1 gap-2">
									<Field className="min-w-0">
										<FieldLabel>Question</FieldLabel>
										<Select
											value={question.key}
											onValueChange={(questionKey) => {
												const nextQuestion =
													selectableQuestions.find(
														(candidate) =>
															candidate.key ===
															questionKey,
													);
												if (nextQuestion) {
													updateCondition(
														conditionIndex,
														defaultCondition(
															nextQuestion,
														),
													);
												}
											}}
											disabled={readOnly}
										>
											<SelectTrigger
												className={
													SELECT_TRIGGER_CLASS_NAME
												}
												aria-label={`Rule ${conditionIndex + 1} question`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent
												className={
													SELECT_CONTENT_CLASS_NAME
												}
											>
												{selectableQuestions.map(
													(candidate) => (
														<SelectItem
															key={candidate.key}
															title={
																candidate.key
															}
															value={
																candidate.key
															}
														>
															{candidate.key ||
																"Unnamed question"}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</Field>
									<Field className="min-w-0">
										<FieldLabel>Answer</FieldLabel>
										<Select
											value={field}
											onValueChange={(value) =>
												updateCondition(
													conditionIndex,
													normalizeCondition(
														condition,
														question,
														value as AutomationJevRouteField,
													),
												)
											}
											disabled={readOnly}
										>
											<SelectTrigger
												className={
													SELECT_TRIGGER_CLASS_NAME
												}
												aria-label={`Rule ${conditionIndex + 1} answer`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent
												className={
													SELECT_CONTENT_CLASS_NAME
												}
											>
												{fields.map((candidate) => (
													<SelectItem
														key={candidate.value}
														value={candidate.value}
													>
														{candidate.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								</div>
								{field === "probability" && (
									<Field className="min-w-0">
										<FieldLabel>Answer option</FieldLabel>
										<Select
											value={
												condition.option ??
												options[0]?.value ??
												""
											}
											onValueChange={(option) =>
												updateCondition(
													conditionIndex,
													{
														...condition,
														field,
														option,
													},
												)
											}
											disabled={readOnly}
										>
											<SelectTrigger
												className={
													SELECT_TRIGGER_CLASS_NAME
												}
												aria-label={`Rule ${conditionIndex + 1} option`}
											>
												<SelectValue placeholder="Choose an answer" />
											</SelectTrigger>
											<SelectContent
												className={
													SELECT_CONTENT_CLASS_NAME
												}
											>
												{options.map((option) => (
													<SelectItem
														key={option.value}
														value={option.value}
														title={option.label}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
								<div className="grid min-w-0 grid-cols-1 gap-2">
									<Field className="min-w-0">
										<FieldLabel>Comparison</FieldLabel>
										<Select
											value={condition.operator}
											onValueChange={(operator) =>
												updateCondition(
													conditionIndex,
													{
														...condition,
														field,
														operator:
															operator as AutomationJevRouteOperator,
													},
												)
											}
											disabled={readOnly}
										>
											<SelectTrigger
												className={
													SELECT_TRIGGER_CLASS_NAME
												}
												aria-label={`Rule ${conditionIndex + 1} comparison`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent
												className={
													SELECT_CONTENT_CLASS_NAME
												}
											>
												{operators.map((operator) => (
													<SelectItem
														key={operator.value}
														value={operator.value}
													>
														{operator.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
									<Field className="min-w-0">
										<FieldLabel>Value</FieldLabel>
										{field === "choice" ? (
											<Select
												value={String(condition.value)}
												onValueChange={(value) =>
													updateCondition(
														conditionIndex,
														{
															...condition,
															field,
															value,
														},
													)
												}
												disabled={readOnly}
											>
												<SelectTrigger
													className={
														SELECT_TRIGGER_CLASS_NAME
													}
													aria-label={`Rule ${conditionIndex + 1} value`}
												>
													<SelectValue placeholder="Choose an answer" />
												</SelectTrigger>
												<SelectContent
													className={
														SELECT_CONTENT_CLASS_NAME
													}
												>
													{options.map((option) => (
														<SelectItem
															key={option.value}
															value={option.value}
															title={option.label}
														>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<Input
												type="number"
												min={0}
												max={1}
												step={0.05}
												value={condition.value}
												onChange={(event) =>
													updateCondition(
														conditionIndex,
														{
															...condition,
															field,
															value: Number(
																event.target
																	.value,
															),
														},
													)
												}
												aria-label={`Rule ${conditionIndex + 1} value from zero to one`}
												readOnly={readOnly}
											/>
										)}
									</Field>
								</div>
							</div>
						);
					})}
					{!readOnly && selectableQuestions[0] && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								onChange({
									...route,
									conditions: [
										...conditions,
										defaultCondition(
											selectableQuestions[0],
										),
									],
								})
							}
						>
							<Plus className="size-4" aria-hidden="true" />
							Add rule
						</Button>
					)}
				</div>
				<FieldDescription>
					Routes run top to bottom. Use the fallback path when none
					match.
				</FieldDescription>
			</CollapsibleContent>
		</Collapsible>
	);
}
