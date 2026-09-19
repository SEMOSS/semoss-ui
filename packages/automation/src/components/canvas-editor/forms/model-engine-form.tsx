import type { ModelEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

export interface ModelEngineFormProps {
	/** Current node config */
	config: ModelEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: ModelEngineConfig) => void;
	/** When false (business mode), advanced fields like Model Settings are hidden */
	devMode?: boolean;
	/** When true, all fields are locked to their current values */
	readOnly?: boolean;
}

export function ModelEngineForm({
	config,
	upstreamVars,
	onChange,
	devMode = false,
	readOnly = false,
}: ModelEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="AI Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["MODEL"]}
				required
				disabled={readOnly}
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
						engineSubtype: e.engine_subtype ?? "",
					})
				}
			/>
			{config.operation === "llm" && (
				<>
					<BoundInput
						label="Prompt"
						required
						value={config.command}
						placeholder="Summarize: ${text}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
					<BoundInput
						label="System Instructions (optional)"
						value={config.context}
						placeholder="e.g. You are a helpful assistant."
						onChange={(v) => onChange({ ...config, context: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
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
							readOnly={readOnly}
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
					readOnly={readOnly}
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
						readOnly={readOnly}
						mono
					/>
					<BoundInput
						label="Image URL / Path"
						required
						value={config.image}
						placeholder="${image_url}"
						onChange={(v) => onChange({ ...config, image: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
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
						readOnly={readOnly}
						mono
					/>
					<BoundInput
						label="Entities (JSON)"
						required
						value={config.entities}
						placeholder='["PERSON", "ORG", "DATE"]'
						onChange={(v) => onChange({ ...config, entities: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
				</>
			)}
		</div>
	);
}
