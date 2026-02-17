import type { RunPixelConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface RunPixelConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

export function RunPixelConfigForm({
	config,
	stepId,
	onChange,
}: RunPixelConfigFormProps) {
	const typedConfig = config as unknown as RunPixelConfig;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Pixel Recipe
				</span>
				<TemplateInput
					value={typedConfig.recipe ?? ""}
					onChange={(v) => onChange({ recipe: v })}
					stepId={stepId}
					placeholder='Database("db-id") | Select(columns) | Collect(500);'
					multiline
					className="min-h-[120px] font-mono"
				/>
				<span className="text-[10px] text-gray-400">
					Enter a Pixel expression. Use {"{{stepId.output}}"} for
					template references.
				</span>
			</div>
		</div>
	);
}
