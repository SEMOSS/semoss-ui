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
	FunctionEngineConfig,
} from "../../automation.types";
import { BoundInput, EngineSelect } from "./shared";

export interface FunctionEngineFormProps {
	/** Current node config */
	config: FunctionEngineConfig;
	/** Function engines the user has access to */
	engines: EngineOption[];
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: FunctionEngineConfig) => void;
}

export function FunctionEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: FunctionEngineFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Function Engine"
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
							operation: v as FunctionEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="execute">Execute</SelectItem>
						<SelectItem value="streaming">Streaming</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Parameters (JSON)"
				value={config.params}
				placeholder='{"input": "${files}"}'
				onChange={(v) => onChange({ ...config, params: v })}
				upstreamVars={upstreamVars}
				mono
			/>
		</div>
	);
}
