import { ChevronDownIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { EngineSelect, ProjectSelect } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
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
	z,
} from "@semoss/ui/next";
import { agentResourcesQuery } from "@/api/assistant-tools";
import { AssistantSettingSkills } from "@/features/assistant-tools/assistant-setting-skills";
import { AssistantSettingTools } from "@/features/assistant-tools/assistant-setting-tools";
import { useAssistant } from "@/hooks/use-assistant";
import type {
	AssistantEffort,
	AssistantPermissionMode,
} from "@/stores/assistant/assistant.store";

const DEFAULT_MAX_TURNS = 30;

/** Sentinel Select value for "unset — defer to the harness/model default". */
const INHERIT = "inherit";

/** Permission modes the semoss harness accepts, with display labels. */
const PERMISSION_MODE_OPTIONS: {
	value: AssistantPermissionMode;
	label: string;
}[] = [
	{ value: "default", label: "Ask before edits" },
	{ value: "acceptEdits", label: "Accept edits" },
	{ value: "plan", label: "Plan first" },
	{ value: "bypassPermissions", label: "Do not ask for approval" },
];

/** Reasoning-effort levels, with display labels. */
const EFFORT_OPTIONS: { value: AssistantEffort; label: string }[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
	{ value: "max", label: "Max" },
];

const agentResourcesSchema = z.object({
	mcp: z
		.array(
			z.object({
				id: z.string(),
				name: z.string().nullish(),
				display_name: z.string().nullish(),
			}),
		)
		.nullish(),
	skills: z
		.array(z.object({ id: z.string(), name: z.string().nullish() }))
		.nullish(),
});

/**
 * Assistant settings view: model picker, conversation compaction, and advanced
 * controls (max turns). The compact action is disabled while a run is active.
 *
 * @name AssistantSettings
 * @return The scrollable assistant settings view.
 */
export const AssistantSettings = () => {
	const model = useAssistant((state) => state.model);
	const agent = useAssistant((state) => state.agent);
	const defaultAgent = useAssistant((state) => state.defaultAgent);
	const roomId = useAssistant((state) => state.roomId);
	const activeRunId = useAssistant((state) => state.activeRunId);
	const compact = useAssistant((state) => state.compact);
	const maxTurns = useAssistant((state) => state.maxTurns);
	const permissionMode = useAssistant((state) => state.permissionMode);
	const effort = useAssistant((state) => state.effort);
	const thinking = useAssistant((state) => state.thinking);
	const setModel = useAssistant((state) => state.setModel);
	const setAgent = useAssistant((state) => state.setAgent);
	const setMaxTurns = useAssistant((state) => state.setMaxTurns);
	const setPermissionMode = useAssistant((state) => state.setPermissionMode);
	const setEffort = useAssistant((state) => state.setEffort);
	const setThinking = useAssistant((state) => state.setThinking);

	const fieldId = useId();
	const agentId = `${fieldId}-agent`;
	const agentDescriptionId = `${fieldId}-agent-description`;
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
	const selectedAgent = agent ?? defaultAgent;
	const agentName = selectedAgent.name || selectedAgent.workspace_id;
	const insightId = useAssistant((state) => state.insightId);
	const workspace = usePixel<unknown>(
		insightId ? agentResourcesQuery(selectedAgent.workspace_id) : "",
		{ data: null },
		insightId ?? undefined,
	);
	const resources =
		workspace.status === "SUCCESS"
			? agentResourcesSchema.safeParse(workspace.data)
			: null;

	return (
		<ScrollArea className="[&_[data-slot=scroll-area-viewport]>div]:block! min-h-0 flex-1">
			<div className="flex min-w-0 flex-col gap-4 p-3">
				<Field>
					<div className="flex min-h-7 items-center justify-between gap-2">
						<FieldLabel htmlFor={agentId}>Agent</FieldLabel>
						{agent && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
								onClick={() => setAgent(null)}
							>
								Use default
							</Button>
						)}
					</div>
					<ProjectSelect
						id={agentId}
						aria-describedby={agentDescriptionId}
						className="h-9 shadow-xs"
						name={agentName}
						value={selectedAgent.workspace_id}
						projectTypes={["WORKSPACE"]}
						onChange={(nextAgent) =>
							setAgent({
								workspace_id: nextAgent.project_id,
								name:
									nextAgent.project_display_name ||
									nextAgent.project_name,
							})
						}
						popoverContentProps={{ align: "start" }}
					/>
				</Field>

				<Field>
					<FieldLabel>Model</FieldLabel>
					<EngineSelect
						className="h-9 w-full max-w-none justify-start border border-input px-3 shadow-xs"
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

				{insightId &&
					(workspace.status === "INITIAL" ||
						workspace.status === "LOADING") && (
						<output className="text-muted-foreground text-xs">
							Loading agent tools and skills…
						</output>
					)}
				{(workspace.status === "ERROR" ||
					resources?.success === false) && (
					<Alert variant="destructive">
						<AlertDescription>
							{workspace.error?.message ||
								"Unable to load this agent’s tools and skills."}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={workspace.refresh}
							>
								Retry agent resources
							</Button>
						</AlertDescription>
					</Alert>
				)}
				<AssistantSettingTools
					key={`tools:${roomId}`}
					agentName={agentName}
					agentTools={(resources?.data?.mcp ?? []).map((tool) => ({
						id: tool.id,
						name: tool.display_name || tool.name || tool.id,
					}))}
				/>
				<AssistantSettingSkills
					key={`skills:${roomId}`}
					agentName={agentName}
					agentSkills={(resources?.data?.skills ?? []).map(
						(skill) => ({
							id: skill.id,
							name: skill.name || skill.id,
						}),
					)}
				/>

				<Field>
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
						Summarize conversation
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
									Maximum steps per request
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
												: (value as AssistantPermissionMode),
										)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={INHERIT}>
											Use workspace default
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
								{permissionMode === "bypassPermissions" && (
									<Alert className="border-warning/40 bg-warning/10 text-warning">
										<TriangleAlertIcon className="size-4" />
										<AlertDescription className="text-warning/90">
											The assistant can make changes
											without asking first. Only use this
											if you trust every action it might
											take.
										</AlertDescription>
									</Alert>
								)}
							</Field>

							<Field>
								<FieldLabel>Reasoning effort</FieldLabel>
								<Select
									value={effort ?? INHERIT}
									onValueChange={(value) =>
										setEffort(
											value === INHERIT
												? null
												: (value as AssistantEffort),
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
