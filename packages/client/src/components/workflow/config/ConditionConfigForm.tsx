import type { ConditionConfig, ConditionOperator } from "@/types/workflow";
import { CONDITION_OPERATORS } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface ConditionConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

export function ConditionConfigForm({
	config,
	stepId,
	onChange,
}: ConditionConfigFormProps) {
	const typedConfig = config as unknown as ConditionConfig;

	return (
		<div className="flex flex-col gap-3">
			{/* Left operand */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Left Value
				</span>
				<TemplateInput
					value={
						typeof typedConfig.left === "string"
							? typedConfig.left
							: String(typedConfig.left ?? "")
					}
					onChange={(v) => onChange({ left: v })}
					stepId={stepId}
					placeholder="{{step-id.output}}"
				/>
			</div>

			{/* Operator */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Operator
				</span>
				<select
					value={typedConfig.operator ?? "=="}
					onChange={(e) =>
						onChange({
							operator: e.target.value as ConditionOperator,
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					{CONDITION_OPERATORS.map((op) => (
						<option key={op.value} value={op.value}>
							{op.label}
						</option>
					))}
				</select>
			</div>

			{/* Right operand */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Right Value
				</span>
				<TemplateInput
					value={
						typeof typedConfig.right === "string"
							? typedConfig.right
							: String(typedConfig.right ?? "")
					}
					onChange={(v) => onChange({ right: v })}
					stepId={stepId}
					placeholder="100"
				/>
			</div>

			<div className="rounded-md border border-orange-200 bg-orange-50 p-2 text-[11px] text-orange-700">
				CONDITION steps use <strong>ifTrue</strong> and{" "}
				<strong>ifFalse</strong> edges instead of the normal{" "}
				<strong>next</strong> edge. Connect the green handle (True) and
				red handle (False) to different steps.
			</div>
		</div>
	);
}
