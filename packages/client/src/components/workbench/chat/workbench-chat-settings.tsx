import { ChevronDownIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { EngineSelect } from "@semoss/shared";
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
	WorkbenchChatEffort,
	WorkbenchChatPermissionMode,
} from "@/stores/workbench";

const DEFAULT_MAX_TURNS = 30;

/** Sentinel Select value for "unset — defer to the harness/model default". */
const INHERIT = "inherit";

/** Permission modes the semoss harness accepts, with display labels. */
const PERMISSION_MODE_OPTIONS: {
	value: WorkbenchChatPermissionMode;
	label: string;
}[] = [
	{ value: "default", label: "Ask before edits" },
	{ value: "acceptEdits", label: "Accept edits" },
	{ value: "plan", label: "Plan first" },
	{ value: "bypassPermissions", label: "Bypass permissions" },
];

/** Reasoning-effort levels, with display labels. */
const EFFORT_OPTIONS: { value: WorkbenchChatEffort; label: string }[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
	{ value: "max", label: "Max" },
];

/**
 * Chat settings view: model picker, conversation compaction, and advanced
 * controls (max turns). The compact action is disabled while a run is active.
 *
 * @name WorkbenchChatSettings
 * @return The scrollable chat settings view.
 */
export const WorkbenchChatSettings = () => {
	const model = useWorkbench((state) => state.chat.model);
	const roomId = useWorkbench((state) => state.chat.roomId);
	const activeRunId = useWorkbench((state) => state.chat.activeRunId);
	const compact = useWorkbench((state) => state.chat.compact);
	const maxTurns = useWorkbench((state) => state.chat.maxTurns);
	const permissionMode = useWorkbench((state) => state.chat.permissionMode);
	const effort = useWorkbench((state) => state.chat.effort);
	const thinking = useWorkbench((state) => state.chat.thinking);
	const setModel = useWorkbench((state) => state.chat.setModel);
	const setMaxTurns = useWorkbench((state) => state.chat.setMaxTurns);
	const setPermissionMode = useWorkbench(
		(state) => state.chat.setPermissionMode,
	);
	const setEffort = useWorkbench((state) => state.chat.setEffort);
	const setThinking = useWorkbench((state) => state.chat.setThinking);

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

	return (
		<ScrollArea className="min-h-0 flex-1">
			<div className="flex flex-col gap-4 p-3">
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
					<FieldDescription className="text-xs">
						Model used for every agent run in this room.
					</FieldDescription>
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
								Run limits and agent behavior.
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
									Maximum agent turns per run (default{" "}
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
												: (value as WorkbenchChatPermissionMode),
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
									How the agent handles gated tool calls:
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
												: (value as WorkbenchChatEffort),
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
