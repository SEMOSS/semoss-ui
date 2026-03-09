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
import { useEffect, useMemo, useState } from "react";
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
} from "@semoss/ui/next";
import deloitteVideo from "@/assets/img/deloitte-theme.mp4";
import earthVideo from "@/assets/img/earth.mp4";
import landingImage from "@/assets/img/landing.png";
import sunsetImage from "@/assets/img/sunset.jpg";
import {
	RoomInput,
	RoomInputMenuKnowledge,
	RoomInputMenuToolbox,
	RoomInputMenuUpload,
	RoomInputMenuWorkspace,
} from "@/components";
import { RoomOptionsForm } from "@/components/room/room-options-form";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import {
	useChat,
	useGlobalBreadcrumbs,
	useRoot,
	useThemePreset,
} from "@/hooks";
import { RoomStore } from "@/stores";
import type { MCPConfig, Workspace } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

/** Map of video background keys to their imported asset URLs */
const backgroundVideos: Record<string, string> = {
	"deloitte-theme": deloitteVideo,
	earth: earthVideo,
};

/** Map of per-theme background image overrides */
const backgroundImages: Record<string, string> = {
	sunset: sunsetImage,
};

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { t } = useTranslation(["room", "workspace", "common"]);
	const { root } = useRoot();
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
		],
	});

	const { chat } = useChat();
	const { currentPreset } = useThemePreset();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

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
	const [isLoading, setIsLoading] = useState(false);
	const [isConfigurationOpen, setIsConfgurationOpen] = useState(false);
	const [mode, setMode] = useState<"chat" | "plan" | "workspace">("chat");
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

	const getWorkspace = usePixel<Workspace | null>(
		mode === "workspace" && selectedWorkspaceId
			? `GetWorkspace("${selectedWorkspaceId}");`
			: null,
		{
			data: null,
		},
	);

	// Fetch knowledge vector engine if knowledgeId is provided
	const getKnowledge = usePixel<{
		app_id: string;
		app_name: string;
	} | null>(
		knowledgeId
			? `MyEngines( engine=["${knowledgeId}"], engineTypes=['VECTOR'],  metaFilters=[{}], userT = [true], limit=[15], offset=[0]);`
			: null,
		{ data: null },
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
			workspace: null,
		});
	}, [tempRoomStore, root.theme]);

	/**
	 * Functions
	 */
	/**
	 * Handle tool selection
	 * @param tool - selected tool
	 */
	const handleToolSelect = (tool: MCPConfig) => {
		// Toggle tool in options using the temporary RoomStore
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

			// add workspace id
			if (mode === "workspace") {
				options.workspace = {
					workspace_id: getWorkspace.data?.workspace_id || "",
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
		} catch (error) {
			toast.error(
				t("room:errors.createRoom", { message: error.message }),
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
		if (getKnowledge.status !== "SUCCESS" || !getKnowledge.data?.[0]) {
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
			name: getKnowledge.data[0].app_name || knowledgeId,
		};

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: [...tempRoomStore.options.mcp, knowledgeMcp],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, tempRoomStore]);

	// Clear instructions and workspace MCPs when switching away from workspace mode
	useEffect(() => {
		if (mode !== "workspace") {
			tempRoomStore.setOptions({
				...tempRoomStore.options,
				instructions: "",
				temperature: root.theme.defaultRoomSettings.temperature,
				tokenLength: root.theme.defaultRoomSettings.tokenLength,
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
		<div className="relative h-full w-full overflow-hidden">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel className="relative flex flex-col items-center justify-center overflow-auto p-2">
					{/* Layer 0: Background — video, gradient, or photo */}
					{currentPreset.backgroundVideo ? (
						<video
							key={currentPreset.id}
							autoPlay
							loop
							muted
							playsInline
							className="absolute inset-0 h-full w-full select-none object-cover"
							src={
								backgroundVideos[currentPreset.backgroundVideo]
							}
						/>
					) : currentPreset.backgroundGradient ? (
						<div
							className={`absolute inset-0 ${currentPreset.backgroundGradient}`}
						/>
					) : (
						<img
							src={
								backgroundImages[currentPreset.id] ||
								root.theme.images.landing ||
								landingImage
							}
							alt="Background"
							className="absolute inset-0 h-full w-full select-none object-cover"
						/>
					)}

					{/* Layer 1: Ambient effect (aurora / glow) — rendered above gradient, below overlay */}
					{currentPreset.backgroundEffect ? (
						<div
							className={`pointer-events-none absolute inset-0 z-[1] ${currentPreset.backgroundEffect}`}
						/>
					) : null}

					{/* Layer 2: Semi-transparent overlay to soften the background for readable content */}
					<div
						className={`absolute inset-0 z-[2] ${currentPreset.overlayClassName || "bg-background/60"}`}
					/>

					{/* Layer 3: Content */}
					<div className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
						{root.theme.landing ? (
							<div
								className="mx-auto flex max-w-xl animate-fade-in-up"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
								dangerouslySetInnerHTML={{
									__html: root.theme.landing,
								}}
							/>
						) : (
							<div className="mx-auto flex max-w-xl animate-fade-in-up flex-col items-center gap-3">
								<div className="text-center font-semibold text-4xl text-foreground leading-normal">
									{t("room:welcome")}
								</div>
								{root.theme.description ? (
									<div className="text-center text-muted-foreground text-sm leading-normal">
										{root.theme.description}
									</div>
								) : null}
							</div>
						)}

						<RoomInput
							className="max-h-64 min-h-48 animate-fade-in-up-delay-1 bg-background"
							isLoading={isLoading}
							model={chat.models.selected}
							setModel={(m) => {
								chat.setSelectedModel(m);
							}}
							onPrompt={async (prompt, files) => {
								await createRoom(prompt, files);

								return true;
							}}
							MenuComponent={observer(
								({ addToken, onOpenChange, fileRef }) => (
									<>
										<DropdownMenuItem
											onSelect={() => {
												setMode("chat");
												onOpenChange(false);
											}}
										>
											<MessageCircleIcon />
											<span className="flex-1">
												{t("room:modes.ask")}
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
												onOpenChange(false);
											}}
										>
											<ListTodoIcon />
											<span className="flex-1">
												{t("room:modes.plan")}
											</span>

											{mode === "plan" ? (
												<div className="px-1">
													<CheckIcon />
												</div>
											) : null}
										</DropdownMenuItem>
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
													setMode("workspace");
													setSelectedWorkspaceId(
														workspace.workspace_id,
													);
												} else {
													setMode("chat");
												}
											}}
										/>
										<DropdownMenuSeparator />
										<RoomInputMenuUpload
											fileRef={fileRef}
											onSelect={() => onOpenChange(false)}
										/>
										<DropdownMenuSeparator />
										<RoomInputMenuKnowledge
											options={tempRoomStore.options}
											onSelect={(tool) => {
												handleToolSelect(tool);
												addToken(`<${tool.name}>`);
											}}
										/>
										<RoomInputMenuToolbox
											options={tempRoomStore.options}
											onSelect={(tool) => {
												handleToolSelect(tool);
												addToken(`<${tool.name}>`);
											}}
										/>
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
													? t("room:settings.close")
													: t("room:settings.open")}
											</span>
										</DropdownMenuItem>
									</>
								),
							)}
							footer={
								mode === "workspace" &&
								getWorkspace.status === "SUCCESS" ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span>
												<Badge
													variant="secondary"
													asChild
												>
													<a
														target="_blank"
														href={`${PLATFORM_URL}/#/app/${getWorkspace.data.workspace_id}`}
													>
														<ComputerIcon data-icon="inline-start" />
														<div className="w-18 truncate">
															{getWorkspace.data
																.name ||
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
											Click to view agent details
										</TooltipContent>
									</Tooltip>
								) : null
							}
						/>
					</div>
				</ResizablePanel>
				{isConfigurationOpen && (
					<>
						<ResizableHandle />
						<ResizablePanel
							className="relative h-full w-full p-2"
							defaultSize={25}
						>
							<div
								className={`relative h-full w-full overflow-hidden rounded-lg border border-input shadow-xs dark:bg-input/30`}
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="absolute top-0 right-0 z-10"
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

								<ScrollArea className="h-full w-full">
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
