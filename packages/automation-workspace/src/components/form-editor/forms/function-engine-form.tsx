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
import type { FunctionEngineConfig } from "../../../domain/automation.types";
import { getPlaygroundParamDescription } from "../../../domain/automation-utils";
import { BoundInput, EnginePickerField } from "./shared";

export interface FunctionEngineFormProps {
	/** Current node config */
	config: FunctionEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: FunctionEngineConfig) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
}

export function FunctionEngineForm({
	config,
	upstreamVars,
	onChange,
	playgroundFillable,
	onPlaygroundFieldsChange,
}: FunctionEngineFormProps) {
	const pgFillId = useId();
	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Function Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["FUNCTION"]}
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
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
				label="Input Parameters"
				value={config.params}
				placeholder='{"input": "${files}"}'
				onChange={(v) => onChange({ ...config, params: v })}
				upstreamVars={upstreamVars}
				mono
			/>
			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					id={pgFillId}
					checked={playgroundFillable.includes("params")}
					onChange={(e) => {
						const next = e.target.checked
							? [...playgroundFillable, "params"]
							: playgroundFillable.filter((f) => f !== "params");
						onPlaygroundFieldsChange(next);
					}}
					className="h-3.5 w-3.5 cursor-pointer accent-primary"
				/>
				<label
					htmlFor={pgFillId}
					className="cursor-pointer text-muted-foreground text-xs"
					title={getPlaygroundParamDescription(
						"function-engine",
						"params",
					)}
				>
					Let Playground fill this field
				</label>
			</div>
			{playgroundFillable.includes("params") && config.params && (
				<p className="text-amber-600 text-xs dark:text-amber-400">
					Current value will be overwritten if Playground provides
					input
				</p>
			)}
		</div>
	);
}
