import { Plus, Trash2 } from "lucide-react";
import type { Engine } from "@semoss/shared";
import { Button, Field, FieldLabel, Input } from "@semoss/ui/next";
import type { JevDecisionConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { PillInput } from "./pill-input";

interface JevDecisionFormProps {
	config: JevDecisionConfig;
	upstreamVars: string[];
	onChange: (config: JevDecisionConfig) => void;
	readOnly?: boolean;
}

/** Configures one TypeSafe/Jev choice question and its graph routes. */
export function JevDecisionForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: JevDecisionFormProps) {
	const updateRoute = (index: number, description: string) => {
		const clauses = config.clauses.map((route, routeIndex) =>
			routeIndex === index ? { ...route, description } : route,
		);
		onChange({ ...config, clauses });
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
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<p className="font-medium text-xs">Routes</p>
					{!readOnly && (
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
				{config.clauses.map((route, index) => (
					<div key={route.id} className="flex items-start gap-2">
						<Field className="flex-1">
							<FieldLabel className="sr-only">
								Route {index + 1} description
							</FieldLabel>
							<Input
								value={route.description}
								onChange={(event) =>
									updateRoute(index, event.target.value)
								}
								placeholder={`Describe route ${index + 1}`}
								readOnly={readOnly}
							/>
						</Field>
						{!readOnly && config.clauses.length > 1 && (
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
												candidate.id !== route.id,
										),
									})
								}
							>
								<Trash2 className="size-3.5" />
							</Button>
						)}
					</div>
				))}
				<p className="text-muted-foreground text-xs">
					The fallback path runs when confidence is below the minimum.
				</p>
			</div>
			<Field>
				<FieldLabel>Minimum confidence</FieldLabel>
				<Input
					type="number"
					min={0}
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
