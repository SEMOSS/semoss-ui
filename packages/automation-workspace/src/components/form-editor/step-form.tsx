import type {
	AppConfig,
	AutomationNode,
	DatabaseEngineConfig,
	EngineOption,
	FunctionEngineConfig,
	ModelEngineConfig,
	ProjectOption,
	StorageEngineConfig,
	VectorEngineConfig,
	WaitConfig,
} from "../../domain/automation.types";
import { AppEngineForm } from "./forms/app-engine-form";
import { DatabaseEngineForm } from "./forms/database-engine-form";
import { FunctionEngineForm } from "./forms/function-engine-form";
import { ModelEngineForm } from "./forms/model-engine-form";
import { StorageEngineForm } from "./forms/storage-engine-form";
import { VectorEngineForm } from "./forms/vector-engine-form";
import { WaitForm } from "./forms/wait-form";

interface StepFormProps {
	step: AutomationNode;
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	upstreamVars: string[];
	onUpdate: (step: AutomationNode) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
}

export function StepForm({
	step,
	enginesByType,
	projects,
	upstreamVars,
	onUpdate,
	playgroundFillable,
	onPlaygroundFieldsChange,
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
					engines={enginesByType.DATABASE ?? []}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
				/>
			);
		case "model-engine":
			return (
				<ModelEngineForm
					config={step.config as ModelEngineConfig}
					engines={enginesByType.MODEL ?? []}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
				/>
			);
		case "vector-engine":
			return (
				<VectorEngineForm
					config={step.config as VectorEngineConfig}
					engines={enginesByType.VECTOR ?? []}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
				/>
			);
		case "storage-engine":
			return (
				<StorageEngineForm
					config={step.config as StorageEngineConfig}
					engines={enginesByType.STORAGE ?? []}
					upstreamVars={upstreamVars}
					onChange={update}
				/>
			);
		case "function-engine":
			return (
				<FunctionEngineForm
					config={step.config as FunctionEngineConfig}
					engines={enginesByType.FUNCTION ?? []}
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
					projects={projects}
					upstreamVars={upstreamVars}
					onChange={update}
				/>
			);
		case "wait":
			return (
				<WaitForm
					config={step.config as WaitConfig}
					upstreamVars={upstreamVars}
					onChange={update}
				/>
			);
		default:
			return (
				<div className="text-muted-foreground text-xs">
					No form for type: {step.type}
				</div>
			);
	}
}
