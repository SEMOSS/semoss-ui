import { Bot, ChevronDown, PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Form,
	FormField,
	H3,
	H4,
	Slider,
	Textarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { MCPOverlay } from "@/components/mcp/mcp-overlay";
import { RoomToolsDefaultSection } from "@/features/chat-tools/components/room-tools-default-section";
import { RoomToolsToolboxesSection } from "@/features/chat-tools/components/room-tools-toolboxes-section";
import { SectionInfoTooltip } from "@/features/chat-tools/components/section-info-tooltip";
import { RoomSelectedResources } from "@/features/conversation/room-selected-resources";
import { useRoot } from "@/hooks/use-root";
import type { RoomStore } from "@/stores/room/room.store";
import { isRemovableToolbox, splitMcpByType } from "@/utility/mcp-utils";

const instructionsSchema = z.object({ instructions: z.string() });

type InstructionsValues = z.infer<typeof instructionsSchema>;

/** Props for {@link RoomOptionsForm}. */
export interface RoomOptionsFormProps {
	/** The model the room answers with. */
	model: RoomStore["model"];
	/** Told when the user picks another model. */
	onModelChange: (model: RoomStore["model"]) => void;
	/** The room's options: instructions, knowledge, toolboxes, and tools. */
	options: RoomStore["options"];
	/** Told of each change to the options, with only the changed ones. */
	onOptionsChange: (options: Partial<RoomStore["options"]>) => void;
	/** Whether the user can pick the room's agent. */
	agentEditable?: boolean;
	/** Lock every edit while the current turn is in progress. */
	disabled?: boolean;
	/** Agent runs supply their own tools instead of the chat's default tools. */
	isAgentMode?: boolean;
	/**
	 * Settings' Connectors section, the room's own toolbox, listed under
	 * Tools; left out for a new room, whose toolbox is not settled yet.
	 */
	connectorsSection?: ReactNode;
}

/**
 * A room's settings: its agent, model, instructions, knowledge, and every
 * tool the assistant has. Changes apply as they are made.
 */
export const RoomOptionsForm = observer(
	({
		model,
		onModelChange,
		options,
		onOptionsChange,
		agentEditable = false,
		disabled = false,
		isAgentMode = false,
		connectorsSection,
	}: RoomOptionsFormProps) => {
		const { t } = useTranslation(["room", "common", "chatTools"]);
		const { root } = useRoot();
		const id = useId();
		const form = useForm<InstructionsValues>({
			values: { instructions: options.instructions },
			resolver: zodResolver(instructionsSchema),
		});
		const [overlay, setOverlay] = useState<{
			type: "AGENT" | "KNOWLEDGE" | "TOOLBOX";
			isOpen: boolean;
		}>({ type: "KNOWLEDGE", isOpen: false });
		const { knowledge, toolbox: toolboxes } = splitMcpByType(options.mcp);
		// the room's own toolbox shows under Connectors, so only the agent's
		// toolboxes and the ones the user added are listed here
		const agentToolboxes = toolboxes.filter((item) => item.fromWorkspace);
		const addedToolboxes = toolboxes.filter(isRemovableToolbox);
		const handleRemove = (item: (typeof options.mcp)[number]): void => {
			if (!disabled) {
				onOptionsChange({
					mcp: options.mcp.filter(
						(selected) => selected.id !== item.id,
					),
				});
			}
		};
		// the agent the room runs; an agent run with none picked uses the
		// default agent
		const agentName =
			options.workspace?.name ||
			options.workspace?.workspace_id ||
			t(
				isAgentMode
					? "room:modes.defaultAgent"
					: "room:menuWorkspace.selectAgent",
			);
		const handleSubmit = (values: InstructionsValues): void => {
			if (!disabled) onOptionsChange(values);
		};
		return (
			<Form
				form={form}
				onSubmit={handleSubmit}
				className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6"
			>
				<div className="space-y-2">
					<H3>{t("room:workspacePlaces.settings")}</H3>
					<FieldDescription>
						{t("room:settings.description")}
					</FieldDescription>
				</div>
				<fieldset
					disabled={disabled}
					className="flex min-w-0 flex-col gap-6"
				>
					{(agentEditable || options.workspace || isAgentMode) && (
						<Field>
							<FieldLabel htmlFor={`${id}-agent`}>
								{t("room:form.agentLabel")}
							</FieldLabel>
							{/* styled as the model picker's trigger below */}
							<Button
								id={`${id}-agent`}
								type="button"
								variant="outline"
								disabled={disabled || !agentEditable}
								title={agentName}
								className="w-full min-w-0 justify-start overflow-hidden border-input bg-transparent px-3 py-2"
								onClick={() =>
									setOverlay({ type: "AGENT", isOpen: true })
								}
							>
								<div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
									<Bot
										aria-hidden="true"
										className="size-5 shrink-0"
									/>
									<span className="min-w-0 truncate">
										{agentName}
									</span>
									{agentEditable && (
										<ChevronDown
											aria-hidden="true"
											className="inline-block! ms-auto size-4 shrink-0 opacity-70"
										/>
									)}
								</div>
							</Button>
						</Field>
					)}
					{root.theme.featureFlags?.enableModelSelect && (
						<Field>
							<FieldLabel htmlFor={`${id}-model`}>
								{t("room:form.modelLabel")}
							</FieldLabel>
							<EngineSelect
								name={
									model?.engine_display_name ||
									model?.app_name ||
									""
								}
								value={model?.app_id || ""}
								engineTypes={["MODEL"]}
								metaFilters={[{ tag: "text-generation" }]}
								onChange={onModelChange}
								popoverContentProps={{ align: "start" }}
								id={`${id}-model`}
								disabled={disabled}
								triggerIcon={
									model ? (
										<EngineSubtypeIcon
											engineType={model.engine_type}
											engineSubtype={model.engine_subtype}
											alt=""
											className="size-5 shrink-0 object-contain"
										/>
									) : undefined
								}
							/>
						</Field>
					)}
					<FormField
						control={form.control}
						name="instructions"
						render={({ field }) => (
							<Field>
								<FieldLabel htmlFor={`${id}-instructions`}>
									{t("room:form.instructionsLabel")}
								</FieldLabel>
								<Textarea
									{...field}
									id={`${id}-instructions`}
									placeholder={t(
										"common:placeholders.updateInstructions",
									)}
									rows={3}
									className="field-sizing-fixed min-h-24 resize-y"
									onChange={(event) => {
										field.onChange(event);
										if (!disabled)
											onOptionsChange({
												instructions:
													event.target.value,
											});
									}}
								/>
							</Field>
						)}
					/>
					<RoomSelectedResources
						items={knowledge}
						disabled={disabled}
						onAdd={() =>
							setOverlay({ type: "KNOWLEDGE", isOpen: true })
						}
						onRemove={handleRemove}
					/>
					{root.theme.featureFlags?.enableTemperature && (
						<Field>
							<FieldLabel htmlFor={`${id}-temperature`}>
								{t("room:form.temperatureLabel")} (
								{(options.temperature ?? 0).toFixed(2)})
							</FieldLabel>
							<Slider
								id={`${id}-temperature`}
								aria-label={t("room:form.temperatureLabel")}
								min={0}
								max={1}
								step={0.01}
								value={[options.temperature ?? 0]}
								disabled={disabled}
								onValueChange={(value) => {
									if (!disabled)
										onOptionsChange({
											temperature: value[0],
										});
								}}
							/>
						</Field>
					)}
				</fieldset>
				{/* outside the fieldset, so its sections still open and explain
				    themselves while a response runs; its edits lock on their own */}
				<section
					aria-labelledby={`${id}-tools`}
					className="flex min-w-0 flex-col gap-6"
				>
					<div className="flex flex-wrap items-center gap-2">
						<H4 id={`${id}-tools`} className="text-base">
							{t("room:settings.toolsTitle")}
						</H4>
						<SectionInfoTooltip
							label={t("room:settings.toolsTitle")}
						>
							{t("chatTools:sections.tools.tooltip")}
						</SectionInfoTooltip>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="ms-auto"
							disabled={disabled}
							onClick={() =>
								setOverlay({
									type: "TOOLBOX",
									isOpen: true,
								})
							}
						>
							<PlusIcon aria-hidden="true" />
							{t("room:menuToolbox.addToolbox")}
						</Button>
						<FieldDescription className="w-full">
							{t(
								disabled
									? "room:studio.toolsLocked"
									: "room:studio.toolsHint",
							)}
						</FieldDescription>
					</div>
					<RoomToolsDefaultSection
						defaultTools={options.defaultTools}
						disabled={disabled}
						isAgentMode={isAgentMode}
						onChange={(defaultTools) =>
							onOptionsChange({ defaultTools })
						}
					/>
					{connectorsSection}
					<RoomToolsToolboxesSection
						variant="agent"
						toolboxes={agentToolboxes}
					/>
					<RoomToolsToolboxesSection
						variant="added"
						toolboxes={addedToolboxes}
						disabled={disabled}
						onRemove={handleRemove}
					/>
				</section>
				<MCPOverlay
					open={overlay.isOpen}
					disabled={disabled}
					allowDefaultAgent={
						!!root.theme.featureFlags?.enableAgentHarness
					}
					defaultTab={overlay.type}
					values={options.mcp}
					workspace={options.workspace ?? null}
					agentEditable={agentEditable}
					onClose={(next) => {
						if (next && !disabled) {
							onOptionsChange({
								mcp: next.mcp,
								...(agentEditable && "workspace" in next
									? { workspace: next.workspace ?? undefined }
									: {}),
							});
						}
						setOverlay((current) => ({
							...current,
							isOpen: false,
						}));
					}}
				/>
			</Form>
		);
	},
);
