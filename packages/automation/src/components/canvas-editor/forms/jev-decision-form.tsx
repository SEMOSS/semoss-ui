import { Plus, Trash2 } from "lucide-react";
import type { Engine } from "@semoss/shared";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Input,
	Label,
	RadioGroup,
	RadioGroupItem,
} from "@semoss/ui/next";
import type { JevDecisionConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { PillInput } from "./pill-input";

interface JevDecisionFormProps {
	config: JevDecisionConfig;
	upstreamVars: string[];
	onChange: (config: JevDecisionConfig) => void;
	readOnly?: boolean;
}

/** Configures one TypeSafe/Jev question and its stable graph routes. */
export function JevDecisionForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: JevDecisionFormProps) {
	const questionType = config.questionType === "noul" ? "noul" : "choice";
	const canUseNoul = config.clauses.length <= 2;

	const updateRoute = (index: number, description: string) => {
		const clauses = config.clauses.map((route, routeIndex) =>
			routeIndex === index ? { ...route, description } : route,
		);
		onChange({ ...config, clauses });
	};

	const updateQuestionType = (nextType: string) => {
		if (nextType === "noul") {
			if (!canUseNoul) return;
			const [first, second] = config.clauses;
			onChange({
				...config,
				questionType: "noul",
				confidenceThreshold: Math.max(config.confidenceThreshold, 0.5),
				clauses: [
					{
						id: first?.id ?? crypto.randomUUID(),
						description: first?.description ?? "",
						answer: true,
					},
					{
						id: second?.id ?? crypto.randomUUID(),
						description: second?.description ?? "",
						answer: false,
					},
				],
			});
			return;
		}
		if (nextType === "choice") {
			onChange({
				...config,
				questionType: "choice",
				clauses: config.clauses.map(({ id, description }) => ({
					id,
					description,
				})),
			});
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Jev model"
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
							engine.engine_display_name || engine.engine_name,
					})
				}
			/>
			<PillInput
				label="State to evaluate"
				required
				value={config.state}
				onChange={(state) => onChange({ ...config, state })}
				upstreamVars={upstreamVars}
				placeholder="${prior_output}"
				description="Use an exact variable reference to preserve maps, lists, and other native values."
				readOnly={readOnly}
			/>
			<PillInput
				label="Routing question"
				required
				value={config.question}
				onChange={(question) => onChange({ ...config, question })}
				upstreamVars={upstreamVars}
				placeholder="Which route best matches this input?"
				readOnly={readOnly}
			/>
			<FieldSet>
				<FieldLegend>Decision type</FieldLegend>
				<FieldDescription>
					Choose multiple routes or a direct Yes / No decision.
				</FieldDescription>
				<RadioGroup
					value={questionType}
					onValueChange={updateQuestionType}
					className="grid gap-2 sm:grid-cols-2"
					disabled={readOnly}
				>
					<Label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
						<RadioGroupItem value="choice" className="mt-0.5" />
						<span>
							<span className="block font-medium">
								Multiple choice
							</span>
							<span className="block text-muted-foreground text-xs">
								Jev selects one described route.
							</span>
						</span>
					</Label>
					<Label
						className={`flex items-start gap-3 rounded-md border border-border p-3 ${canUseNoul ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
					>
						<RadioGroupItem
							value="noul"
							className="mt-0.5"
							disabled={!canUseNoul}
						/>
						<span>
							<span className="block font-medium">Yes / No</span>
							<span className="block text-muted-foreground text-xs">
								Jev returns the probability of Yes.
							</span>
						</span>
					</Label>
				</RadioGroup>
				{!canUseNoul && questionType === "choice" && (
					<p className="text-muted-foreground text-xs">
						Remove routes until two remain before switching to Yes /
						No.
					</p>
				)}
			</FieldSet>
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<p className="font-medium text-xs">Routes</p>
					{!readOnly && questionType === "choice" && (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() =>
								onChange({
									...config,
									clauses: [
										...config.clauses,
										{
											id: crypto.randomUUID(),
											description: "",
										},
									],
								})
							}
						>
							<Plus className="size-3.5" />
							Add route
						</Button>
					)}
				</div>
				{config.clauses.map((route, index) => {
					const routeLabel =
						questionType === "noul"
							? route.answer
								? "Yes path"
								: "No path"
							: `Route ${index + 1}`;
					return (
						<div key={route.id} className="flex items-start gap-2">
							<Field className="flex-1">
								<FieldLabel>{routeLabel}</FieldLabel>
								<Input
									value={route.description}
									onChange={(event) =>
										updateRoute(index, event.target.value)
									}
									placeholder={`Describe ${routeLabel.toLowerCase()}`}
									readOnly={readOnly}
								/>
							</Field>
							{!readOnly &&
								questionType === "choice" &&
								config.clauses.length > 1 && (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label={`Remove route ${index + 1}`}
										onClick={() =>
											onChange({
												...config,
												clauses: config.clauses.filter(
													(candidate) =>
														candidate.id !==
														route.id,
												),
											})
										}
									>
										<Trash2 className="size-3.5" />
									</Button>
								)}
						</div>
					);
				})}
				<p className="text-muted-foreground text-xs">
					The fallback path runs when confidence is below the minimum.
				</p>
			</div>
			<Field>
				<FieldLabel>Minimum confidence</FieldLabel>
				<Input
					type="number"
					min={questionType === "noul" ? 0.5 : 0}
					max={1}
					step={0.05}
					value={config.confidenceThreshold}
					onChange={(event) =>
						onChange({
							...config,
							confidenceThreshold: Number(event.target.value),
						})
					}
					readOnly={readOnly}
				/>
			</Field>
			<PillInput
				label="Jev parameters"
				value={config.paramValues}
				onChange={(paramValues) => onChange({ ...config, paramValues })}
				upstreamVars={[]}
				placeholder='{"timeout": 30, "max_retries": 1}'
				mono
				minRows={2}
				readOnly={readOnly}
			/>
		</div>
	);
}
