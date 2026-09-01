import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { EngineSelect, ProjectSelect } from "@semoss/shared";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type {
	WorkbenchAssistantEffort,
	WorkbenchAssistantPermissionMode,
} from "@/stores/workbench";

const DEFAULT_MAX_TURNS = 30;

/** Sentinel Select value for "unset — defer to the harness/model default". */
const INHERIT = "inherit";

/** Permission modes the semoss harness accepts, with display labels. */
const PERMISSION_MODE_OPTIONS: {
	value: WorkbenchAssistantPermissionMode;
	label: string;
}[] = [
	{ value: "default", label: "Ask before edits" },
	{ value: "acceptEdits", label: "Accept edits" },
	{ value: "plan", label: "Plan first" },
	{ value: "bypassPermissions", label: "Bypass permissions" },
];

/** Reasoning-effort levels, with display labels. */
const EFFORT_OPTIONS: { value: WorkbenchAssistantEffort; label: string }[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
	{ value: "max", label: "Max" },
];

/**
 * Assistant settings view: model picker, conversation compaction, and advanced
 * controls (max turns). The compact action is disabled while a run is active.
 *
 * @name WorkbenchAssistantSettings
 * @return The scrollable assistant settings view.
 */
export const WorkbenchAssistantSettings = () => {
	const model = useWorkbench((state) => state.assistant.model);
	const agent = useWorkbench((state) => state.assistant.agent);
	const roomId = useWorkbench((state) => state.assistant.roomId);
	const activeRunId = useWorkbench((state) => state.assistant.activeRunId);
	const compact = useWorkbench((state) => state.assistant.compact);
	const maxTurns = useWorkbench((state) => state.assistant.maxTurns);
	const permissionMode = useWorkbench(
		(state) => state.assistant.permissionMode,
	);
	const effort = useWorkbench((state) => state.assistant.effort);
	const thinking = useWorkbench((state) => state.assistant.thinking);
	const setModel = useWorkbench((state) => state.assistant.setModel);
	const setAgent = useWorkbench((state) => state.assistant.setAgent);
	const setMaxTurns = useWorkbench((state) => state.assistant.setMaxTurns);
	const setPermissionMode = useWorkbench(
		(state) => state.assistant.setPermissionMode,
	);
	const setEffort = useWorkbench((state) => state.assistant.setEffort);
	const setThinking = useWorkbench((state) => state.assistant.setThinking);

	const fieldId = useId();
	const maxTurnsId = `${fieldId}-max-turns`;
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [isCompacting, setIsCompacting] = useState(false);
	// Local draft so the field can be cleared/typed freely; committed (and
	// sanitized) to the store on blur.
	const [maxTurnsDraft, setMaxTurnsDraft] = useState(String(maxTurns));

	// Keep the draft aligned when the store value changes from elsewhere.
	useEffect(() => {
		setMaxTurnsDraft(String(maxTurns));
	}, [maxTurns]);

	const commitMaxTurns = () => {
		const parsed = Number(maxTurnsDraft);
		const next =
			Number.isFinite(parsed) && parsed > 0
				? Math.floor(parsed)
				: DEFAULT_MAX_TURNS;
		setMaxTurns(next);
		setMaxTurnsDraft(String(next));
	};

	const modelName =
		model?.engine_display_name || model?.engine_name || "Select model";
	const agentName = agent?.name || "App Builder (default)";

	return (
		<ScrollArea className="min-h-0 flex-1">
			<div className="flex flex-col gap-4 p-3">
				<Field>
					<FieldLabel>Assistant Model</FieldLabel>
					<EngineSelect
						name={modelName}
						value={model?.engine_id || ""}
						engineTypes={["MODEL"]}
						metaFilters={[{ tag: "text-generation" }]}
						onChange={(nextModel) => setModel(nextModel)}
						popoverContentProps={{
							align: "start",
							className: "w-72 max-w-72",
						}}
					/>
				</Field>

				<Field>
					<div className="flex justify-between">
						<FieldLabel>Assistant Agent</FieldLabel>
						<Link to="/agent/new">
							<PlusIcon className="size-4" />
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<ProjectSelect
							name={agentName}
							value={agent?.workspace_id || ""}
							projectTypes={["WORKSPACE"]}
							onChange={(nextAgent) =>
								setAgent({
									workspace_id: nextAgent.project_id,
									name:
										nextAgent.project_display_name ||
										nextAgent.project_name,
								})
							}
							popoverContentProps={{
								align: "start",
								className: "w-72 max-w-72",
							}}
						/>
						{agent ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setAgent(null)}
							>
								Use default
							</Button>
						) : null}
					</div>
				</Field>

				<Field orientation="horizontal">
					<div>
						<FieldLabel>Context</FieldLabel>
						<FieldDescription className="text-xs">
							Prune tools or summarize older messages to reduce
							this conversation&apos;s active context.
						</FieldDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={
							!roomId || Boolean(activeRunId) || isCompacting
						}
						onClick={() => {
							setIsCompacting(true);
							void compact().finally(() =>
								setIsCompacting(false),
							);
						}}
					>
						{isCompacting ? <Spinner className="size-3.5" /> : null}
						Compact
					</Button>
				</Field>

				<Separator />

				<Collapsible
					open={isAdvancedOpen}
					onOpenChange={setIsAdvancedOpen}
				>
					<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
						<div>
							<p className="font-medium text-sm">Advanced</p>
							<p className="text-muted-foreground text-xs">
								Run limits and assistant behavior.
							</p>
						</div>
						<ChevronDownIcon
							className={cn(
								"size-4 text-muted-foreground transition-transform",
								isAdvancedOpen && "rotate-180",
							)}
						/>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="flex flex-col gap-4 pt-4">
							<Field>
								<FieldLabel htmlFor={maxTurnsId}>
									Max turns
								</FieldLabel>
								<Input
									id={maxTurnsId}
									type="number"
									min={1}
									step={1}
									value={maxTurnsDraft}
									onChange={(event) =>
										setMaxTurnsDraft(event.target.value)
									}
									onBlur={commitMaxTurns}
								/>
								<FieldDescription className="text-xs">
									Maximum assistant turns per run (default{" "}
									{DEFAULT_MAX_TURNS}).
								</FieldDescription>
							</Field>

							<Field>
								<FieldLabel>Permission mode</FieldLabel>
								<Select
									value={permissionMode ?? INHERIT}
									onValueChange={(value) =>
										setPermissionMode(
											value === INHERIT
												? null
												: (value as WorkbenchAssistantPermissionMode),
										)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={INHERIT}>
											Harness default
										</SelectItem>
										{PERMISSION_MODE_OPTIONS.map(
											(option) => (
												<SelectItem
													key={option.value}
													value={option.value}
												>
													{option.label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								<FieldDescription className="text-xs">
									How the assistant handles gated tool calls:
									pause for approval, auto-accept edits, plan
									before acting, or skip the gates entirely.
								</FieldDescription>
							</Field>

							<Field>
								<FieldLabel>Reasoning effort</FieldLabel>
								<Select
									value={effort ?? INHERIT}
									onValueChange={(value) =>
										setEffort(
											value === INHERIT
												? null
												: (value as WorkbenchAssistantEffort),
										)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={INHERIT}>
											Model default
										</SelectItem>
										{EFFORT_OPTIONS.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldDescription className="text-xs">
									How much reasoning the model spends per
									turn, when the model supports it.
								</FieldDescription>
							</Field>

							<Field>
								<FieldLabel>Extended thinking</FieldLabel>
								<Select
									value={
										thinking == null
											? INHERIT
											: thinking
												? "on"
												: "off"
									}
									onValueChange={(value) =>
										setThinking(
											value === INHERIT
												? null
												: value === "on",
										)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={INHERIT}>
											Model default
										</SelectItem>
										<SelectItem value="on">On</SelectItem>
										<SelectItem value="off">Off</SelectItem>
									</SelectContent>
								</Select>
								<FieldDescription className="text-xs">
									Let the model think before responding, when
									the model supports it.
								</FieldDescription>
							</Field>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
		</ScrollArea>
	);
};
