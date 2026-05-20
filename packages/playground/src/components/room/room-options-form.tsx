import { ComputerIcon, HammerIcon, PlusIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { MouseEvent } from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect } from "@semoss/shared";
import {
	Badge,
	Button,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	Input,
	Slider,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { MCPOverlay, splitMcpByType } from "@/components";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";

interface RoomOptionsFormProps {
	/** Model of the room */
	model: RoomStore["model"];

	/** Update model on change */
	onModelChange: (model: RoomStore["model"]) => void;

	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	onOptionsChange: (options: Partial<RoomStore["options"]>) => void;

	/**
	 * Whether the user can pick/change the agent from this form. Defaults to
	 * `false` — agents are baked in at room creation, so the existing-room
	 * settings panel is read-only. Pass `true` from new-room contexts.
	 */
	agentEditable?: boolean;
}

export const RoomOptionsForm: React.FC<RoomOptionsFormProps> = observer(
	({
		model,
		onModelChange = () => null,
		options,
		onOptionsChange = () => null,
		agentEditable = false,
	}) => {
		const { t } = useTranslation(["room", "common"]);
		const { root } = useRoot();

		/**
		 * State
		 */
		const [mCPOverlay, setMCPOverlay] = useState<{
			type: "AGENT" | "KNOWLEDGE" | "TOOLBOX";
			isOpen: boolean;
		}>({
			type: "KNOWLEDGE",
			isOpen: false,
		});

		// All MCPs live in the same array; workspace-inherited MCPs carry a
		// `fromWorkspace` flag and cannot be removed here — the room only
		// inherits them, so removal happens in the workspace form instead.
		const { knowledge, toolbox } = splitMcpByType(options?.mcp ?? []);

		/**
		 * Functions
		 */
		const handleDeleteMCP = (mcp: MCPConfig) => {
			if (mcp.fromWorkspace) {
				return;
			}

			const updatedMCPs = options.mcp.filter(
				(t) => !(t.id === mcp.id && t.type === mcp.type),
			);

			onOptionsChange({
				mcp: updatedMCPs,
			});
		};

		return (
			<form className="p-4 text-foreground">
				<FieldGroup>
					<FieldSet>
						<FieldLegend className="flex w-full flex-1 items-center justify-between gap-2">
							{t("room:settings.title")}
						</FieldLegend>
						<FieldDescription>
							{t("room:settings.description")}
						</FieldDescription>
						<FieldGroup>
							{root.theme.featureFlags?.enableModelSelect && (
								<Field>
									<FieldLabel>
										{t("room:form.modelLabel")}
									</FieldLabel>
									<div className="rounded-md border border-input bg-transparent px-1 py-1 shadow-xs dark:bg-input/30">
										<EngineSelect
											className="w-full max-w-none"
											name={
												model?.engine_display_name ||
												model?.app_name ||
												""
											}
											value={model?.app_id || ""}
											engineTypes={["MODEL"]}
											metaFilters={[
												{ tag: "text-generation" },
											]}
											onChange={(v) => {
												onModelChange(v);
											}}
											popoverContentProps={{
												align: "start",
											}}
										/>
									</div>
								</Field>
							)}
							<Field>
								<FieldLabel>
									{t("room:form.instructionsLabel")}
								</FieldLabel>
								<Textarea
									placeholder={t(
										"common:placeholders.updateInstructions",
									)}
									className="h-64 resize-none overflow-y-auto"
									value={options.instructions}
									onChange={(e) => {
										onOptionsChange({
											instructions: e.target.value,
										});
									}}
								/>
							</Field>
							<Field>
								<FieldLabel
									onClick={(
										event: MouseEvent<HTMLLabelElement>,
									) => {
										event.preventDefault();
										event.stopPropagation();

										setMCPOverlay({
											type: "AGENT",
											isOpen: true,
										});
									}}
								>
									<div className="flex-1">
										{t("room:form.agentLabel")}
									</div>
								</FieldLabel>
								<div className="space-y-2">
									{options?.workspace ? (
										<button
											type="button"
											className="group flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-card-foreground hover:bg-muted/50"
											onClick={() =>
												setMCPOverlay({
													type: "AGENT",
													isOpen: true,
												})
											}
										>
											<ComputerIcon className="size-4" />
											<span className="flex-1 truncate text-sm">
												{options.workspace.name ||
													options.workspace
														.workspace_id}
											</span>
										</button>
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
											onClick={() =>
												setMCPOverlay({
													type: "AGENT",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												{agentEditable
													? t(
															"room:menuWorkspace.selectAgent",
														)
													: t("room:form.noAgent")}
											</span>
										</button>
									)}
								</div>
							</Field>
							<Field>
								<FieldLabel
									onClick={(
										event: MouseEvent<HTMLLabelElement>,
									) => {
										event.preventDefault();
										event.stopPropagation();

										setMCPOverlay({
											type: "KNOWLEDGE",
											isOpen: true,
										});
									}}
								>
									<div className="flex-1">
										{t("room:form.knowledgeLabel")}
									</div>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();

													setMCPOverlay({
														type: "KNOWLEDGE",
														isOpen: true,
													});
												}}
											>
												<PlusIcon />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("common:actions.addKnowledge")}
										</TooltipContent>
									</Tooltip>
								</FieldLabel>
								<div className="space-y-2">
									{knowledge.length ? (
										knowledge.map((mcp) => {
											return (
												<div
													key={mcp.id}
													className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-card-foreground ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
												>
													<HammerIcon className="size-4" />
													<span className="flex-1 truncate text-sm">
														{mcp.name}
													</span>
													{mcp.fromWorkspace ? (
														<Badge
															key={mcp.id}
															variant="outline"
															className="disabled: mr-2 border border-primary text-primary text-xs"
														>
															{t(
																"common:badges.fromAgent",
															)}
														</Badge>
													) : (
														<Button
															variant="ghost"
															size="icon-sm"
															color=""
															className="invisible group-hover:visible"
															onClick={() =>
																handleDeleteMCP(
																	mcp,
																)
															}
															disabled={
																mcp.fromWorkspace
															}
															title={
																mcp.fromWorkspace
																	? t(
																			"common:tooltips.cannotDeleteWorkspaceMCPs",
																		)
																	: t(
																			"common:actions.deleteMCP",
																		)
															}
														>
															<TrashIcon
																className={
																	mcp.fromWorkspace
																		? "text-muted-foreground"
																		: "text-destructive"
																}
															/>
														</Button>
													)}
												</div>
											);
										})
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
											onClick={() =>
												setMCPOverlay({
													type: "KNOWLEDGE",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												{t(
													"common:messages.noKnowledgeFound",
												)}
											</span>
										</button>
									)}
								</div>
							</Field>
							<Field>
								<FieldLabel
									onClick={(
										event: MouseEvent<HTMLLabelElement>,
									) => {
										event.preventDefault();
										event.stopPropagation();

										setMCPOverlay({
											type: "TOOLBOX",
											isOpen: true,
										});
									}}
								>
									<div className="flex-1">
										{t("room:form.toolboxLabel")}
									</div>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();

													setMCPOverlay({
														type: "TOOLBOX",
														isOpen: true,
													});
												}}
											>
												<PlusIcon />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("common:actions.addToolbox")}
										</TooltipContent>
									</Tooltip>
								</FieldLabel>
								<div className="space-y-2">
									{toolbox.length ? (
										toolbox.map((mcp) => {
											return (
												<div
													key={mcp.id}
													className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-card-foreground ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
												>
													<HammerIcon className="size-4" />
													<span className="flex-1 truncate text-sm">
														{mcp.name}
													</span>
													{mcp.fromWorkspace ? (
														<Badge
															key={mcp.id}
															variant="outline"
															className="disabled: mr-2 border border-primary text-primary text-xs"
														>
															{t(
																"common:badges.fromAgent",
															)}
														</Badge>
													) : (
														<Button
															variant="ghost"
															size="icon-sm"
															className="invisible group-hover:visible"
															onClick={() =>
																handleDeleteMCP(
																	mcp,
																)
															}
															disabled={
																mcp.fromWorkspace
															}
															title={
																mcp.fromWorkspace
																	? t(
																			"common:tooltips.cannotDeleteAgentMCPs",
																		)
																	: t(
																			"common:actions.deleteMCP",
																		)
															}
														>
															<TrashIcon
																className={
																	mcp.fromWorkspace
																		? "text-muted-foreground"
																		: "text-destructive"
																}
															/>
														</Button>
													)}
												</div>
											);
										})
									) : (
										<button
											type="button"
											className="w-full cursor-pointer rounded-md border border-border bg-card py-4 text-center text-card-foreground"
											onClick={() =>
												setMCPOverlay({
													type: "TOOLBOX",
													isOpen: true,
												})
											}
										>
											<span className="text-muted-foreground text-xs">
												{t(
													"common:messages.noToolboxFound",
												)}
											</span>
										</button>
									)}
								</div>
							</Field>
							<MCPOverlay
								open={mCPOverlay.isOpen}
								defaultTab={mCPOverlay.type}
								values={options?.mcp ?? []}
								workspace={options?.workspace ?? null}
								agentEditable={agentEditable}
								onClose={(next) => {
									if (next) {
										const updates: Partial<
											RoomStore["options"]
										> = { mcp: next.mcp };
										if (
											agentEditable &&
											"workspace" in next
										) {
											updates.workspace =
												next.workspace ?? undefined;
										}
										onOptionsChange(updates);
									}
									setMCPOverlay({
										isOpen: false,
										type: "KNOWLEDGE",
									});
								}}
							/>
						</FieldGroup>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel>
									{t("room:form.maxTokenLabel")}
								</FieldLabel>
								<Input
									type="number"
									placeholder={t(
										"common:placeholders.updateTokenLength",
									)}
									value={options.tokenLength}
									onChange={(e) =>
										onOptionsChange({
											tokenLength:
												Number(e.target.value) || 0,
										})
									}
									min={0}
									className="w-full"
								/>
							</Field>

							<Field>
								<FieldLabel>
									{t("room:form.temperatureLabel")} (
									{options.temperature?.toFixed(2)})
								</FieldLabel>
								<Slider
									min={0}
									max={1}
									step={0.01}
									value={[options.temperature]}
									onValueChange={(value) =>
										onOptionsChange({
											temperature: value[0],
										})
									}
								/>
							</Field>
						</FieldGroup>
					</FieldSet>
				</FieldGroup>
			</form>
		);
	},
);
