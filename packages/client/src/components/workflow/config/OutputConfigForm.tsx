import type { OutputConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface OutputConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

export function OutputConfigForm({
	config,
	stepId,
	onChange,
}: OutputConfigFormProps) {
	const typedConfig = config as unknown as OutputConfig;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Output Value
				</span>
				<TemplateInput
					value={typedConfig.value ?? ""}
					onChange={(v) => onChange({ value: v })}
					stepId={stepId}
					placeholder="{{previous-step.output}}"
					multiline
				/>
				<span className="text-[10px] text-gray-400">
					This value becomes the workflow's final output. Typically
					references the last meaningful step's output.
				</span>
			</div>
		</div>
	);
}
