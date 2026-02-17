import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import type { LLMAgentConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface LLMAgentConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

interface EngineOption {
	id: string;
	name: string;
}

export function LLMAgentConfigForm({
	config,
	stepId,
	onChange,
}: LLMAgentConfigFormProps) {
	const typedConfig = config as unknown as LLMAgentConfig;
	const [models, setModels] = useState<EngineOption[]>([]);
	const [toolEngines, setToolEngines] = useState<EngineOption[]>([]);

	// Fetch models
	useEffect(() => {
		runPixel<[{ database_id: string; database_name: string }[]]>(
			'MyEngines(engineTypes=["MODEL"], metaFilters=[{}], userT=[true], limit=[50], offset=[0]);',
		)
			.then(({ pixelReturn }) => {
				const output = pixelReturn[0]?.output;
				if (Array.isArray(output)) {
					setModels(
						output.map((e) => ({
							id: e.database_id,
							name: e.database_name,
						})),
					);
				}
			})
			.catch(() => {});
	}, []);

	// Fetch MCP / function engines
	useEffect(() => {
		runPixel<[{ database_id: string; database_name: string }[]]>(
			'MyEngines(engineTypes=["FUNCTION"], metaFilters=[{}], userT=[true], limit=[50], offset=[0]);',
		)
			.then(({ pixelReturn }) => {
				const output = pixelReturn[0]?.output;
				if (Array.isArray(output)) {
					setToolEngines(
						output.map((e) => ({
							id: e.database_id,
							name: e.database_name,
						})),
					);
				}
			})
			.catch(() => {});
	}, []);

	const toggleToolEngine = (engineId: string) => {
		const current = typedConfig.toolEngineIds ?? [];
		const updated = current.includes(engineId)
			? current.filter((id) => id !== engineId)
			: [...current, engineId];
		onChange({ toolEngineIds: updated });
	};

	return (
		<div className="flex flex-col gap-3">
			{/* Model */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">Model</span>
				<select
					value={typedConfig.modelId ?? ""}
					onChange={(e) => onChange({ modelId: e.target.value })}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="">Select a model...</option>
					{models.map((m) => (
						<option key={m.id} value={m.id}>
							{m.name}
						</option>
					))}
				</select>
			</div>

			{/* System prompt */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					System Prompt
				</span>
				<TemplateInput
					value={typedConfig.systemPrompt ?? ""}
					onChange={(v) => onChange({ systemPrompt: v })}
					stepId={stepId}
					placeholder="You are a..."
					multiline
				/>
			</div>

			{/* User prompt */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					User Prompt
				</span>
				<TemplateInput
					value={typedConfig.userPrompt ?? ""}
					onChange={(v) => onChange({ userPrompt: v })}
					stepId={stepId}
					placeholder="Find and summarize..."
					multiline
				/>
			</div>

			{/* Tool engines (multi-select) */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Tools (MCP Engines)
				</span>
				<div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border border-gray-300 p-2">
					{toolEngines.length === 0 && (
						<span className="text-gray-400 text-xs">
							No function engines available
						</span>
					)}
					{toolEngines.map((engine) => (
						<label
							key={engine.id}
							className="flex cursor-pointer items-center gap-2 rounded px-1 text-sm hover:bg-gray-50"
						>
							<input
								type="checkbox"
								checked={
									typedConfig.toolEngineIds?.includes(
										engine.id,
									) ?? false
								}
								onChange={() => toggleToolEngine(engine.id)}
								className="rounded"
							/>
							{engine.name}
						</label>
					))}
				</div>
			</div>

			{/* Max iterations */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Max Iterations
				</span>
				<input
					type="range"
					min={1}
					max={20}
					value={typedConfig.maxIterations ?? 10}
					onChange={(e) =>
						onChange({
							maxIterations: Number.parseInt(e.target.value, 10),
						})
					}
					className="w-full"
				/>
				<span className="text-right text-[10px] text-gray-400">
					{typedConfig.maxIterations ?? 10}
				</span>
			</div>
		</div>
	);
}
