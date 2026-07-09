import {
	BotIcon,
	CheckIcon,
	MessageCircleIcon,
	Settings2Icon,
	XIcon,
} from "lucide-react";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider, useInsight, usePixel } from "@semoss/sdk/react";
import {
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
	RoomInputMenuFileExplorer,
	RoomInputMenuMCP,
	RoomInputMenuNewFileExplorer,
	RoomInputMenuUpload,
	RoomSidebar,
} from "@/components";
import { RoomOptionsForm } from "@/components/room/room-options-form";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { FileDragProvider } from "@/contexts";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { RoomStore } from "@/stores";
import type { MCPConfig, Prompt, Workspace } from "@/types";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { t } = useTranslation(["room", "workspace", "common", "chat"]);
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();
	const { actions } = useInsight();

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
	/** Engine IDs whose monthly token quota is at or over the limit */
	const [quotaExhaustedIds, setQuotaExhaustedIds] = useState<string[]>([]);

	// On mount, fetch all text-generation models and check each one's monthly
	// usage restriction. Any model at or over its limit is added to quotaExhaustedIds
	// so it is greyed out in the model dropdown.
	useEffect(() => {
		let cancelled = false;
		async function checkQuotas() {
			try {
				// 1. Get all text-generation models
				const { pixelReturn } = await actions.run<
					[{ app_id: string }[]]
				>(
					`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
				);
				const engines = pixelReturn[0].output ?? [];
				if (cancelled) return;

				// 2. Get current month's usage for all engines in one call
				const now = new Date();
				const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
					.toISOString()
					.slice(0, 10);
				const endDate = now.toISOString().slice(0, 10);
				const ids = engines.map((e) => e.app_id);

				const { pixelReturn: usageReturn } = await actions.run<
					[{ ENGINE_ID: string; TOTAL_TOKENS: number }[]]
				>(
					`GetUserModelUsage(engine=[${ids.map((id) => `"${id}"`).join(", ")}], startDate=["${startDate}"], endDate=["${endDate}"]);`,
				);
				if (cancelled) return;

				const usageById = Object.fromEntries(
					(usageReturn[0].output ?? []).map((r) => [
						r.ENGINE_ID,
						r.TOTAL_TOKENS,
					]),
				);

				// 3. Check restrictions for every engine that has usage data
				// (GetUserModelUsage may return engines not in MyEngines)
				const allEngineIds = [
					...new Set([
						...engines.map((e) => e.app_id),
						...Object.keys(usageById),
					]),
				];

				const exhausted: string[] = [];
				await Promise.allSettled(
					allEngineIds.map(async (engineId) => {
						try {
							await actions.run(
								`GetUserModelUsageRestrictions(engine=["${engineId}"]);`,
							);
						} catch {
							// actions.run throws when the pixel returns ERROR — mark as exhausted
							exhausted.push(engineId);
						}
					}),
				);

				if (!cancelled) setQuotaExhaustedIds(exhausted);
			} catch {
				// ignore
			}
		}
		checkQuotas();
		return () => {
			cancelled = true;
		};
	}, [actions]);
	const [isConfigurationOpen, setIsConfgurationOpen] = useState(false);
	const [preCreatedRoom, setPreCreatedRoom] = useState<RoomStore | null>(
		null,
	);
	const submittedRef = useRef(false);
	const [mode, setMode] = useState<"chat" | "agent" | "workspace">("chat");
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
				// Persist the agent harness selection so the room stays in agent
				// mode across reloads.
				harnessType: mode === "agent" ? "semoss" : undefined,
			};

			// add workspace id and name
			if (mode === "workspace") {
				options.workspace = {
					workspace_id: getWorkspace.data?.workspace_id || "",
					name: getWorkspace.data?.name,
				};
			}

			if (preCreatedRoom) {
				// Room was pre-created so files could be uploaded to its insight.
				// Sync final mode/options, fire askMessage, then navigate.
				// Files from the file explorer are already in the insight —
				// only RoomInput drag/drop/paste attachments are passed here.
				preCreatedRoom.setMode(mode === "agent" ? "agent" : "chat");
				preCreatedRoom.setMetadata({ name: prompt.substring(0, 15) });
				await preCreatedRoom.updateRoomOptions(options);
				// Optimistically surface the room in the nav — GetPlaygroundRooms
				// won't return it until its first message has data.
				chat.addOptimisticRoom({
					ROOM_ID: preCreatedRoom.roomId,
					ROOM_NAME: prompt.substring(0, 100),
					DATE_CREATED: new Date().toISOString(),
					WORKSPACE_ID: options.workspace?.workspace_id,
				});
				// Fire-and-forget so we navigate without waiting on the response.
				(async () => {
					try {
						await preCreatedRoom.askMessage(prompt, files);
						runInAction(() => {
							chat.keys.roomCounter++;
						});
					} catch {
						chat.removeOptimisticRoom(preCreatedRoom.roomId);
					}
				})();
				submittedRef.current = true;
				navigate(`/room/${preCreatedRoom.roomId}`);
			} else {
				// Standard flow — create room and send first message together.
				const room = await chat.createRoom(
					mode === "agent" ? "agent" : "chat",
					prompt,
					files,
					options,
					getWorkspace.data?.workspace_id,
				);
				submittedRef.current = true;
				navigate(`/room/${room.roomId}`);
			}
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
			workspace: {
				workspace_id: getWorkspace.data.workspace_id,
				name: getWorkspace.data.name,
			},
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

	// Close the configuration panel when the file-explorer sidebar opens.
	useEffect(() => {
		if (preCreatedRoom?.sidebar.isOpen) {
			setIsConfgurationOpen(false);
		}
	}, [preCreatedRoom?.sidebar.isOpen]);

	// Discard a pre-created room if the user navigates away without submitting.
	useEffect(() => {
		return () => {
			if (preCreatedRoom && !submittedRef.current) {
				// Fire-and-forget server-side cleanup.
				chat.closeRoom(preCreatedRoom.roomId);
			}
		};
	}, [preCreatedRoom, chat]);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{root.theme.banner ? (
				<div
					ref={bannerRef}
					className="w-full shrink-0 bg-primary px-4 py-2 text-center text-sm text-white opacity-80 [&_a]:underline"
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
									disabledModelIds={quotaExhaustedIds}
									room={tempRoomStore}
									setModel={(m) => {
										chat.setSelectedModel(m);
									}}
									options={tempRoomStore.options}
									onMcpChange={(mcp) =>
										tempRoomStore.setOptions({
											...tempRoomStore.options,
											mcp,
										})
									}
									onWorkspaceChange={(next) => {
										if (next) {
											setMode("workspace");
											setSelectedWorkspaceId(
												next.workspace_id,
											);
											tempRoomStore.setOptions({
												...tempRoomStore.options,
												workspace: next,
											});
										} else {
											setMode("chat");
											setSelectedWorkspaceId("");
											tempRoomStore.setOptions({
												...tempRoomStore.options,
												workspace: undefined,
											});
										}
									}}
									onPrompt={async (prompt, files) => {
										await createRoom(prompt, files);

										return true;
									}}
									hidePauseButton
									excludeCommandIds={["compact"]}
									onOpenSettings={() =>
										setIsConfgurationOpen(true)
									}
									MenuComponent={observer(
										({
											onOpenChange,
											onOpenMcpOverlay,
										}) => (
											<>
												<RoomInputMenuUpload
													onSelect={() =>
														onOpenChange(false)
													}
												/>
												<DropdownMenuSeparator />
												{root.theme.featureFlags
													?.enableAgentHarness && (
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
																setMode(
																	"agent",
																);
																onOpenChange(
																	false,
																);
															}}
														>
															<BotIcon />
															<span className="flex-1">
																{t(
																	"room:modes.agent",
																)}
															</span>

															{mode ===
															"agent" ? (
																<div className="px-1">
																	<CheckIcon />
																</div>
															) : null}
														</DropdownMenuItem>
													</>
												)}
												<DropdownMenuItem
													onSelect={() => {
														onOpenMcpOverlay(
															"AGENT",
														);
														onOpenChange(false);
													}}
												>
													<BotIcon />
													<span className="flex-1">
														{t(
															"room:menuWorkspace.selectAgent",
														)}
													</span>
													{tempRoomStore.options
														.workspace ? (
														<div className="px-1">
															<CheckIcon />
														</div>
													) : null}
												</DropdownMenuItem>
												<RoomInputMenuMCP
													type="KNOWLEDGE"
													options={
														tempRoomStore.options
													}
													onSelect={() => {
														onOpenMcpOverlay(
															"KNOWLEDGE",
														);
														onOpenChange(false);
													}}
												/>
												<RoomInputMenuMCP
													type="TOOLBOX"
													options={
														tempRoomStore.options
													}
													onSelect={() => {
														onOpenMcpOverlay(
															"TOOLBOX",
														);
														onOpenChange(false);
													}}
												/>
												<DropdownMenuSeparator />
												{preCreatedRoom ? (
													<RoomInputMenuFileExplorer
														room={preCreatedRoom}
														onSelect={() =>
															onOpenChange(false)
														}
													/>
												) : (
													<RoomInputMenuNewFileExplorer
														mode={mode}
														options={
															tempRoomStore.options
														}
														onRoomCreated={(room) =>
															setPreCreatedRoom(
																room,
															)
														}
														onSelect={() =>
															onOpenChange(false)
														}
													/>
												)}
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
								{isConfigurationOpen && (
									<>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													className="absolute end-2 top-2 z-10"
													variant="ghost"
													size="icon-sm"
													onClick={() => {
														// close it
														setIsConfgurationOpen(
															false,
														);
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
														chat.setSelectedModel(
															model,
														);
													}
												}}
												agentEditable
												onOptionsChange={(opts) => {
													if (!opts) return;
													if ("workspace" in opts) {
														if (opts.workspace) {
															setMode(
																"workspace",
															);
															setSelectedWorkspaceId(
																opts.workspace
																	.workspace_id,
															);
														} else {
															setMode("chat");
															setSelectedWorkspaceId(
																"",
															);
														}
													}
													tempRoomStore.setOptions({
														...tempRoomStore.options,
														...opts,
													});
												}}
											/>
										</ScrollArea>
									</>
								)}
							</div>
						</ResizablePanel>
					</>
				)}
				{preCreatedRoom?.sidebar.isOpen && (
					<>
						<ResizableHandle />
						<ResizablePanel defaultSize={50} minSize={20}>
							<InsightProvider
								key={preCreatedRoom.roomId}
								options={{
									insightId: preCreatedRoom.insightId,
								}}
								destroyOnUnmount={false}
							>
								<RoomSidebar room={preCreatedRoom} />
							</InsightProvider>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
