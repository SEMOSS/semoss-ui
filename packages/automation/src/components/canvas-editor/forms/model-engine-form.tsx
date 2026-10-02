import { parseJsonStringArray } from "@semoss/utility/json";
import type { ModelEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";
import { StringListInput } from "./string-list-input";

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
	const mediaUrls = config.urls.trim()
		? parseJsonStringArray(config.urls)
		: [];

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="AI Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["MODEL"]}
				excludedEngineSubtypes={["TYPESAFE"]}
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
				<>
					<BoundInput
						label="Text to Embed"
						required
						value={config.values}
						placeholder="${text_to_embed}"
						onChange={(v) => onChange({ ...config, values: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					{devMode && (
						<BoundInput
							label="Model Settings (JSON, optional)"
							value={config.paramValues}
							placeholder='{"batchSize": 32}'
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
						label="Media Path(s)"
						value={config.image}
						placeholder="${downloaded_files.files}"
						onChange={(v) => onChange({ ...config, image: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					{mediaUrls !== null ? (
						<StringListInput
							label="Media URLs (optional)"
							values={mediaUrls}
							onChange={(urls) =>
								onChange({
									...config,
									urls: JSON.stringify(urls),
								})
							}
							upstreamVars={upstreamVars}
							itemLabel="URL"
							placeholder="https://example.com/image.png"
							readOnly={readOnly}
						/>
					) : (
						<BoundInput
							label="Media URLs (JSON, optional)"
							value={config.urls}
							placeholder='["https://example.com/image.png"]'
							description={
								mediaUrls === null && !devMode
									? "This existing value needs Developer mode to edit safely."
									: undefined
							}
							onChange={(urls) => onChange({ ...config, urls })}
							upstreamVars={upstreamVars}
							readOnly={
								readOnly || (!devMode && mediaUrls === null)
							}
							mono
						/>
					)}
					<BoundInput
						label="System Instructions (optional)"
						value={config.context}
						placeholder="e.g. Focus on clinical findings."
						onChange={(v) => onChange({ ...config, context: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
					{devMode && (
						<BoundInput
							label="Model Settings (JSON, optional)"
							value={config.paramValues}
							placeholder='{"temperature": 0.2}'
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
			{config.operation === "ner" && (
				<>
					<BoundInput
						label="Text to Analyze"
						required
						value={config.command}
						placeholder="${text}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
					<BoundInput
						label="Mask Entities (JSON, optional)"
						value={config.maskEntities}
						placeholder='["PERSON"]'
						onChange={(v) =>
							onChange({ ...config, maskEntities: v })
						}
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
