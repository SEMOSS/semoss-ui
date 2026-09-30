import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	H2,
	Muted,
	toast,
	useTheme,
} from "@semoss/ui/next";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { RoomGreeting } from "@/components/room/room-greeting";
import { RoomInput } from "@/components/room/room-input";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { FileDragProvider } from "@/contexts/file-drag-context";
import { clearAgentOptions } from "@/features/conversation/clear-agent-options";
import { ConversationWorkspace } from "@/features/conversation/conversation-workspace";
import { DropHighlight } from "@/features/conversation/drop-highlight";
import { usePreparedRoom } from "@/features/conversation/use-prepared-room";
import { NextMessageRoomProvider } from "@/features/teamwork/sources/next-message-room";
import { DraftSettingsContext } from "@/features/workbench/draft-settings.context";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type { MCPConfig, Prompt, Workspace } from "@/types";

const ORCHESTRATOR_WORKSPACE_ID = "orchestrator-agent";
const ORCHESTRATOR_WORKSPACE_NAME = "Orchestrator Agent";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { t } = useTranslation([
		"room",
		"workspace",
		"common",
		"chat",
		"teamwork",
	]);
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();

	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const landingSrc = isDark
		? root.theme.images.landingDark
		: root.theme.images.landing;

	const { chat } = useChat();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Re-fetch the user's profile default model each time this page mounts so
	// changes made in the token-usage embed are reflected immediately.
	useEffect(() => {
		chat.refreshProfileDefaultModel();
	}, [chat]);

	const initialPrompt = searchParams.get("prompt") ?? "";

	const workspaceIdSearchParams = searchParams.get("workspaceId");
	const knowledgeId = searchParams.get("knowledgeId");

	/**
	 * State
	 */
	// Create a temporary RoomStore instance to handle options mutations
	// This prevents re-renders on tool selection since MobX handles the mutations
	const tempRoomStore = useMemo(
		() =>
			new RoomStore({
				theme: root.theme,
				roomId: "temp",
				panelComponents: ROOM_PANEL_COMPONENTS,
			}),
		[root.theme],
	);
	// Remember manual provenance when an agent also supplies the same resource.
	const manualMcpRef = useRef(
		new Map(
			tempRoomStore.options.mcp
				.filter((item) => !item.fromWorkspace)
				.map((item) => [item.id, item]),
		),
	);
	useEffect(() => {
		const next = new Map<string, MCPConfig>();
		for (const item of tempRoomStore.options.mcp) {
			const manual = item.fromWorkspace
				? manualMcpRef.current.get(item.id)
				: item;
			if (manual) next.set(item.id, manual);
		}
		manualMcpRef.current = next;
	}, [tempRoomStore.options.mcp]);
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
	const submittedRef = useRef(false);
	const greetingRoomStartedForRef = useRef<string>("");
	const [mode, setMode] = useState<"chat" | "agent">("chat");
	const {
		room: preCreatedRoom,
		isPreparing,
		hasError: preparationError,
		prepare,
	} = usePreparedRoom(tempRoomStore, mode, submittedRef);
	const workspaceRoom = preCreatedRoom ?? tempRoomStore;
	const pendingSourceRef = useRef<ConnectorViewerService | null>(null);

	// tempRoomStore is only created once (createRoom below builds the real,
	// separate room), so RoomInput's agent-harness chip — keyed off
	// room.mode — needs this synced explicitly rather than reading straight
	// off local mode state.
	useEffect(() => {
		tempRoomStore.setMode(mode);
	}, [mode, tempRoomStore]);
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
	const switchToAgentHarness = () => {
		setMode("agent");
		if (selectedWorkspaceId) return;
		setSelectedWorkspaceId(ORCHESTRATOR_WORKSPACE_ID);
		tempRoomStore.setOptions({
			...tempRoomStore.options,
			workspace: {
				workspace_id: ORCHESTRATOR_WORKSPACE_ID,
				name: ORCHESTRATOR_WORKSPACE_NAME,
			},
		});
	};
	// The agent whose default model has already been applied to the picker
	const appliedAgentModelRef = useRef<string>("");
	const appliedAgentOptionsRef = useRef<string>("");
	const [prompts, setPrompts] = useState<string[]>([]);
	const previewPrompts = useMemo(
		() => tempRoomStore.options.predefinedPrompts.slice(0, 5),
		[tempRoomStore.options.predefinedPrompts],
	);

	const getWorkspace = usePixel<Workspace | null>(
		selectedWorkspaceId
			? `GetWorkspace(${JSON.stringify(selectedWorkspaceId)});`
			: "",
		{
			data: null,
		},
	);

	const agentOptionsPending = Boolean(
		selectedWorkspaceId &&
			appliedAgentOptionsRef.current !== selectedWorkspaceId,
	);
	const agentLoadFailed =
		agentOptionsPending &&
		(getWorkspace.status === "ERROR" ||
			(getWorkspace.status === "SUCCESS" && !getWorkspace.data));

	// Direct/shared agent link, rather than the in-room "+" modal.
	const isWorkspaceFromUrl =
		!!workspaceIdSearchParams &&
		workspaceIdSearchParams === selectedWorkspaceId;

	// Only visible for the moment the greeting room below is being created.
	const agentGreeting =
		isWorkspaceFromUrl &&
		getWorkspace.data?.workspace_id === selectedWorkspaceId &&
		getWorkspace.data?.config_json?.greeting_enabled
			? (getWorkspace.data?.config_json?.greeting ?? "")
			: "";

	// Fetch knowledge vector engine if knowledgeId is provided
	const getKnowledge = usePixel<
		| {
				engine_id: string;
				engine_name: string;
				engine_display_name?: string;
		  }[]
		| null
	>(
		knowledgeId
			? `MyEngines( engine=["${knowledgeId}"], engineTypes=['VECTOR'],  metaFilters=[{}], userT = [true], limit=[15], offset=[0]);`
			: "",
		{ data: null },
	);

	const getPrompts = usePixel<Prompt[]>(
		selectedWorkspaceId && prompts.length > 0
			? `META | ListPrompt(filters=[Filter( (PROMPT__ID == [${prompts.map((p) => `"${p}"`).join(", ")}]) )])`
			: "",
		{
			data: [],
		},
	);
	useEffect(() => {
		void tempRoomStore.teamwork.loadUserConnectors();
	}, [tempRoomStore]);

	// On initial load, set the default options from the theme using the temporary RoomStore
	useEffect(() => {
		tempRoomStore.setOptions({
			instructions: "",
			mcp: [...(root.theme.defaultTools || [])],
			workspace: undefined,
			predefinedPrompts: [],
			temperature: root.theme.featureFlags?.enableTemperature
				? (root.theme.defaultRoomSettings?.temperature ?? 0)
				: undefined,
		});
	}, [tempRoomStore, root.theme]);

	/**
	 * Options shared by every room-creation path: current MCPs, the agent
	 * harness selection, and the selected workspace (if any).
	 */
	const buildRoomOptions = (): RoomStore["options"] => {
		const options = {
			...tempRoomStore.options,
			mcp: tempRoomStore.options.mcp,
			// Persisted so agent mode survives a reload.
			harnessType: mode === "agent" ? "semoss" : undefined,
		};
		if (
			selectedWorkspaceId === ORCHESTRATOR_WORKSPACE_ID &&
			!options.agents &&
			Array.isArray(getWorkspace.data?.config_json?.subagents)
		) {
			options.agents = getWorkspace.data.config_json.subagents.map(
				(entry) => ({ workspaceId: entry.workspaceId }),
			);
		}

		return options;
	};

	/** Transfer queued context and copy connectors before the first message. */
	const prepareRoom = async (room: RoomStore): Promise<void> => {
		try {
			await room.teamwork.adopt(tempRoomStore.teamwork);
		} catch (error) {
			toast.error(
				t("teamwork:connectors.adoptError", {
					message: error instanceof Error ? error.message : "",
				}),
			);
		}
	};

	/** Shared error handling for every room-creation path below. */
	const handleCreateRoomError = (error: unknown) => {
		const sdkError = error as { message: string; code?: number };
		if (
			sdkError.code !== undefined &&
			(sdkError.code === 403 || sdkError.code === 302)
		) {
			// User is unauthorized, likely due to expired session. Prompt them to log in again.
			toast.error(t("chat:gracefulErrors.inactivity"));
			return;
		}

		toast.error(t("room:errors.createRoom", { message: sdkError.message }));
	};

	/**
	 * Create a new room and ask the model
	 *
	 * @param prompt The prompt to ask
	 * @param files The files to upload
	 * @param askOptions Options for the kickoff message (e.g. visible: false)
	 */
	const createRoom = async (
		prompt: string,
		files: File[],
		askOptions?: { visible?: boolean },
	) => {
		// ignore if loading
		if (isLoading || isPreparing || agentOptionsPending) {
			return false;
		}

		try {
			// turn the loading screen
			setIsLoading(true);

			const options = buildRoomOptions();

			if (preCreatedRoom) {
				// Room was pre-created so files could be uploaded to its insight.
				// Sync final mode/options, fire askMessage, then navigate.
				// Files from the file explorer are already in the insight —
				// only RoomInput drag/drop/paste attachments are passed here.
				preCreatedRoom.setModel(chat.models.selected);
				preCreatedRoom.setMode(mode === "agent" ? "agent" : "chat");
				preCreatedRoom.setMetadata({ name: prompt.substring(0, 15) });
				if (selectedWorkspaceId) {
					await preCreatedRoom.runRoomPixel(
						`SetRoomWorkspace(roomId=${JSON.stringify(preCreatedRoom.roomId)}, workspaceId=${JSON.stringify(selectedWorkspaceId)});`,
					);
				}
				await preCreatedRoom.updateRoomOptions(options);
				await prepareRoom(preCreatedRoom);
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
						await preCreatedRoom.askMessage(
							prompt,
							files,
							askOptions,
						);
						runInAction(() => {
							chat.keys.roomCounter++;
						});
					} catch (e) {
						if ((e as Error)?.name === "UploadError") {
							toast.error(t("room:errors.fileInUse"));
						}
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
					options.workspace?.workspace_id,
					askOptions,
					prepareRoom,
				);
				submittedRef.current = true;
				navigate(`/room/${room.roomId}`);
			}
			return true;
		} catch (error: unknown) {
			handleCreateRoomError(error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Start a message-less room for an agent's scripted greeting. No pixel
	 * ever writes a message, so the greeting never reaches the model as
	 * context. URL-routed workspaces only.
	 */
	const startAgentGreetingRoom = async (
		workspaceId: string,
		name: string,
	) => {
		if (isLoading || isPreparing) {
			return;
		}

		// Claimed here, not in the effect, so bailing above stays retryable.
		greetingRoomStartedForRef.current = workspaceId;

		try {
			setIsLoading(true);

			const options = buildRoomOptions();
			const room = await chat.createEmptyRoom(
				mode === "agent" ? "agent" : "chat",
				name,
				options,
				workspaceId,
				prepareRoom,
			);
			submittedRef.current = true;
			navigate(`/room/${room.roomId}`);
		} catch (error: unknown) {
			handleCreateRoomError(error);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Effects
	 */
	// Handle workspace data loading
	useEffect(() => {
		if (workspaceIdSearchParams) {
			setSelectedWorkspaceId(workspaceIdSearchParams);
		}
	}, [workspaceIdSearchParams]);

	// Handle workspace data loading from RoomWorkspace component selection
	useEffect(() => {
		if (!selectedWorkspaceId) {
			// clearing the agent clears the guard below, so picking the same
			// agent again applies its default model again
			appliedAgentModelRef.current = "";
			appliedAgentOptionsRef.current = "";
			if (chat.profileDefaultModelId) {
				void chat.selectModelById(chat.profileDefaultModelId);
			}
			return;
		}
		if (getWorkspace.status !== "SUCCESS" || !getWorkspace.data) {
			return;
		}
		// Switching agents changes selectedWorkspaceId a render before the
		// pixel catches up, so this effect fires once holding the outgoing
		// agent's data. Applying it would merge the wrong agent's settings and,
		// worse, mark the incoming agent as already handled below.
		if (getWorkspace.data.workspace_id !== selectedWorkspaceId) {
			return;
		}

		if (appliedAgentOptionsRef.current === selectedWorkspaceId) return;
		appliedAgentOptionsRef.current = selectedWorkspaceId;
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

		// An agent that names a default model switches the picker to it, once
		// per selection - the ref keeps a refetch from overriding a model the
		// user picked by hand afterwards. An agent with no default leaves the
		// current model alone.
		const agentModelId = getWorkspace.data.config_json?.model_id ?? "";
		if (
			agentModelId &&
			appliedAgentModelRef.current !== selectedWorkspaceId
		) {
			appliedAgentModelRef.current = selectedWorkspaceId;
			void chat.selectModelById(agentModelId);
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
			instructions: getWorkspace.data.system_prompt || "",
			mcp: Array.from(mcpMap.values()),
			workspace: {
				workspace_id: getWorkspace.data.workspace_id,
				name: getWorkspace.data.name,
			},
		});
	}, [
		selectedWorkspaceId,
		getWorkspace.status,
		getWorkspace.data,
		tempRoomStore,
		chat,
	]);

	// A URL-routed agent with a greeting drops straight into a room with it
	// already rendered, instead of the landing page.
	// biome-ignore lint/correctness/useExhaustiveDependencies: greetingRoomStartedForRef guards re-fires; re-listing the rest would re-run this every render
	useEffect(() => {
		if (!isWorkspaceFromUrl) {
			return;
		}
		if (
			!selectedWorkspaceId ||
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data
		) {
			return;
		}
		// Same outgoing-agent-data guard as the effect above.
		if (getWorkspace.data.workspace_id !== selectedWorkspaceId) {
			return;
		}
		if (greetingRoomStartedForRef.current === selectedWorkspaceId) {
			return;
		}

		const cfg = getWorkspace.data.config_json;
		if (!cfg?.greeting_enabled || !cfg.greeting) {
			return;
		}

		void startAgentGreetingRoom(
			selectedWorkspaceId,
			getWorkspace.data.name,
		);
	}, [
		isWorkspaceFromUrl,
		selectedWorkspaceId,
		getWorkspace.status,
		getWorkspace.data,
	]);

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
			name:
				getKnowledge.data[0].engine_display_name ||
				getKnowledge.data[0].engine_name ||
				knowledgeId,
		};

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: [...tempRoomStore.options.mcp, knowledgeMcp],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, tempRoomStore]);

	// Handle prompts from URL parameter
	useEffect(() => {
		if (
			!selectedWorkspaceId ||
			prompts.length === 0 ||
			getPrompts.status !== "SUCCESS" ||
			!getPrompts.data?.length
		) {
			return;
		}

		const loadedPrompts: Prompt[] = getPrompts.data
			.filter((prompt) => prompts.includes(prompt.id))
			.map((p) => ({
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
			predefinedPrompts: loadedPrompts,
		});
	}, [
		selectedWorkspaceId,
		prompts,
		getPrompts.status,
		getPrompts.data,
		tempRoomStore,
	]);

	const handleAgentChange = (
		next: RoomStore["options"]["workspace"] | null,
		activateAgentMode = false,
	) => {
		if (isLoading || isPreparing) return;
		if (
			next?.workspace_id !== tempRoomStore.options.workspace?.workspace_id
		) {
			appliedAgentOptionsRef.current = "";
			appliedAgentModelRef.current = "";
			setPrompts([]);
			const cleared = clearAgentOptions(tempRoomStore.options);
			tempRoomStore.setOptions({
				...cleared,
				mcp: Array.from(
					new Map(
						[...manualMcpRef.current.values(), ...cleared.mcp].map(
							(item) => [item.id, item],
						),
					).values(),
				),
				workspace: next ?? undefined,
			});
		}
		setSelectedWorkspaceId(next?.workspace_id ?? "");
		if (activateAgentMode && root.theme.featureFlags?.enableAgentHarness)
			setMode("agent");
	};
	const handleSelectChat = () => {
		handleAgentChange(null);
		setMode("chat");
	};
	const handleOpenSettings = () => {
		workspaceRoom.openSidebarPanel(
			ROOM_PANEL_TYPES.CONFIGURATION,
			{},
			t("room:settings.panelTitle"),
		);
	};
	const handleOpenFiles = async () => {
		pendingSourceRef.current = null;
		const room = await prepare();
		if (!room) return;
		room.openSidebarFileExplorer(
			undefined,
			t("room:menuFileExplorer.name"),
		);
	};
	const handleOpenSource = async (
		service: ConnectorViewerService,
	): Promise<void> => {
		if (isLoading) return;
		pendingSourceRef.current = service;
		// Sources and Files share preparation, layout transfer, and abandoned-draft cleanup.
		const room = await prepare();
		if (room) room.teamwork.openSourcePanel(service);
		else handleOpenWorkArea();
	};
	const handleOpenActivity = preCreatedRoom
		? () => {
				preCreatedRoom.openSidebarPanel(
					ROOM_PANEL_TYPES.AUDIT_LOG,
					{},
					t("room:studio.activityLog"),
				);
			}
		: undefined;

	const handleOpenWorkArea = () => {
		if (
			workspaceRoom.workbench.getState().layout.openPanelIds.length === 0
		) {
			handleOpenSettings();
			return;
		}
		workspaceRoom.openSidebar();
	};

	const workbench = (
		<RoomSidebar
			room={workspaceRoom}
			canPublish={Boolean(preCreatedRoom)}
			workspaceActions={{
				onOpenFiles: () => void handleOpenFiles(),
				onOpenSettings: handleOpenSettings,
				onOpenActivity: handleOpenActivity,
				isPreparing: isPreparing || isLoading,
				showActivityLog:
					root.theme.featureFlags?.showActivityLog !== false,
			}}
		/>
	);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{root.theme.banner ? (
				<div
					ref={bannerRef}
					className="w-full shrink-0 bg-primary px-4 py-2 text-center text-primary-foreground text-sm [&_a]:underline"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{ __html: root.theme.banner }}
				/>
			) : null}
			<div className="min-h-0 flex-1">
				<ConversationWorkspace
					isOpen={workspaceRoom.sidebar.isOpen}
					onOpenWorkArea={handleOpenWorkArea}
					panel={
						<DraftSettingsContext.Provider
							value={{
								disabled:
									isLoading ||
									isPreparing ||
									agentOptionsPending,
								model: chat.models.selected,
								options: tempRoomStore.options,
								onModelChange: (model) => {
									if (model) chat.setSelectedModel(model);
								},
								onAgentModeSelected: () => {
									if (
										root.theme.featureFlags
											?.enableAgentHarness
									)
										switchToAgentHarness();
								},
								agentEditable: mode !== "agent",
								isAgentMode: mode === "agent",
								onOptionsChange: (opts) => {
									if ("workspace" in opts)
										handleAgentChange(
											opts.workspace ?? null,
										);
									tempRoomStore.setOptions({
										...tempRoomStore.options,
										...opts,
									});
								},
							}}
						>
							<div className="flex h-full min-h-0 flex-col">
								{preparationError && (
									<Alert
										variant="destructive"
										className="m-4 w-auto"
									>
										<AlertDescription>
											{t("room:studio.prepareError")}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													void (pendingSourceRef.current
														? handleOpenSource(
																pendingSourceRef.current,
															)
														: handleOpenFiles())
												}
											>
												{t("room:studio.retry")}
											</Button>
										</AlertDescription>
									</Alert>
								)}
								<div className="min-h-0 flex-1">
									{preCreatedRoom ? (
										<InsightProvider
											key={preCreatedRoom.roomId}
											options={{
												insightId:
													preCreatedRoom.insightId,
											}}
											destroyOnUnmount={false}
										>
											<NextMessageRoomProvider
												room={tempRoomStore}
											>
												{workbench}
											</NextMessageRoomProvider>
										</InsightProvider>
									) : (
										workbench
									)}
								</div>
							</div>
						</DraftSettingsContext.Provider>
					}
				>
					<FileDragProvider>
						{landingSrc && (
							<img
								src={landingSrc}
								alt=""
								className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
							/>
						)}
						<DropHighlight className="flex h-full flex-col items-center overflow-auto px-4 py-8 sm:px-6">
							<div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-6">
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
										<H2 className="text-center">
											{t("room:welcome", {
												name: chat.user.name,
											})}
										</H2>
										{root.theme.description ? (
											<Muted className="text-center">
												{root.theme.description}
											</Muted>
										) : null}
									</div>
								)}
								{agentGreeting && (
									<RoomGreeting
										room={tempRoomStore}
										greeting={agentGreeting}
									/>
								)}
								{agentLoadFailed && (
									<Alert variant="destructive">
										<AlertDescription>
											{t("room:settings.agentLoadError")}
										</AlertDescription>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={getWorkspace.refresh}
										>
											{t("room:studio.retry")}
										</Button>
									</Alert>
								)}
								<RoomInput
									predefinedPrompts={
										tempRoomStore.options.predefinedPrompts
									}
									className="max-h-72"
									isLoading={isLoading || isPreparing}
									isSubmitDisabled={agentOptionsPending}
									initialValue={initialPrompt}
									model={chat.models.selected}
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
									onWorkspaceChange={handleAgentChange}
									onPrompt={createRoom}
									excludeCommandIds={[
										"compact",
										...(root.theme.featureFlags
											?.enableAgentHarness
											? []
											: ["agent-harness", "harness"]),
									]}
									onSwitchToAgentHarness={
										switchToAgentHarness
									}
									onExitAgentHarness={handleSelectChat}
									// The new-room flow has no cancellable turn, so
									// it's only ever busy (spinner) or idle (send).
									sendState={
										isLoading || isPreparing
											? "loading"
											: "send"
									}
									onOpenSettings={handleOpenSettings}
									showChatTools={false}
									onOpenSource={(service) =>
										void handleOpenSource(service)
									}
								/>
								{tempRoomStore.options.predefinedPrompts
									.length > 0 ? (
									<div className="mx-auto flex w-full flex-col items-center gap-3">
										<div className="flex w-full flex-wrap justify-center gap-2">
											{previewPrompts.map((prompt) => {
												return (
													<Button
														key={prompt.id}
														variant="outline"
														className="h-auto min-h-10 max-w-full gap-2 whitespace-normal rounded-xl px-4 py-2 text-start"
														disabled={
															isLoading ||
															isPreparing
														}
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
						</DropHighlight>
					</FileDragProvider>
				</ConversationWorkspace>
			</div>
		</div>
	);
});
