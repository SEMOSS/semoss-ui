import { useEffect, useId, useMemo } from "react";
import { Field, FieldLabel } from "@semoss/ui/next";
import type { ModelEngineConfig } from "../../../domain/automation.types";
import { getPlaygroundParamDescription } from "../../../domain/automation-utils";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

/** Maps engine_subtype values to the operations they support. */
const SUBTYPE_OPERATIONS: Record<string, ModelEngineConfig["operation"][]> = {
	TEXT_EMBEDDINGS: ["embeddings"],
	KSERVE_IMAGE_EMBED: ["embeddings"],
	NER: ["ner"],
	KSERVE_VISION: ["vision"],
	KSERVE_IMAGE: ["vision"],
};

const ALL_OPERATIONS: {
	value: ModelEngineConfig["operation"];
	label: string;
}[] = [
	{ value: "llm", label: "Chat / Generate text" },
	{ value: "embeddings", label: "Generate Embeddings" },
	{ value: "vision", label: "Vision" },
	{ value: "ner", label: "Extract Entities" },
];

export interface ModelEngineFormProps {
	/** Current node config */
	config: ModelEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: ModelEngineConfig) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
	/** When false (business mode), advanced fields like Model Settings are hidden */
	devMode?: boolean;
}

export function ModelEngineForm({
	config,
	upstreamVars,
	onChange,
	playgroundFillable,
	onPlaygroundFieldsChange,
	devMode = false,
}: ModelEngineFormProps) {
	const pgFillId = useId();

	// Derive which operations the selected engine supports based on its subtype
	const availableOps = useMemo(() => {
		if (!config.engineId) return ALL_OPERATIONS;
		const subtype = (config.engineSubtype ?? "").toUpperCase();
		const allowed = SUBTYPE_OPERATIONS[subtype];
		if (!allowed) return ALL_OPERATIONS;
		return ALL_OPERATIONS.filter((op) => allowed.includes(op.value));
	}, [config.engineId, config.engineSubtype]);

	// Auto-select the only available operation when the engine constrains it
	useEffect(() => {
		if (
			availableOps.length === 1 &&
			config.operation !== availableOps[0].value
		) {
			onChange({ ...config, operation: availableOps[0].value });
		}
	}, [availableOps, config, onChange]);

	const singleOp = availableOps.length === 1;

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="AI Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["MODEL"]}
				required
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
						engineSubtype: e.engine_subtype ?? "",
					})
				}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<div className="flex flex-wrap gap-2">
					{availableOps.map((op) => {
						const isActive = config.operation === op.value;
						return (
							<button
								key={op.value}
								type="button"
								disabled={singleOp}
								onClick={() =>
									onChange({
										...config,
										operation: op.value,
									})
								}
								className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
									isActive
										? "border-primary bg-primary/10 font-medium text-primary"
										: "hover:border-primary/40"
								} disabled:cursor-default`}
							>
								{op.label}
							</button>
						);
					})}
				</div>
				{singleOp && (
					<p className="mt-1 text-[11px] text-muted-foreground">
						This engine only supports{" "}
						{availableOps[0]?.label ?? "one operation"}.
					</p>
				)}
			</Field>
			{config.operation === "llm" && (
				<>
					<BoundInput
						label="Prompt"
						required
						value={config.command}
						placeholder="Summarize: ${text}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					{devMode && (
						<>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id={pgFillId}
									checked={playgroundFillable.includes(
										"command",
									)}
									onChange={(e) => {
										const next = e.target.checked
											? [...playgroundFillable, "command"]
											: playgroundFillable.filter(
													(f) => f !== "command",
												);
										onPlaygroundFieldsChange(next);
									}}
									className="h-3.5 w-3.5 cursor-pointer accent-primary"
								/>
								<label
									htmlFor={pgFillId}
									className="cursor-pointer text-muted-foreground text-xs"
									title={getPlaygroundParamDescription(
										"model-engine",
										"command",
									)}
								>
									Let Playground fill this field
								</label>
							</div>
							{playgroundFillable.includes("command") &&
								config.command && (
									<p className="text-amber-600 text-xs dark:text-amber-400">
										Current value will be overwritten if
										Playground provides input
									</p>
								)}
						</>
					)}
					<BoundInput
						label="System Instructions (optional)"
						value={config.context}
						placeholder="e.g. You are a helpful assistant."
						onChange={(v) => onChange({ ...config, context: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					{devMode && (
						<BoundInput
							label="Model Settings (JSON, optional)"
							value={config.paramValues}
							placeholder='{"temperature": 0.7, "maxTokens": 1000}'
							onChange={(v) =>
								onChange({ ...config, paramValues: v })
							}
							upstreamVars={upstreamVars}
							mono
						/>
					)}
				</>
			)}
			{config.operation === "embeddings" && (
				<BoundInput
					label="Text to Embed"
					required
					value={config.values}
					placeholder="${text_to_embed}"
					onChange={(v) => onChange({ ...config, values: v })}
					upstreamVars={upstreamVars}
				/>
			)}
			{config.operation === "vision" && (
				<>
					<BoundInput
						label="Command"
						required
						value={config.command}
						placeholder="Describe what you see in this image."
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Image URL / Path"
						required
						value={config.image}
						placeholder="${image_url}"
						onChange={(v) => onChange({ ...config, image: v })}
						upstreamVars={upstreamVars}
					/>
				</>
			)}
			{config.operation === "ner" && (
				<>
					<BoundInput
						label="Prompt"
						required
						value={config.prompt}
						placeholder="Extract entities from: ${text}"
						onChange={(v) => onChange({ ...config, prompt: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Entities (JSON)"
						required
						value={config.entities}
						placeholder='["PERSON", "ORG", "DATE"]'
						onChange={(v) => onChange({ ...config, entities: v })}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
		</div>
	);
}
