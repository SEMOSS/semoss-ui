import { Bot } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect } from "@semoss/shared";
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
import { RoomSelectedResources } from "@/features/conversation/room-selected-resources";
import { OrchestratorRosterField } from "@/features/orchestrator/orchestrator-roster-field";
import { TeamworkDefaultToolsField } from "@/features/teamwork/components/teamwork-default-tools-field";
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
					{(agentEditable || options.workspace) && (
						<Field>
							<FieldLabel htmlFor={`${id}-agent`}>
								{t("room:form.agentLabel")}
							</FieldLabel>
							<Button
								id={`${id}-agent`}
								type="button"
								variant="outline"
								disabled={disabled || !agentEditable}
								className="h-auto min-h-10 justify-start whitespace-normal text-start"
								onClick={() =>
									setOverlay({ type: "AGENT", isOpen: true })
								}
							>
								<Bot aria-hidden="true" />
								{options.workspace?.name ||
									options.workspace?.workspace_id ||
									t("room:menuWorkspace.selectAgent")}
							</Button>
						</Field>
					)}
					{isAgentMode && options.workspace ? (
						<Field>
							<FieldLabel>Room agents</FieldLabel>
							<FieldDescription>
								Agents available for same-room task handoff.
							</FieldDescription>
							<OrchestratorRosterField
								workspaceId={options.workspace.workspace_id}
								value={options.agents ?? []}
								disabled={disabled}
								onChange={(agents) =>
									onOptionsChange({ agents })
								}
							/>
						</Field>
					) : null}

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
						<TeamworkDefaultToolsField
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
