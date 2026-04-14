import { DicesIcon, HammerIcon, PlusIcon, TrashIcon } from "lucide-react";
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
import { MCPOverlay } from "@/components";
import { RoomOptionsImageSelect } from "@/components/room/room-options-image-select";
import { IMAGE_SIZE_PRESETS } from "@/constants";
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
}

export const RoomOptionsForm: React.FC<RoomOptionsFormProps> = observer(
	({
		model,
		onModelChange = () => null,
		options,
		onOptionsChange = () => null,
	}) => {
		const { t } = useTranslation(["room", "common"]);
		const { root } = useRoot();

		/**
		 * State
		 */
		const [mCPOverlay, setMCPOverlay] = useState<{
			type: "KNOWLEDGE" | "TOOLBOX";
			isOpen: boolean;
		}>({
			type: "KNOWLEDGE",
			isOpen: false,
		});

		const deriveImagePreset = () => {
			const match = Object.entries(IMAGE_SIZE_PRESETS).find(
				([, v]) =>
					v.height === options.imageHeight &&
					v.width === options.imageWidth,
			);
			const [size = "large", type = "square"] = match
				? (match[0].split("-") as [
						"small" | "medium" | "large",
						"square" | "portrait" | "landscape",
					])
				: [];
			return { size, type } as {
				size: "small" | "medium" | "large";
				type: "square" | "portrait" | "landscape";
			};
		};

		const [imageSize, setImageSize] = useState<
			"small" | "medium" | "large"
		>(() => deriveImagePreset().size);
		const [imageType, setImageType] = useState<
			"square" | "portrait" | "landscape"
		>(() => deriveImagePreset().type);

		const handleImagePresetChange = (
			size: typeof imageSize,
			type: typeof imageType,
		) => {
			const preset = IMAGE_SIZE_PRESETS[`${size}-${type}`];
			if (preset) {
				onOptionsChange({
					imageHeight: preset.height,
					imageWidth: preset.width,
				});
			}
		};

		// All MCPs are in the mcp array (workspace MCPs have fromWorkspace flag)
		const knowledge =
			options?.mcp?.filter((mcp) => mcp.type === "VECTOR") || [];
		const toolbox =
			options?.mcp?.filter((mcp) => mcp.type !== "VECTOR") || [];

		/**
		 * Functions
		 */
		const handleDeleteMCP = (mcp: MCPConfig) => {
			// Don't allow deletion of workspace MCPs
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
			<form className="p-4">
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
									<EngineSelect
										name={
											model?.engine_display_name ||
											model?.app_name ||
											""
										}
										value={model?.app_id || ""}
										engineTypes={["MODEL"]}
										metaFilters={[
											{
												tag: [
													"text-generation",
													"image-generation",
												],
											},
										]}
										onChange={(v) => {
											onModelChange(v);
										}}
										popoverContentProps={{
											align: "start",
										}}
									/>
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
													className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border px-3 py-2 ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
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
											className="w-full cursor-pointer rounded-md border border-border py-4 text-center dark:bg-input/30"
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
													className={`group h flex h-10 items-center justify-between gap-2 rounded-md border border-border px-3 py-2 ${mcp.fromWorkspace ? "" : "hover:bg-muted/50"}`}
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
											className="w-full cursor-pointer rounded-md border border-border py-4 text-center dark:bg-input/30"
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
								type={mCPOverlay.type}
								values={
									mCPOverlay.type === "TOOLBOX"
										? toolbox
										: knowledge
								}
								onClose={(mcp) => {
									if (mcp) {
										// Merge updated MCPs with the other type
										const otherTypeMCPs =
											mCPOverlay.type === "TOOLBOX"
												? knowledge
												: toolbox;

										onOptionsChange({
											mcp: [...otherTypeMCPs, ...mcp],
										});
									}

									// close it
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
						<FieldLegend className="pb-2">
							Text Generation Settings
						</FieldLegend>
						<FieldDescription>
							{t("room:settings.textGenDescription")}
						</FieldDescription>
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
					<FieldSeparator />
					<FieldSet>
						<FieldLegend>Image Generation Settings</FieldLegend>
						<FieldDescription>
							{t("room:settings.imageGenDescription")}
						</FieldDescription>
						<FieldGroup>
							<Field>
								<FieldLabel>
									{t("room:form.imageOrientationLabel")}
								</FieldLabel>
								<RoomOptionsImageSelect
									value={imageType}
									onChange={(v) => {
										setImageType(v as typeof imageType);
										handleImagePresetChange(
											imageSize,
											v as typeof imageType,
										);
									}}
									options={[
										{
											value: "square",
											label: t(
												"room:form.imageTypeSquareLabel",
											),
											svgTitle: "Square Orientation",
											svgContent: (
												<rect
													x="6"
													y="6"
													width="28"
													height="28"
													rx="2"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
										{
											value: "portrait",
											label: t(
												"room:form.imageTypePortraitLabel",
											),
											svgTitle: "Portrait Orientation",
											svgContent: (
												<rect
													x="12"
													y="4"
													width="16"
													height="32"
													rx="2"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
										{
											value: "landscape",
											label: t(
												"room:form.imageTypeLandscapeLabel",
											),
											svgTitle: "Landscape Orientation",
											svgContent: (
												<rect
													x="4"
													y="12"
													width="32"
													height="16"
													rx="2"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
									]}
								/>
							</Field>
							<Field>
								<FieldLabel>
									{t("room:form.imageSizeLabel")}
								</FieldLabel>
								<RoomOptionsImageSelect
									value={imageSize}
									onChange={(v) => {
										setImageSize(v as typeof imageSize);
										handleImagePresetChange(
											v as typeof imageSize,
											imageType,
										);
									}}
									options={[
										{
											value: "small",
											label: t(
												"room:form.imageSizeSmallLabel",
											),
											svgTitle: "Small size",
											svgContent: (
												<rect
													x="14"
													y="14"
													width="12"
													height="12"
													rx="1.5"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
										{
											value: "medium",
											label: t(
												"room:form.imageSizeMediumLabel",
											),
											svgTitle: "Medium size",
											svgContent: (
												<rect
													x="9"
													y="9"
													width="22"
													height="22"
													rx="1.5"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
										{
											value: "large",
											label: t(
												"room:form.imageSizeLargeLabel",
											),
											svgTitle: "Large size",
											svgContent: (
												<rect
													x="4"
													y="4"
													width="32"
													height="32"
													rx="1.5"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeDasharray="3 2"
												/>
											),
										},
									]}
								/>
							</Field>
							<Field>
								<FieldLabel>
									{" "}
									{t("room:form.cfgScaleLabel")} (
									{options.cfgScale?.toFixed(2)})
								</FieldLabel>
								<Slider
									min={1.1}
									max={9.9}
									step={0.01}
									value={[options.cfgScale]}
									onValueChange={(value) =>
										onOptionsChange({
											cfgScale: value[0],
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>
									{t("room:form.imageSeedLabel")}
								</FieldLabel>
								<div className="flex gap-2">
									<Input
										type="number"
										placeholder={t(
											"common:placeholders.updateImageSeed",
										)}
										value={options.seed}
										onChange={(e) =>
											onOptionsChange({
												seed:
													Number(e.target.value) || 0,
											})
										}
										min={1}
										className="w-full"
									/>
									<Button
										variant="outline"
										size="icon"
										type="button"
										onClick={() =>
											onOptionsChange({
												seed:
													Math.floor(
														Math.random() *
															2147483646,
													) + 1,
											})
										}
									>
										<DicesIcon />
									</Button>
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>
				</FieldGroup>
			</form>
		);
	},
);
