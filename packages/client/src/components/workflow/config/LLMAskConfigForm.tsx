import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import type { LLMAskConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface LLMAskConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

interface EngineOption {
	id: string;
	name: string;
}

export function LLMAskConfigForm({
	config,
	stepId,
	onChange,
}: LLMAskConfigFormProps) {
	const typedConfig = config as unknown as LLMAskConfig;
	const [models, setModels] = useState<EngineOption[]>([]);

	// Fetch available model engines
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
			.catch(() => {
				// silently fail
			});
	}, []);

	return (
		<div className="flex flex-col gap-3">
			{/* Model selector */}
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
					placeholder="Analyze this: {{step-id.output}}"
					multiline
				/>
			</div>

			{/* Temperature */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Temperature
				</span>
				<input
					type="range"
					min={0}
					max={2}
					step={0.1}
					value={typedConfig.paramMap?.temperature ?? 0.7}
					onChange={(e) =>
						onChange({
							paramMap: {
								...typedConfig.paramMap,
								temperature: Number.parseFloat(e.target.value),
							},
						})
					}
					className="w-full"
				/>
				<span className="text-right text-[10px] text-gray-400">
					{typedConfig.paramMap?.temperature ?? 0.7}
				</span>
			</div>

			{/* Max tokens */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Max Tokens
				</span>
				<input
					type="number"
					min={1}
					max={128000}
					value={typedConfig.paramMap?.max_tokens ?? 2000}
					onChange={(e) =>
						onChange({
							paramMap: {
								...typedConfig.paramMap,
								max_tokens: Number.parseInt(e.target.value, 10),
							},
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>
		</div>
	);
}
