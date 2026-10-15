import { ChevronDown, Plus } from "lucide-react";
import { useId } from "react";
import type { Engine } from "@semoss/shared";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Textarea,
} from "@semoss/ui/next";
import type { JevDecisionConfig } from "../../../domain/automation.types";
import type {
	AutomationJevQuestion,
	AutomationJevRoute,
	AutomationJevRouteCondition,
} from "../../../domain/automation-workflow.types";
import { EnginePickerField } from "./engine-picker-field";
import { JevQuestionEditor } from "./jev-question-editor";
import { JevRouteEditor } from "./jev-route-editor";
import { JevStepHeading } from "./jev-step-heading";
import { PillInput } from "./pill-input";

interface JevDecisionFormProps {
	config: JevDecisionConfig;
	upstreamVars: string[];
	onChange: (config: JevDecisionConfig) => void;
	devMode?: boolean;
	readOnly?: boolean;
}

function nextKey(prefix: string, used: Set<string>): string {
	let index = used.size + 1;
	while (used.has(`${prefix}_${index}`)) index += 1;
	return `${prefix}_${index}`;
}

function defaultQuestion(
	questions: AutomationJevQuestion[],
): AutomationJevQuestion {
	return {
		key: nextKey(
			"question",
			new Set(questions.map((question) => question.key)),
		),
		type: "choice",
		instructions: "",
		criteria: { option_1: "" },
	};
}

function choiceKeys(question: AutomationJevQuestion): string[] {
	return question.type === "choice" &&
		question.criteria &&
		!Array.isArray(question.criteria)
		? Object.keys(question.criteria)
		: [];
}

function defaultCondition(
	question: AutomationJevQuestion,
): AutomationJevRouteCondition {
	if (question.type === "choice") {
		return {
			questionKey: question.key,
			field: "choice",
			operator: "equals",
			value: choiceKeys(question)[0] ?? "",
		};
	}
	return {
		questionKey: question.key,
		field: question.type === "score" ? "score" : "noul",
		operator: "greaterThanOrEqual",
		value: 0.5,
	};
}

function normalizeCondition(
	condition: AutomationJevRouteCondition,
	previous: AutomationJevQuestion,
	next: AutomationJevQuestion,
): AutomationJevRouteCondition {
	if (previous.key !== condition.questionKey) return condition;
	if (previous.type !== next.type) return defaultCondition(next);
	if (next.type === "choice") {
		const choices = choiceKeys(next);
		if (
			condition.field === "choice" &&
			!choices.includes(String(condition.value))
		) {
			return {
				...condition,
				questionKey: next.key,
				value: choices[0] ?? "",
			};
		}
		if (
			condition.field === "probability" &&
			!choices.includes(condition.option ?? "")
		) {
			return {
				...condition,
				questionKey: next.key,
				option: choices[0] ?? "",
			};
		}
	}
	if (next.type === "score" && condition.field === "probability") {
		const levelCount = Array.isArray(next.criteria)
			? next.criteria.length
			: 0;
		const option = Number(condition.option);
		if (!Number.isInteger(option) || option < 0 || option >= levelCount) {
			return { ...condition, questionKey: next.key, option: "0" };
		}
	}
	return { ...condition, questionKey: next.key };
}

function parseParameters(value: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed !== null &&
			typeof parsed === "object" &&
			!Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

function numberParameter(
	parameters: Record<string, unknown>,
	key: string,
	fallback: number,
): number {
	const value = parameters[key];
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

/** Configures a multi-question TypeSafe/JEV decision and its ordered routes. */
export function JevDecisionForm({
	config,
	upstreamVars,
	onChange,
	devMode = false,
	readOnly = false,
}: JevDecisionFormProps) {
	const fieldId = useId();
	const parameters = parseParameters(config.paramValues);
	const firstRoutableQuestion = config.questions.find(
		(question) => question.key.trim() !== "",
	);
	const updateParameters = (next: Record<string, unknown>): void => {
		onChange({ ...config, paramValues: JSON.stringify(next) });
	};

	const updateQuestion = (
		index: number,
		question: AutomationJevQuestion,
	): void => {
		const previous = config.questions[index];
		const questions = config.questions.map((candidate, candidateIndex) =>
			candidateIndex === index ? question : candidate,
		);
		const clauses = config.clauses.map((route) => ({
			...route,
			conditions: (route.conditions ?? []).map((condition) =>
				normalizeCondition(condition, previous, question),
			),
		}));
		onChange({ ...config, questions, clauses });
	};

	const removeQuestion = (index: number): void => {
		const removed = config.questions[index];
		const questions = config.questions.filter(
			(_, candidateIndex) => candidateIndex !== index,
		);
		const fallbackQuestion = questions[0];
		if (!fallbackQuestion) return;
		const clauses = config.clauses.map((route) => {
			const conditions = (route.conditions ?? []).filter(
				(condition) => condition.questionKey !== removed.key,
			);
			return {
				...route,
				conditions:
					conditions.length > 0
						? conditions
						: [defaultCondition(fallbackQuestion)],
			};
		});
		onChange({ ...config, questions, clauses });
	};

	const updateRoute = (index: number, route: AutomationJevRoute): void => {
		onChange({
			...config,
			clauses: config.clauses.map((candidate, candidateIndex) =>
				candidateIndex === index ? route : candidate,
			),
		});
	};

	const moveRoute = (index: number, direction: -1 | 1): void => {
		const destination = index + direction;
		if (destination < 0 || destination >= config.clauses.length) return;
		const clauses = [...config.clauses];
		[clauses[index], clauses[destination]] = [
			clauses[destination],
			clauses[index],
		];
		onChange({ ...config, clauses });
	};

	return (
		<div className="flex flex-col gap-6">
			<section className="flex flex-col gap-3">
				<JevStepHeading
					number={1}
					title="Choose what Jev reviews"
					description="Select a Jev model, then provide the text, record, or list it should evaluate."
				/>
				<EnginePickerField
					label="JEV model"
					name={config.engineName ?? ""}
					value={config.engineId}
					engineTypes={["MODEL"]}
					allowedEngineSubtypes={["TYPESAFE"]}
					required
					disabled={readOnly}
					onChange={(engine: Engine) =>
						onChange({
							...config,
							engineId: engine.engine_id,
							engineName:
								engine.engine_display_name ||
								engine.engine_name,
						})
					}
				/>
				<PillInput
					label="State to evaluate"
					required
					value={config.state}
					onChange={(state) => onChange({ ...config, state })}
					upstreamVars={upstreamVars}
					placeholder="Paste text or insert data from an earlier step"
					description="Related evidence belongs together in one state. Insert an exact variable to preserve its original data type."
					readOnly={readOnly}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<div className="flex flex-col items-start gap-3">
					<JevStepHeading
						number={2}
						title="Ask questions"
						description="Add the named Choice, Score, or Yes / No answers Jev should return."
					/>
					{!readOnly && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								onChange({
									...config,
									questions: [
										...config.questions,
										defaultQuestion(config.questions),
									],
								})
							}
						>
							<Plus className="size-4" aria-hidden="true" />
							Add question
						</Button>
					)}
				</div>
				{config.questions.map((question, index) => (
					<JevQuestionEditor
						// Questions cannot be reordered; the index keeps focus while its editable key changes.
						// biome-ignore lint/suspicious/noArrayIndexKey: stable authoring identity
						key={index}
						question={question}
						index={index}
						questionCount={config.questions.length}
						onChange={(next) => updateQuestion(index, next)}
						onRemove={() => removeQuestion(index)}
						readOnly={readOnly}
					/>
				))}
			</section>

			<section className="flex flex-col gap-3">
				<div className="flex flex-col items-start gap-3">
					<JevStepHeading
						number={3}
						title="Use the answers"
						description="Send the automation down the first route whose rules match."
					/>
					{!readOnly && firstRoutableQuestion && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								onChange({
									...config,
									clauses: [
										...config.clauses,
										{
											id: crypto.randomUUID(),
											description: "",
											match: "all",
											conditions: [
												defaultCondition(
													firstRoutableQuestion,
												),
											],
										},
									],
								})
							}
						>
							<Plus className="size-4" aria-hidden="true" />
							Add route
						</Button>
					)}
				</div>
				{config.clauses.map((route, index) => (
					<JevRouteEditor
						key={route.id}
						route={route}
						questions={config.questions}
						index={index}
						routeCount={config.clauses.length}
						onChange={(next) => updateRoute(index, next)}
						onMove={(direction) => moveRoute(index, direction)}
						onRemove={() =>
							onChange({
								...config,
								clauses: config.clauses.filter(
									(candidate) => candidate.id !== route.id,
								),
							})
						}
						readOnly={readOnly}
					/>
				))}
				<div className="rounded-lg border border-dashed bg-muted/20 p-3">
					<p className="font-medium text-sm">Fallback path</p>
					<p className="mt-1 text-muted-foreground text-xs">
						Runs when no route rules match. Connect it on the canvas
						to handle uncertain or unexpected answers safely.
					</p>
				</div>
			</section>

			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full justify-between"
					>
						Advanced run settings
						<ChevronDown className="size-4" aria-hidden="true" />
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-3 pt-3">
					<div className="grid gap-3">
						<Field>
							<FieldLabel htmlFor={`${fieldId}-timeout`}>
								Timeout (seconds)
							</FieldLabel>
							<Input
								id={`${fieldId}-timeout`}
								type="number"
								min={1}
								step={1}
								value={numberParameter(
									parameters,
									"timeout",
									30,
								)}
								onChange={(event) =>
									updateParameters({
										...parameters,
										timeout: Number(event.target.value),
									})
								}
								readOnly={readOnly}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={`${fieldId}-retries`}>
								Retries
							</FieldLabel>
							<Input
								id={`${fieldId}-retries`}
								type="number"
								min={0}
								step={1}
								value={numberParameter(
									parameters,
									"max_retries",
									2,
								)}
								onChange={(event) =>
									updateParameters({
										...parameters,
										max_retries: Number(event.target.value),
									})
								}
								readOnly={readOnly}
							/>
						</Field>
					</div>
					{devMode && (
						<Field>
							<FieldLabel htmlFor={`${fieldId}-parameters`}>
								Parameters (JSON)
							</FieldLabel>
							<Textarea
								id={`${fieldId}-parameters`}
								value={config.paramValues}
								onChange={(event) =>
									onChange({
										...config,
										paramValues: event.target.value,
									})
								}
								readOnly={readOnly}
								rows={3}
								className="font-mono text-xs"
							/>
							<FieldDescription>
								Advanced transport options sent to the TypeSafe
								engine.
							</FieldDescription>
						</Field>
					)}
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
