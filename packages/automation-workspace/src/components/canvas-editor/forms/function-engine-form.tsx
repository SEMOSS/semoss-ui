import type { FunctionEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

export interface FunctionEngineFormProps {
	/** Current node config */
	config: FunctionEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: FunctionEngineConfig) => void;
}

export function FunctionEngineForm({
	config,
	upstreamVars,
	onChange,
}: FunctionEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Function Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["FUNCTION"]}
				required
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
			/>
			<BoundInput
				label="Input Parameters"
				required
				value={config.params}
				placeholder='{"input": "${files}"}'
				onChange={(v) => onChange({ ...config, params: v })}
				upstreamVars={upstreamVars}
				mono
			/>
		</div>
	);
}
