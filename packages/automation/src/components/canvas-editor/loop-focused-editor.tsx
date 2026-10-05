import {
	ArrowLeft,
	Loader2,
	Play,
	Repeat2,
	Save,
	Settings2,
} from "lucide-react";
import { Button } from "@semoss/ui/next";
import type {
	AutomationNode,
	AutomationNodeBody,
	LoopConfig,
} from "../../domain/automation.types";
import { LoopBodyCanvas } from "./loop-body-canvas";
import { getLoopContextVariables } from "./loop-scope";

interface LoopFocusedEditorProps {
	loop: AutomationNode;
	selectedNodeId?: string;
	readOnly: boolean;
	saving: boolean;
	running: boolean;
	onBack: () => void;
	onSave: () => void;
	onRun: () => void;
	onConfigureLoop: () => void;
	onBodyChange: (body: AutomationNodeBody) => void;
	onNodeSelect: (nodeId: string) => void;
}

function loopInputLabel(config: LoopConfig): string {
	if (config.mode === "repeat") {
		return `${config.count} pass${config.count === 1 ? "" : "es"}`;
	}
	if (config.mode === "while") return "While the condition is true";
	return config.items || "Choose a collection";
}

/** Full-canvas editor for the graph executed during each loop pass. */
export function LoopFocusedEditor({
	loop,
	selectedNodeId,
	readOnly,
	saving,
	running,
	onBack,
	onSave,
	onRun,
	onConfigureLoop,
	onBodyChange,
	onNodeSelect,
}: LoopFocusedEditorProps) {
	const body = loop.body ?? { nodes: [], edges: [] };
	const config = loop.config as LoopConfig;
	const contextVariables = getLoopContextVariables(
		config,
		loop.outputVar,
		body.nodes,
	);
	const primaryContext =
		contextVariables.find((variable) => variable.name.endsWith(".item")) ??
		contextVariables[0];

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<header className="flex min-h-16 items-center gap-3 border-b px-4 py-3">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onBack}
					aria-label="Return to the automation canvas"
				>
					<ArrowLeft className="size-4" aria-hidden />
					Automation
				</Button>
				<span className="text-muted-foreground" aria-hidden>
					/
				</span>
				<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<Repeat2 className="size-4" aria-hidden />
				</span>
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-semibold text-sm">
						{loop.label || "Repeat steps"}
					</h2>
					<p className="truncate text-muted-foreground text-xs">
						{loopInputLabel(config)} · {body.nodes.length} repeated
						step{body.nodes.length === 1 ? "" : "s"}
					</p>
				</div>
				{primaryContext && (
					<div className="hidden items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 lg:flex">
						<span className="text-muted-foreground text-xs">
							{primaryContext.label}
						</span>
						<code className="text-xs">{`\${${primaryContext.name}}`}</code>
					</div>
				)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onConfigureLoop}
				>
					<Settings2 className="size-4" aria-hidden />
					Loop settings
				</Button>
				{!readOnly && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onSave}
						disabled={saving}
					>
						{saving ? (
							<Loader2
								className="size-4 animate-spin"
								aria-hidden
							/>
						) : (
							<Save className="size-4" aria-hidden />
						)}
						Save
					</Button>
				)}
				<Button
					type="button"
					size="sm"
					onClick={onRun}
					disabled={running || readOnly}
				>
					{running ? (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					) : (
						<Play className="size-4" aria-hidden />
					)}
					Run
				</Button>
			</header>

			<div className="min-h-0 flex-1 p-3">
				<LoopBodyCanvas
					body={body}
					loopOutputVar={loop.outputVar}
					selectedNodeId={selectedNodeId}
					readOnly={readOnly}
					className="h-full rounded-xl"
					onBodyChange={onBodyChange}
					onNodeSelect={onNodeSelect}
				/>
			</div>

			<footer className="flex min-h-12 items-center gap-2 overflow-x-auto border-t bg-muted/20 px-4 py-2">
				<span className="shrink-0 font-medium text-xs">
					Available in every repeated step:
				</span>
				{contextVariables.map((variable) => (
					<span
						key={variable.name}
						className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs"
						title={`${variable.label}: \${${variable.name}}`}
					>
						{variable.label}
					</span>
				))}
			</footer>
		</div>
	);
}
