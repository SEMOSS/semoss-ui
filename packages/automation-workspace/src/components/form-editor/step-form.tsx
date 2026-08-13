import type {
	AppConfig,
	AutomationNode,
	DatabaseEngineConfig,
	FunctionEngineConfig,
	ModelEngineConfig,
	StorageEngineConfig,
	VectorEngineConfig,
	WaitConfig,
} from "../../domain/automation.types";
import { AppEngineForm } from "./forms/app-engine-form";
import { DatabaseEngineForm } from "./forms/database-engine-form";
import { FunctionEngineForm } from "./forms/function-engine-form";
import { ModelEngineForm } from "./forms/model-engine-form";
import { PillInput } from "./forms/pill-input";
import { StorageEngineForm } from "./forms/storage-engine-form";
import { VectorEngineForm } from "./forms/vector-engine-form";

interface StepFormProps {
	step: AutomationNode;
	upstreamVars: string[];
	onUpdate: (step: AutomationNode) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
	/** When false (business mode), advanced JSON fields are hidden in forms that support it */
	devMode?: boolean;
	/** The automation's own project ID — passed to app node forms for reactor discovery */
	appId?: string;
}

export function StepForm({
	step,
	upstreamVars,
	onUpdate,
	playgroundFillable,
	onPlaygroundFieldsChange,
	devMode = false,
	appId = "",
}: StepFormProps) {
	const update = (config: AutomationNode["config"]) =>
		onUpdate({ ...step, config });

	switch (step.type) {
		case "trigger":
			// Rendered by TriggerStepCard above the steps list — not via this component
			return null;
		case "database-engine":
			return (
				<DatabaseEngineForm
					config={step.config as DatabaseEngineConfig}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			);
		case "model-engine":
			return (
				<ModelEngineForm
					config={step.config as ModelEngineConfig}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			);
		case "vector-engine":
			return (
				<VectorEngineForm
					config={step.config as VectorEngineConfig}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			);
		case "storage-engine":
			return (
				<StorageEngineForm
					config={step.config as StorageEngineConfig}
					upstreamVars={upstreamVars}
					onChange={update}
				/>
			);
		case "function-engine":
			return (
				<FunctionEngineForm
					config={step.config as FunctionEngineConfig}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
				/>
			);
		case "app":
			return (
				<AppEngineForm
					config={step.config as AppConfig}
					upstreamVars={upstreamVars}
					onChange={update}
					currentAppId={appId}
					devMode={devMode}
				/>
			);
		case "wait": {
			const c = step.config as WaitConfig;
			return (
				<div className="flex flex-col gap-4">
					<PillInput
						label="Seconds to Wait"
						value={c.seconds}
						placeholder="30"
						onChange={(v) => update({ ...c, seconds: v })}
						upstreamVars={upstreamVars}
					/>
					<p className="text-muted-foreground text-xs">
						Maximum 3600 seconds (1 hour). You can reference an
						earlier step's output — see Help for details.
					</p>
				</div>
			);
		}
		default:
			return (
				<div className="text-muted-foreground text-xs">
					No form for type: {step.type}
				</div>
			);
	}
}
