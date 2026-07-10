import type {
	EngineOption,
	ProjectOption,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { AppStepForm } from "./forms/app-form";
import { ConditionalStepForm } from "./forms/conditional-form";
import { CustomPixelStepForm } from "./forms/custom-pixel-form";
import { DatabaseStepForm } from "./forms/database-form";
import { ForEachStepForm } from "./forms/for-each-form";
import { FunctionStepForm } from "./forms/function-form";
import { ModelStepForm } from "./forms/model-form";
import { StorageStepForm } from "./forms/storage-form";
import { SubWorkflowStepForm } from "./forms/sub-workflow-form";
import { TransformStepForm } from "./forms/transform-form";
import { VectorStepForm } from "./forms/vector-form";

interface StepFormProps {
	step: WorkflowNode;
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function StepForm({
	step,
	enginesByType,
	projects,
	upstreamVars,
	onUpdate,
}: StepFormProps) {
	switch (step.type as string) {
		case "database-engine":
			return (
				<DatabaseStepForm
					step={step}
					engines={enginesByType.DATABASE ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "model-engine":
			return (
				<ModelStepForm
					step={step}
					engines={enginesByType.MODEL ?? []}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "vector-engine":
			return (
				<VectorStepForm
					step={step}
					engines={enginesByType.VECTOR ?? []}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "storage-engine":
			return (
				<StorageStepForm
					step={step}
					engines={enginesByType.STORAGE ?? []}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "function-engine":
			return (
				<FunctionStepForm
					step={step}
					engines={enginesByType.FUNCTION ?? []}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "app":
			return (
				<AppStepForm
					step={step}
					projects={projects}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "custom-pixel":
			return (
				<CustomPixelStepForm
					step={step}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "transform":
			return (
				<TransformStepForm
					step={step}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "for-each":
			return (
				<ForEachStepForm
					step={step}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "sub-workflow":
			return (
				<SubWorkflowStepForm
					step={step}
					projects={projects}
					onUpdate={onUpdate}
					upstreamVars={upstreamVars}
				/>
			);
		case "conditional":
			return (
				<ConditionalStepForm
					step={step}
					enginesByType={enginesByType}
					projects={projects}
					upstreamVars={upstreamVars}
					onUpdate={onUpdate}
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
