import { Bot, ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
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
	Slider,
	Textarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { MCPOverlay } from "@/components/mcp/mcp-overlay";
import { DefaultToolsField } from "@/features/chat-tools/components/default-tools-field";
import { RoomSelectedResources } from "@/features/conversation/room-selected-resources";
import { useRoot } from "@/hooks/use-root";
import type { RoomStore } from "@/stores/room/room.store";
import { splitMcpByType } from "@/utility/mcp-utils";

export interface RoomOptionsFormProps {
	model: RoomStore["model"];
	onModelChange: (model: RoomStore["model"]) => void;
	options: RoomStore["options"];
	onOptionsChange: (options: Partial<RoomStore["options"]>) => void;
	agentEditable?: boolean;
	/** Commit Agent mode only after a picker Save. */
	onAgentModeSelected?: () => void;
	disabled?: boolean;
	/** Agent runs supply their own tools instead of the chat's default tools. */
	isAgentMode?: boolean;
}

export const RoomOptionsForm = observer(
	({
		model,
		onModelChange,
		options,
		onOptionsChange,
		agentEditable = false,
		onAgentModeSelected,
		disabled = false,
		isAgentMode = false,
	}: RoomOptionsFormProps) => {
		const { t } = useTranslation(["room", "common"]);
		const { root } = useRoot();
		const id = useId();
		const form = useForm({
			values: { instructions: options.instructions },
			resolver: zodResolver(z.object({ instructions: z.string() })),
		});
		const [overlay, setOverlay] = useState<{
			type: "AGENT" | "KNOWLEDGE" | "TOOLBOX";
			isOpen: boolean;
		}>({ type: "KNOWLEDGE", isOpen: false });
		const { knowledge, toolbox } = splitMcpByType(options.mcp);
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
		return (
			<Form
				form={form}
				onSubmit={(values) => {
					if (!disabled) onOptionsChange(values);
				}}
				className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6"
			>
				<div className="space-y-2">
					<H3>{t("room:settings.panelTitle")}</H3>
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
					<FieldDescription>
						{t(
							disabled
								? "room:studio.toolsLocked"
								: "room:studio.toolsHint",
						)}
					</FieldDescription>
					{(["KNOWLEDGE", "TOOLBOX"] as const).map((type) => (
						<RoomSelectedResources
							key={type}
							type={type}
							items={type === "KNOWLEDGE" ? knowledge : toolbox}
							disabled={disabled}
							onAdd={() => setOverlay({ type, isOpen: true })}
							onRemove={(item) => {
								if (
									!disabled &&
									!item.fromWorkspace &&
									!item.fromRoom &&
									item.type !== "ROOM"
								) {
									onOptionsChange({
										mcp: options.mcp.filter(
											(selected) =>
												selected.id !== item.id,
										),
									});
								}
							}}
						/>
					))}
					{!isAgentMode && (
						<DefaultToolsField
							defaultTools={options.defaultTools}
							disabled={disabled}
							onChange={(defaultTools) => {
								if (!disabled)
									onOptionsChange({ defaultTools });
							}}
						/>
					)}
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
							if (
								agentEditable &&
								(next.agentModeSelected ||
									overlay.type === "AGENT" ||
									next.workspace?.workspace_id !==
										options.workspace?.workspace_id)
							)
								onAgentModeSelected?.();
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
