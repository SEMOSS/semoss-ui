import type { StaticConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface StaticConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

export function StaticConfigForm({
	config,
	stepId,
	onChange,
}: StaticConfigFormProps) {
	const typedConfig = config as unknown as StaticConfig;
	const value =
		typeof typedConfig.value === "string"
			? typedConfig.value
			: JSON.stringify(typedConfig.value ?? "", null, 2);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">Value</span>
				<TemplateInput
					value={value}
					onChange={(v) => onChange({ value: v })}
					stepId={stepId}
					placeholder="Enter a static value..."
					multiline
				/>
				<span className="text-[10px] text-gray-400">
					Can be a string, number, JSON object, or template expression
				</span>
			</div>
		</div>
	);
}
