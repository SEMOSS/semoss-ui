import { ChevronDownIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
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
	Switch,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type { EffortLevel } from "@/stores/workbench";

const DEFAULT_MAX_TURNS = 30;
const EFFORT_LEVELS: EffortLevel[] = ["auto", "low", "medium", "high", "max"];
const EFFORT_LEVEL_SET = new Set<string>(EFFORT_LEVELS);

const PERMISSION_MODE_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "default", label: "Default" },
	{ value: "acceptEdits", label: "Accept Edits" },
	{ value: "bypassPermissions", label: "Bypass Permissions" },
];

/** Shape of the `GetModelMetadata` pixel response the settings view reads. */
interface WorkbenchModelMetadata {
	/** Reasoning capabilities reported for the selected model */
	reasoningConfig?: {
		/** Effort the model defaults to when none is chosen */
		default_effort?: string | null;

		/** Effort levels the model supports */
		supported_efforts?: string[] | null;
	};
}

/**
 * Uppercase the first character of a value ("auto" → "Auto").
 *
 * @name capitalize
 * @param value - The string to capitalize.
 * @return The value with its first character uppercased.
 */
const capitalize = (value: string): string =>
	value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Chat settings view: model picker, reasoning effort, thinking toggle,
 * conversation compaction, and advanced controls (permission mode, max
 * turns). Effort options come from the selected model's metadata when
 * available, and the compact action is disabled while a run is active.
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
	const thinkingEnabled = useWorkbench((state) => state.chat.thinkingEnabled);
	const setModel = useWorkbench((state) => state.chat.setModel);
	const setMaxTurns = useWorkbench((state) => state.chat.setMaxTurns);
	const setPermissionMode = useWorkbench(
		(state) => state.chat.setPermissionMode,
	);
	const setEffort = useWorkbench((state) => state.chat.setEffort);
	const setThinking = useWorkbench((state) => state.chat.setThinking);

	const fieldId = useId();
	const thinkingId = `${fieldId}-thinking`;
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

	const metadata = usePixel<WorkbenchModelMetadata>(
		model?.engine_id
			? `GetModelMetadata(engine=[${JSON.stringify(model.engine_id)}]);`
			: "",
	);
	const effortOptions = useMemo(() => {
		const configured = (
			metadata.data?.reasoningConfig?.supported_efforts ?? []
		).filter((level): level is EffortLevel => EFFORT_LEVEL_SET.has(level));
		const efforts = configured.length ? configured : EFFORT_LEVELS;
		return Array.from(new Set<EffortLevel>(["auto", ...efforts]));
	}, [metadata.data?.reasoningConfig]);

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

				<Field>
					<FieldLabel>Effort</FieldLabel>
					<Select
						value={effort}
						onValueChange={(value) =>
							setEffort(value as EffortLevel)
						}
					>
						<SelectTrigger className="w-full" size="sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{effortOptions.map((level) => (
								<SelectItem key={level} value={level}>
									{capitalize(level)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FieldDescription className="text-xs">
						Reasoning depth the model spends per turn.
					</FieldDescription>
				</Field>

				<Field orientation="horizontal">
					<div>
						<FieldLabel htmlFor={thinkingId}>Thinking</FieldLabel>
						<FieldDescription className="text-xs">
							Stream the model&apos;s thinking blocks
						</FieldDescription>
					</div>
					<Switch
						id={thinkingId}
						checked={thinkingEnabled}
						onCheckedChange={setThinking}
					/>
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
								Permission mode and run limits.
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
								<FieldLabel>Permission mode</FieldLabel>
								<Select
									value={permissionMode}
									onValueChange={setPermissionMode}
								>
									<SelectTrigger className="w-full" size="sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
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
									How the agent asks before acting on tools.
								</FieldDescription>
							</Field>

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
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
		</ScrollArea>
	);
};
