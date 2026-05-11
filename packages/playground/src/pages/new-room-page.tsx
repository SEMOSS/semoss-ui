import {
	CheckIcon,
	ComputerIcon,
	ExternalLinkIcon,
	ListTodoIcon,
	MessageCircleIcon,
	Settings2Icon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	DropdownMenuItem,
	DropdownMenuSeparator,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import landingImage from "@/assets/img/landing.png";
import landingDarkImage from "@/assets/img/landing-darkmode.png";
import {
	FileDragOverlay,
	RoomInput,
	RoomInputMenuMCP,
	RoomInputMenuUpload,
	RoomInputMenuWorkspace,
} from "@/components";
import { RoomOptionsForm } from "@/components/room/room-options-form";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { FileDragProvider } from "@/contexts";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { RoomStore } from "@/stores";
import type { MCPConfig, Prompt, Workspace } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { t } = useTranslation(["room", "workspace", "common", "chat"]);
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();

	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const landingSrc = isDark
		? root.theme.images.landingDark || landingDarkImage
		: root.theme.images.landing || landingImage;
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
		],
	});

	const { chat } = useChat();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const initialPrompt = searchParams.get("prompt") ?? "";

	const workspaceIdSearchParams = searchParams.get("workspaceId");
	const knowledgeId = searchParams.get("knowledgeId");

	/**
	 * State
	 */
	// Create a temporary RoomStore instance to handle options mutations
	// This prevents re-renders on tool selection since MobX handles the mutations
	const tempRoomStore = useMemo(
		() => new RoomStore(root.theme, "temp"),
		[root.theme],
	);
	const bannerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!bannerRef.current) return;
		// The url stripping here is primarily due to a BE theme bug where single quote apostrophes get serial added when saving
		const urls =
			(root.theme.banner ?? "").match(/https?:\/\/[^\s'"<>]+/g) ?? [];
		bannerRef.current
			.querySelectorAll("a")
			.forEach((a: HTMLAnchorElement, i: number) => {
				a.target = "_blank";
				a.rel = "noopener noreferrer";
				if (urls[i]) a.setAttribute("href", urls[i]);
			});
	}, [root.theme.banner]);

	const [isLoading, setIsLoading] = useState(false);
	const [isConfigurationOpen, setIsConfgurationOpen] = useState(false);
	const [mode, setMode] = useState<"chat" | "plan" | "workspace">("chat");
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
	const [prompts, setPrompts] = useState<string[]>([]);
	const previewPrompts = useMemo(
		() => tempRoomStore.options.predefinedPrompts.slice(0, 5),
		[tempRoomStore.options.predefinedPrompts],
	);

	const getWorkspace = usePixel<Workspace | null>(
		mode === "workspace" && selectedWorkspaceId
			? `GetWorkspace("${selectedWorkspaceId}");`
			: "",
		{
			data: null,
		},
	);

	// Fetch knowledge vector engine if knowledgeId is provided
	const getKnowledge = usePixel<
		| {
				engine_id: string;
				engine_name: string;
		  }[]
		| null
	>(
		knowledgeId
			? `MyEngines( engine=["${knowledgeId}"], engineTypes=['VECTOR'],  metaFilters=[{}], userT = [true], limit=[15], offset=[0]);`
			: "",
		{ data: null },
	);

	const getPrompts = usePixel<Prompt[]>(
		mode === "workspace" && selectedWorkspaceId && prompts.length > 0
			? `META | ListPrompt(filters=[Filter( (PROMPT__ID == [${prompts.map((p) => `"${p}"`).join(", ")}]) )])`
			: "",
		{
			data: [],
		},
	);
	// On initial load, set the default options from the theme using the temporary RoomStore
	useEffect(() => {
		tempRoomStore.setOptions({
			instructions: "",
			mcp: [...(root.theme.defaultTools || [])],
			tokenLength:
				root.theme.defaultRoomSettings?.tokenLength || TOKEN_LENGTH,
			temperature:
				root.theme?.defaultRoomSettings?.temperature || TEMPERATURE,
			workspace: undefined,
			predefinedPrompts: [],
		});
	}, [tempRoomStore, root.theme]);

	/**
	 * Functions
	 */
	/**
	 * Handle tool selection (toggle for plus menu)
	 * @param tool - selected tool
	 */
	const handleToolSelect = (tool: MCPConfig) => {
		// Toggle tool in options
		const tools = tempRoomStore.options.mcp.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, MCPConfig>,
		);

		if (Object.hasOwn(tools, tool.id)) {
			delete tools[tool.id];
		} else {
			tools[tool.id] = tool;
		}

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: Object.values(tools),
		});
	};

	/**
	 * Handle tool add (add-only for slash menu)
	 * @param tool - selected tool
	 */
	const handleToolAdd = (tool: MCPConfig) => {
		// Add tool to options (skip if already present)
		const tools = tempRoomStore.options.mcp.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, MCPConfig>,
		);

		// Only add if not already present
		if (!Object.hasOwn(tools, tool.id)) {
			tools[tool.id] = tool;
		}

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: Object.values(tools),
		});
	};

	/**
	 * Create a new room and ask the model
	 *
	 * @param prompt The prompt to ask
	 * @param files The files to upload
	 */
	const createRoom = async (prompt: string, files: File[]) => {
		// ignore if loading
		if (isLoading) {
			return;
		}

		try {
			// turn the loading screen
			setIsLoading(true);

			const options = {
				...tempRoomStore.options,
				mcp: tempRoomStore.options.mcp,
			};

			// add workspace id and name
			if (mode === "workspace") {
				options.workspace = {
					workspace_id: getWorkspace.data?.workspace_id || "",
					name: getWorkspace.data?.name,
				};
			}

			// create a new room
			const room = await chat.createRoom(
				mode === "plan" ? "planning" : "chat",
				prompt,
				files,
				options,
				getWorkspace.data?.workspace_id,
			);

			// go to the new room
			navigate(`/room/${room.roomId}`);
		} catch (error: unknown) {
			const sdkError = error as { message: string; code?: number };
			if (
				sdkError.code !== undefined &&
				(sdkError.code === 403 || sdkError.code === 302)
			) {
				// User is unauthorized, likely due to expired session. Prompt them to log in again.
				toast.error(t("chat:gracefulErrors.inactivity"));
				return;
			}

			toast.error(
				t("room:errors.createRoom", { message: sdkError.message }),
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Effects
	 */
	// Handle workspace data loading
	useEffect(() => {
		// If workspaceId came from URL, update the mode
		if (workspaceIdSearchParams) {
			setMode("workspace");
			setSelectedWorkspaceId(workspaceIdSearchParams);
		}
	}, [workspaceIdSearchParams]);

	// Handle workspace data loading from RoomWorkspace component selection
	useEffect(() => {
		if (
			mode !== "workspace" ||
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data
		) {
			return;
		}

		// Sync options using the temporary RoomStore
		// Add workspace MCPs with fromWorkspace flag to the mcp array
		const workspaceMCPs = (getWorkspace.data.mcp || []).map((mcp) => ({
			...mcp,
			fromWorkspace: true,
		}));

		// Preserve existing tools that are not from workspace
		const nonWorkspaceMCPs = tempRoomStore.options.mcp.filter(
			(mcp) => !mcp.fromWorkspace,
		);

		// Combine and deduplicate by ID (workspace MCPs take precedence)
		const allMCPs = [...workspaceMCPs, ...nonWorkspaceMCPs];
		const mcpMap = new Map<string, MCPConfig>();
		for (const mcp of allMCPs) {
			// Only add if not already in map (workspace MCPs added first, so they take precedence)
			if (!mcpMap.has(mcp.id)) {
				mcpMap.set(mcp.id, mcp);
			}
		}

		setPrompts(
			Array.isArray(getWorkspace.data.prompts)
				? getWorkspace.data.prompts.map((p) =>
						typeof p === "string" ? p : (p as { id: string }).id,
					)
				: [],
		);
		tempRoomStore.setOptions({
			...tempRoomStore.options,
			instructions:
				getWorkspace.data?.system_prompt ||
				tempRoomStore.options.instructions,
			mcp: Array.from(mcpMap.values()),
		});
	}, [mode, getWorkspace.status, getWorkspace.data, tempRoomStore]);

	// Handle knowledge vector engine from URL parameter
	useEffect(() => {
		if (
			!knowledgeId ||
			getKnowledge.status !== "SUCCESS" ||
			!getKnowledge.data?.[0]
		) {
			return;
		}

		// Add the knowledge MCP to options using the temporary RoomStore
		// Check if this knowledge MCP already exists
		const existingMcp = tempRoomStore.options.mcp.find(
			(mcp) => mcp.id === knowledgeId && mcp.type === "VECTOR",
		);

		// If it already exists, don't add it again
		if (existingMcp) {
			return;
		}

		// Add the knowledge MCP
		const knowledgeMcp = {
			id: knowledgeId,
			type: "VECTOR" as const,
			name: getKnowledge.data[0].engine_name || knowledgeId,
		};

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: [...tempRoomStore.options.mcp, knowledgeMcp],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, tempRoomStore]);

	// Handle prompts from URL parameter
	useEffect(() => {
		if (getPrompts.status !== "SUCCESS" || !getPrompts.data?.length) {
			return;
		}

		const prompts: Prompt[] = getPrompts.data.map((p) => ({
			id: p.id,
			title: p.title,
			context: p.context,
			tags: p.tags,
			version: p.version,
			intent: p.intent,
			// TODO: figure out why this is done this way
			createdBy: (p as unknown as { created_by: string }).created_by,
			dateCreated: (p as unknown as { date_created: string })
				.date_created,
			global: false, // TODO: figure out if this is needed
		}));

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			predefinedPrompts: prompts,
		});
	}, [getPrompts.status, getPrompts.data, tempRoomStore]);

	// Clear instructions and workspace MCPs when switching away from workspace mode
	useEffect(() => {
		if (mode !== "workspace") {
			tempRoomStore.setOptions({
				...tempRoomStore.options,
				instructions: "",
				temperature: root.theme.defaultRoomSettings?.temperature,
				tokenLength: root.theme.defaultRoomSettings?.tokenLength,
				mcp: [...(root.theme.defaultTools || [])], // Remove workspace MCPs
			});
		}
	}, [
		mode,
		root.theme.defaultTools,
		root.theme.defaultRoomSettings,
		tempRoomStore,
	]);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{root.theme.banner ? (
				<div
					ref={bannerRef}
					className="w-full shrink-0 bg-primary px-4 py-2 text-center text-sm text-white opacity-80"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{ __html: root.theme.banner }}
				/>
			) : null}
			<ResizablePanelGroup direction="horizontal" className="flex-1">
				<ResizablePanel className="relative">
					<FileDragProvider>
						<FileDragOverlay />
						<img
							src={landingSrc}
							alt="Background"
							className="absolute inset-0 h-full w-full select-none object-cover"
						/>
						<div className="flex h-full flex-col items-center justify-center overflow-auto p-2">
							<div className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
								{root.theme.landing ? (
									<div
										className="mx-auto flex max-w-xl"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
										dangerouslySetInnerHTML={{
											__html:
												root.theme?.altLandingKey &&
												searchParams.has(
													root.theme.altLandingKey,
												) &&
												root.theme.altLanding
													? root.theme.altLanding
													: root.theme.landing,
										}}
									/>
								) : (
									<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
										<div className="text-center font-semibold text-4xl text-foreground leading-normal">
											{t("room:welcome", {
												name: chat.user.name,
											})}
										</div>
										{root.theme.description ? (
											<div className="text-center text-muted-foreground text-sm leading-normal">
												{root.theme.description}
											</div>
										) : null}
									</div>
								)}

								<RoomInput
									predefinedPrompts={
										tempRoomStore.options.predefinedPrompts
									}
									className="max-h-64 min-h-48 bg-background"
									isLoading={isLoading}
									initialValue={initialPrompt}
									model={chat.models.selected}
									room={tempRoomStore}
									setModel={(m) => {
										chat.setSelectedModel(m);
									}}
									options={tempRoomStore.options}
									onMcpSelect={handleToolAdd}
									onMcpToggle={handleToolSelect}
									onPrompt={async (prompt, files) => {
										await createRoom(prompt, files);

										return true;
									}}
									hidePauseButton
									MenuComponent={observer(
										({
											onOpenChange,
											knowledgeOverlayOpen,
											onKnowledgeOverlayChange,
											toolboxOverlayOpen,
											onToolboxOverlayChange,
										}) => (
											<>
												<RoomInputMenuUpload
													onSelect={() =>
														onOpenChange(false)
													}
												/>
												<DropdownMenuSeparator />
												{root.theme.featureFlags
													?.enablePlan && (
													<>
														<DropdownMenuItem
															onSelect={() => {
																setMode("chat");
																onOpenChange(
																	false,
																);
															}}
														>
															<MessageCircleIcon />
															<span className="flex-1">
																{t(
																	"room:modes.ask",
																)}
															</span>
															{mode === "chat" ? (
																<div className="px-1">
																	<CheckIcon />
																</div>
															) : null}
														</DropdownMenuItem>
														<DropdownMenuItem
															onSelect={() => {
																setMode("plan");
																onOpenChange(
																	false,
																);
															}}
														>
															<ListTodoIcon />
															<span className="flex-1">
																{t(
																	"room:modes.plan",
																)}
															</span>

															{mode === "plan" ? (
																<div className="px-1">
																	<CheckIcon />
																</div>
															) : null}
														</DropdownMenuItem>
													</>
												)}
												<RoomInputMenuWorkspace
													workspace={
														mode === "workspace" &&
														getWorkspace.status ===
															"SUCCESS"
															? getWorkspace.data
															: null
													}
													onSelect={(workspace) => {
														if (workspace) {
															if (
																mode ===
																	"workspace" &&
																selectedWorkspaceId ===
																	workspace.workspace_id
															) {
																setMode("chat");
																setSelectedWorkspaceId(
																	"",
																);
															} else {
																setMode(
																	"workspace",
																);
																setSelectedWorkspaceId(
																	workspace.workspace_id,
																);
															}
														} else {
															setMode("chat");
															setSelectedWorkspaceId(
																"",
															);
														}
													}}
												/>
												<DropdownMenuSeparator />
												<RoomInputMenuMCP
													type="KNOWLEDGE"
													options={
														tempRoomStore.options
													}
													open={knowledgeOverlayOpen}
													onOpenChange={
														onKnowledgeOverlayChange
													}
												/>
												<RoomInputMenuMCP
													type="TOOLBOX"
													options={
														tempRoomStore.options
													}
													open={toolboxOverlayOpen}
													onOpenChange={
														onToolboxOverlayChange
													}
												/>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault();

														setIsConfgurationOpen(
															!isConfigurationOpen,
														);
													}}
												>
													<Settings2Icon />
													<span className="flex-1">
														{isConfigurationOpen
															? t(
																	"room:settings.close",
																)
															: t(
																	"room:settings.open",
																)}
													</span>
												</DropdownMenuItem>
											</>
										),
									)}
									footer={
										mode === "workspace" &&
										getWorkspace.status === "SUCCESS" ? (
											root.theme.featureFlags
												?.showPlatformLinks !==
											false ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<span>
															<Badge
																variant="secondary"
																asChild
															>
																<a
																	target="_blank"
																	href={`${PLATFORM_URL}/#/app/${getWorkspace.data?.workspace_id}`}
																>
																	<ComputerIcon data-icon="inline-start" />
																	<div className="w-18 truncate">
																		{getWorkspace
																			.data
																			?.name ||
																			t(
																				"room:menuWorkspace.selectAgent",
																			)}
																	</div>
																	<ExternalLinkIcon data-icon="inline-end" />
																</a>
															</Badge>
														</span>
													</TooltipTrigger>
													<TooltipContent>
														Click to view agent
														details
													</TooltipContent>
												</Tooltip>
											) : (
												<Tooltip>
													<TooltipTrigger asChild>
														<span>
															<Badge variant="secondary">
																<ComputerIcon data-icon="inline-start" />
																<div className="w-18 truncate">
																	{getWorkspace
																		.data
																		?.name ||
																		t(
																			"room:menuWorkspace.selectAgent",
																		)}
																</div>
															</Badge>
														</span>
													</TooltipTrigger>
													<TooltipContent>
														{getWorkspace.data
															?.name ||
															t(
																"room:menuWorkspace.selectAgent",
															)}
													</TooltipContent>
												</Tooltip>
											)
										) : null
									}
								/>
								{tempRoomStore.options.predefinedPrompts
									.length > 0 ? (
									<div className="mx-auto flex w-full flex-col items-center gap-3">
										<div className="flex max-h-34 w-full flex-wrap justify-center gap-2 overflow-hidden">
											{previewPrompts.map((prompt) => {
												return (
													<Button
														key={prompt.id}
														variant="outline"
														className="h-10 gap-2 rounded-md border border-input px-6 py-2 shadow-xs"
														disabled={isLoading}
														onClick={() =>
															createRoom(
																prompt.context,
																[],
															)
														}
													>
														{prompt.title}
													</Button>
												);
											})}
										</div>
									</div>
								) : null}
							</div>
						</div>
					</FileDragProvider>
				</ResizablePanel>
				{isConfigurationOpen && (
					<>
						<ResizableHandle />
						<ResizablePanel
							className="relative h-full w-full p-2"
							defaultSize={25}
						>
							<div
								className={`relative h-full w-full overflow-hidden rounded-lg border border-input bg-background shadow-xs`}
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="absolute top-2 right-2 z-10"
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												// close it
												setIsConfgurationOpen(false);
											}}
										>
											<XIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{t("room:settings.close")}
									</TooltipContent>
								</Tooltip>

								<ScrollArea className="h-full w-full px-2">
									<RoomOptionsForm
										model={chat.models.selected}
										options={tempRoomStore.options}
										onModelChange={(model) => {
											if (model) {
												chat.setSelectedModel(model);
											}
										}}
										onOptionsChange={(options) => {
											if (options) {
												tempRoomStore.setOptions({
													...tempRoomStore.options,
													...options,
												});
											}
										}}
									/>
								</ScrollArea>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
