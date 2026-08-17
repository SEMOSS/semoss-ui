import type { ReactNode } from "react";
import type {
	AutomationNode,
	AutomationNodeForType,
	AutomationNodeType,
	NodeConfigByType,
} from "../../domain/automation.types";
import { isAutomationNodeType } from "../../domain/automation.types";
import { AppEngineForm } from "./forms/app-engine-form";
import { DatabaseEngineForm } from "./forms/database-engine-form";
import { FunctionEngineForm } from "./forms/function-engine-form";
import { GeneratePythonStep } from "./forms/generate-python-step";
import { ModelEngineForm } from "./forms/model-engine-form";
import { PillInput } from "./forms/pill-input";
import { PythonStepForm } from "./forms/python-step-form";
import { StorageEngineForm } from "./forms/storage-engine-form";
import { VectorEngineForm } from "./forms/vector-engine-form";

interface StepFormProps {
	step: AutomationNode;
	upstreamVars: string[];
	onUpdate: (step: AutomationNode) => void;
	playgroundFillable: string[];
	onPlaygroundFieldsChange: (fields: string[]) => void;
	devMode?: boolean;
	appId?: string;
}

interface StepFormContentProps<
	T extends Exclude<AutomationNodeType, "trigger">,
> {
	appId: string;
	children: ReactNode;
	onUpdate: (step: AutomationNode) => void;
	step: AutomationNodeForType<T>;
}

function StepFormContent<T extends Exclude<AutomationNodeType, "trigger">>({
	appId,
	children,
	onUpdate,
	step,
}: StepFormContentProps<T>) {
	return (
		<div className="space-y-4">
			{children}
			<GeneratePythonStep
				projectId={appId}
				step={step}
				onChange={(config: NodeConfigByType[T]) =>
					onUpdate({ ...step, config })
				}
			/>
		</div>
	);
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

	if (isAutomationNodeType(step, "trigger")) return null;

	if (isAutomationNodeType(step, "database-engine")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<DatabaseEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "model-engine")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<ModelEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "vector-engine")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<VectorEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
					devMode={devMode}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "storage-engine")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<StorageEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "function-engine")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<FunctionEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
					playgroundFillable={playgroundFillable}
					onPlaygroundFieldsChange={onPlaygroundFieldsChange}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "app")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<AppEngineForm
					config={step.config}
					upstreamVars={upstreamVars}
					onChange={update}
					currentAppId={appId}
					devMode={devMode}
				/>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "wait")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<div className="flex flex-col gap-4">
					<PillInput
						label="Seconds to Wait"
						value={step.config.seconds}
						placeholder="30"
						onChange={(seconds) =>
							update({ ...step.config, seconds })
						}
						upstreamVars={upstreamVars}
					/>
					<p className="text-muted-foreground text-xs">
						Maximum 3600 seconds (1 hour). You can reference an
						earlier step's output — see Help for details.
					</p>
				</div>
			</StepFormContent>
		);
	}

	if (isAutomationNodeType(step, "python-step")) {
		return (
			<StepFormContent appId={appId} step={step} onUpdate={onUpdate}>
				<PythonStepForm config={step.config} onChange={update} />
			</StepFormContent>
		);
	}

	return (
		<div className="text-muted-foreground text-xs">
			No form for type: {step.type}
		</div>
	);
}
