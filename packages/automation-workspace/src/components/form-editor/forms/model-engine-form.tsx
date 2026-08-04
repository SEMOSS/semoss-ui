import { useId } from "react";
import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	EngineOption,
	ModelEngineConfig,
} from "../../../domain/automation.types";
import { getPlaygroundParamDescription } from "../../../domain/automation-utils";
import { BoundInput, EngineSelect } from "./shared";

export interface ModelEngineFormProps {
	/** Current node config */
	config: ModelEngineConfig;
	/** Model engines the user has access to */
	engines: EngineOption[];
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: ModelEngineConfig) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
}

export function ModelEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
	playgroundFillable,
	onPlaygroundFieldsChange,
}: ModelEngineFormProps) {
	const pgFillId = useId();
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Model Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as ModelEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="llm">LLM (chat)</SelectItem>
						<SelectItem value="embeddings">Embeddings</SelectItem>
						<SelectItem value="vision">Vision</SelectItem>
						<SelectItem value="ner">NER</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.operation === "llm" && (
				<>
					<BoundInput
						label="Prompt"
						value={config.command}
						placeholder="Summarize: ${text}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id={pgFillId}
							checked={playgroundFillable.includes("command")}
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
								Current value will be overwritten if Playground
								provides input
							</p>
						)}
					<BoundInput
						label="Context (optional)"
						value={config.context}
						placeholder="You are a helpful assistant."
						onChange={(v) => onChange({ ...config, context: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Param Values (JSON, optional)"
						value={config.paramValues}
						placeholder='{"temperature": 0.7, "maxTokens": 1000}'
						onChange={(v) =>
							onChange({ ...config, paramValues: v })
						}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
			{config.operation === "embeddings" && (
				<BoundInput
					label="Values"
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
						value={config.command}
						placeholder="Describe what you see in this image."
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Image URL / Path"
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
						value={config.prompt}
						placeholder="Extract entities from: ${text}"
						onChange={(v) => onChange({ ...config, prompt: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Entities (JSON)"
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
