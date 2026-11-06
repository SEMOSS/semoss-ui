import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Session } from "@semoss/sdk";
import {
	InsightProvider,
	useRoomSelector,
	useRoomsClient,
	useSession,
	useSessionPixel,
} from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	H2,
	Muted,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { FileDragProvider } from "../../contexts/file-drag.context";
import { useChat } from "../../host/chat.context";
import type { MCPConfig, Prompt, Workspace } from "../../types";
import { RoomComposer } from "../composer/room-composer";
import { canChooseAgentMode } from "../conversation/agent-mode-choice";
import { clearAgentOptions } from "../conversation/clear-agent-options";
import { DropHighlight } from "../conversation/drop-highlight";
import { NextMessageRoomProvider } from "../conversation/next-message-room.context";
import { RoomGreeting } from "../conversation/room-greeting";
import { useNewRoom } from "../conversation/use-new-room";
import { RoomHeader } from "../room-header/room-header";
import { DraftSettingsContext } from "../workbench/draft-settings.context";
import { FittedRoomLayout } from "../workbench/fitted-room-layout";
import { ROOM_PANEL_TYPES } from "../workbench/room-sidebar";
import { RoomUiStore } from "../workbench/room-ui.store";
import { RoomWorkbench } from "../workbench/room-workbench";
import {
	NEW_ROOM_READY_PANEL_KINDS,
	type NewRoomPanelRequest,
	type NewRoomWorkbenchPanels,
} from "../workbench/use-workbench-panels";

/** Props for {@link NewRoomView}. */
export interface NewRoomViewProps {
	/** The agent the new chat starts with, by its workspace id. */
	agentId?: string | null;
	/** A knowledge source the new chat starts with. */
	knowledgeId?: string | null;
	/** Text the composer starts with. */
	initialPrompt?: string;
	/** Full width above the view, such as the host's announcement banner. */
	banner?: ReactNode;
	/** Behind the welcome and the composer, such as a landing image. */
	background?: ReactNode;
	/**
	 * The welcome above the composer, in place of the chat's greeting by the
	 * user's name.
	 */
	welcome?: ReactNode;
	/** A line under the chat's own greeting, such as what the host is for. */
	description?: ReactNode;
	/** What the header puts before the chat's name, such as navigation. */
	headerLeading?: ReactNode;
}

/**
 * A new chat: a draft room whose options, agent and Workspace the user sets
 * up before the first message creates the room, which the host's
 * navigation then shows.
 *
 * @component
 */
export const NewRoomView = ({
	agentId = null,
	knowledgeId = null,
	initialPrompt = "",
	banner,
	background,
	welcome,
	description,
	headerLeading,
}: NewRoomViewProps) => {
	const { t } = useTranslation([
		"room",
		"workspace",
		"common",
		"chat",
		"chatConnectors",
	]);
	const { chat, config } = useChat();

	// Re-read the user each time this page mounts so a default model set in
	// the token-usage embed is reflected immediately.
	const profileDefaultModelId = useSession(
		(state) => state.user?.defaultModels.textGeneration ?? "",
	);
	const userName = useSession((state) => state.user?.name ?? "");
	useEffect(() => {
		void Session.reloadUser();
	}, []);
	useEffect(() => {
		chat.applyProfileDefaultModel(profileDefaultModelId);
	}, [chat, profileDefaultModelId]);

	const workspaceIdSearchParams = agentId;

	/**
	 * State
	 */
	// The new room holds the new chat's options until its first message;
	// readers subscribe to it, so tool selection does not re-render the page
	const newRoom = useMemo(
		() =>
			new RoomUiStore({
				host: config,
				roomId: "temp",
				config: chat.config.engine,
				// no insight for Files to read until the draft prepares its room
				includeFiles: false,
			}),
		[config, chat],
	);
	// the draft's options and the model new rooms run on, as they render
	const newRoomOptions = useRoomSelector(newRoom, (r) => r.options);
	const selectedModel = useRoomsClient(chat, (c) => c.models.selected);
	// Remember manual provenance when an agent also supplies the same resource.
	const manualMcpRef = useRef(
		new Map(
			newRoom.options.mcp
				.filter((item) => !item.fromWorkspace)
				.map((item) => [item.id, item]),
		),
	);
	useEffect(() => {
		const next = new Map<string, MCPConfig>();
		for (const item of newRoomOptions.mcp) {
			const manual = item.fromWorkspace
				? manualMcpRef.current.get(item.id)
				: item;
			if (manual) next.set(item.id, manual);
		}
		manualMcpRef.current = next;
	}, [newRoomOptions.mcp]);
	const [isLoading, setIsLoading] = useState(false);
	const submittedRef = useRef(false);
	const greetingRoomStartedForRef = useRef<string>("");
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
	const [chosenMode, setChosenMode] = useState<"chat" | "agent">("chat");
	// With modeFollowsAgent the agent picker decides the mode: a saved agent
	// or Default Agent runs in agent mode, No Agent in chat mode.
	const modeFollowsAgent = !!config.featureFlags.modeFollowsAgent;
	const mode: "chat" | "agent" =
		modeFollowsAgent && selectedWorkspaceId ? "agent" : chosenMode;
	const {
		room: preparedRoom,
		isPreparing,
		hasError: preparationError,
		prepare,
	} = useNewRoom(newRoom, mode, submittedRef);
	// the room whose Workspace shows: the prepared room once there is one
	const workbenchRoom = preparedRoom ?? newRoom;
	// what Retry opens again after a failed preparation
	const pendingPanelRef = useRef<NewRoomPanelRequest>({ kind: "workbench" });

	// newRoom is only created once (createRoom below builds the real,
	// separate room), so RoomComposer's agent-harness chip — keyed off
	// room.mode — needs this synced explicitly rather than reading straight
	// off local mode state.
	useEffect(() => {
		newRoom.setMode(mode);
	}, [mode, newRoom]);
	// The agent whose default model has already been applied to the picker
	const appliedAgentModelRef = useRef<string>("");
	const appliedAgentOptionsRef = useRef<string>("");
	const [prompts, setPrompts] = useState<string[]>([]);
	const previewPrompts = useMemo(
		() => newRoomOptions.predefinedPrompts.slice(0, 5),
		[newRoomOptions.predefinedPrompts],
	);

	const getWorkspace = useSessionPixel<Workspace | null>(
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
	const getKnowledge = useSessionPixel<
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

	const getPrompts = useSessionPixel<Prompt[]>(
		selectedWorkspaceId && prompts.length > 0
			? `META | ListPrompt(filters=[Filter( (PROMPT__ID == [${prompts.map((p) => `"${p}"`).join(", ")}]) )])`
			: "",
		{
			data: [],
		},
	);
	// what the draft's integrations offer before it has a room
	useEffect(() => {
		void newRoom.prepareDraftIntegrations();
	}, [newRoom]);

	// On initial load, set the default options from the host
	useEffect(() => {
		newRoom.setOptions({
			instructions: "",
			mcp: [...(config.defaultTools ?? [])],
			workspace: undefined,
			predefinedPrompts: [],
			temperature: config.featureFlags.enableTemperature
				? (config.defaultTemperature ?? 0)
				: undefined,
		});
	}, [newRoom, config]);

	/**
	 * Options shared by every room-creation path: current MCPs, the agent
	 * harness selection, and the selected workspace (if any).
	 */
	const buildRoomOptions = (): RoomUiStore["options"] => {
		const options = {
			...newRoom.options,
			mcp: newRoom.options.mcp,
			// Persisted so agent mode survives a reload.
			harnessType: mode === "agent" ? "semoss" : undefined,
		};

		return options;
	};

	/**
	 * Transfer queued context and the draft's integrations, such as its
	 * connectors, before the first message.
	 */
	const prepareRoom = async (room: RoomUiStore): Promise<void> => {
		room.contextItems.adopt(newRoom.contextItems);
		try {
			await room.adoptIntegrations(newRoom);
		} catch (error) {
			toast.error(
				t("chatConnectors:connectors.adoptError", {
					message: getErrorMessage(error, ""),
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

			if (preparedRoom) {
				// Room was pre-created so files could be uploaded to its insight.
				// Sync final mode/options, fire askMessage, then navigate.
				// Files from the file explorer are already in the insight —
				// only RoomComposer drag/drop/paste attachments are passed here.
				preparedRoom.setModel(chat.models.selected);
				preparedRoom.setMode(mode === "agent" ? "agent" : "chat");
				preparedRoom.setMetadata({ name: prompt.substring(0, 15) });
				await preparedRoom.updateRoomOptions(options);
				await prepareRoom(preparedRoom);
				// Optimistically surface the room in the nav — GetPlaygroundRooms
				// won't return it until its first message has data.
				chat.addOptimisticRoom({
					ROOM_ID: preparedRoom.roomId,
					ROOM_NAME: prompt.substring(0, 100),
					DATE_CREATED: new Date().toISOString(),
					WORKSPACE_ID: options.workspace?.workspace_id,
				});
				// Fire-and-forget so we navigate without waiting on the response.
				(async () => {
					try {
						await preparedRoom.askMessage(
							prompt,
							files,
							askOptions,
						);
						chat.bumpRoomsVersion();
					} catch (e) {
						if ((e as Error)?.name === "UploadError") {
							toast.error(t("room:errors.fileInUse"));
						}
						chat.removeOptimisticRoom(preparedRoom.roomId);
					}
				})();
				submittedRef.current = true;
				config.navigation.onOpenRoom(preparedRoom.roomId);
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
				config.navigation.onOpenRoom(room.roomId);
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
			config.navigation.onOpenRoom(room.roomId);
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

	// Handle workspace data loading
	useEffect(() => {
		if (!selectedWorkspaceId) {
			// clearing the agent clears the guard below, so picking the same
			// agent again applies its default model again
			appliedAgentModelRef.current = "";
			appliedAgentOptionsRef.current = "";
			if (profileDefaultModelId) {
				void chat.selectModelById(profileDefaultModelId);
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
		// Sync options
		// Add workspace MCPs with fromWorkspace flag to the mcp array
		const workspaceMCPs = (getWorkspace.data.mcp || []).map((mcp) => ({
			...mcp,
			fromWorkspace: true,
		}));

		// Preserve existing tools that are not from workspace
		const nonWorkspaceMCPs = newRoom.options.mcp.filter(
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
		newRoom.setOptions({
			...newRoom.options,
			instructions: getWorkspace.data.system_prompt || "",
			mcp: Array.from(mcpMap.values()),
			workspace: {
				workspace_id: getWorkspace.data.workspace_id,
				name: getWorkspace.data.display_name || getWorkspace.data.name,
			},
		});
	}, [
		selectedWorkspaceId,
		getWorkspace.status,
		getWorkspace.data,
		newRoom,
		chat,
		profileDefaultModelId,
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
			getWorkspace.data.display_name || getWorkspace.data.name,
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

		// Add the knowledge MCP to options
		// Check if this knowledge MCP already exists
		const existingMcp = newRoom.options.mcp.find(
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

		newRoom.setOptions({
			...newRoom.options,
			mcp: [...newRoom.options.mcp, knowledgeMcp],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, newRoom]);

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

		newRoom.setOptions({
			...newRoom.options,
			predefinedPrompts: loadedPrompts,
		});
	}, [
		selectedWorkspaceId,
		prompts,
		getPrompts.status,
		getPrompts.data,
		newRoom,
	]);

	const handleAgentChange = (
		next: RoomUiStore["options"]["workspace"] | null,
	) => {
		if (isLoading || isPreparing) return;
		if (next?.workspace_id !== newRoom.options.workspace?.workspace_id) {
			appliedAgentOptionsRef.current = "";
			appliedAgentModelRef.current = "";
			setPrompts([]);
			const cleared = clearAgentOptions(newRoom.options);
			newRoom.setOptions({
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
	};
	const handleSelectChat = () => {
		setChosenMode("chat");
	};
	const handleDefaultAgentChange = (isDefaultAgent: boolean) => {
		if (isLoading || isPreparing) return;
		setChosenMode(isDefaultAgent ? "agent" : "chat");
	};
	/** Shows the Workspace, or one of its panels, in a room. */
	const showPanel = (
		room: RoomUiStore,
		request: NewRoomPanelRequest,
	): void => {
		switch (request.kind) {
			case "workbench":
				room.openSidebar();
				return;
			case "settings":
				room.openRoomSettings();
				return;
			case "files":
				room.openSidebarFileExplorer();
				return;
			case "activity":
				room.openSidebarPanel(
					ROOM_PANEL_TYPES.AUDIT_LOG,
					{},
					t("room:workspacePlaces.activity"),
				);
				return;
			case "integration":
				room.openSidebarPanel(request.type, {}, request.name);
		}
	};

	/**
	 * Opens the Workspace or one of its panels, preparing the draft's room for
	 * it. Every request shares preparation, layout transfer, and
	 * abandoned-draft cleanup. The Workspace and Settings show on the draft at
	 * once and carry over to the room, unless closed meanwhile; Files, the
	 * activity log, and the viewers read the room's insight, so they wait for
	 * it. A failure shows in the Workspace, where Retry opens the same panel.
	 *
	 * @param request - What to open.
	 */
	const openPanel = async (request: NewRoomPanelRequest): Promise<void> => {
		// submitting builds its own room
		if (isLoading) return;
		if (preparedRoom) {
			showPanel(preparedRoom, request);
			return;
		}
		pendingPanelRef.current = request;
		const isReady = NEW_ROOM_READY_PANEL_KINDS.has(request.kind);
		if (isReady) showPanel(newRoom, request);
		const room = await prepare();
		if (!room) {
			if (!isReady) newRoom.openSidebar();
			return;
		}
		if (!isReady) showPanel(room, request);
		else if (newRoom.sidebar.isOpen) room.openSidebar();
	};

	const handleRetryPreparation = () => {
		void openPanel(pendingPanelRef.current);
	};

	const newRoomPanels: NewRoomWorkbenchPanels = {
		onOpenPanel: (request) => void openPanel(request),
		isBusy: isPreparing || isLoading,
		draft: newRoom,
	};

	const workbench = <RoomWorkbench room={workbenchRoom} />;

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{banner}
			<div className="min-h-0 flex-1">
				<FittedRoomLayout
					room={workbenchRoom}
					// a preparation error needs the space, so the Workspace fills
					shouldFill={preparationError}
					header={
						<RoomHeader
							room={workbenchRoom}
							newRoomPanels={newRoomPanels}
							leading={headerLeading}
						/>
					}
					workbench={
						<DraftSettingsContext.Provider
							value={{
								disabled:
									isLoading ||
									isPreparing ||
									agentOptionsPending,
								model: selectedModel,
								options: newRoomOptions,
								onModelChange: (model) => {
									if (model) chat.setSelectedModel(model);
								},
								agentEditable: true,
								isAgentMode: mode === "agent",
								onDefaultAgentChange: modeFollowsAgent
									? handleDefaultAgentChange
									: undefined,
								onOptionsChange: (opts) => {
									if ("workspace" in opts)
										handleAgentChange(
											opts.workspace ?? null,
										);
									newRoom.setOptions({
										...newRoom.options,
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
												onClick={handleRetryPreparation}
											>
												{t("room:studio.retry")}
											</Button>
										</AlertDescription>
									</Alert>
								)}
								<div className="min-h-0 flex-1">
									{preparedRoom ? (
										<InsightProvider
											key={preparedRoom.roomId}
											options={{
												insightId:
													preparedRoom.insightId,
											}}
											destroyOnUnmount={false}
										>
											<NextMessageRoomProvider
												room={newRoom}
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
						{background}
						<DropHighlight className="flex h-full flex-col items-center overflow-auto px-4 py-8 sm:px-6">
							<div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-6">
								{welcome ?? (
									<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
										<H2 className="text-center">
											{t("room:welcome", {
												name: userName,
											})}
										</H2>
										{description ? (
											<Muted className="text-center">
												{description}
											</Muted>
										) : null}
									</div>
								)}
								{agentGreeting && (
									<RoomGreeting
										room={newRoom}
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
								<RoomComposer
									predefinedPrompts={
										newRoomOptions.predefinedPrompts
									}
									className="max-h-72"
									isLoading={isLoading || isPreparing}
									isSubmitDisabled={agentOptionsPending}
									initialValue={initialPrompt}
									model={selectedModel}
									room={newRoom}
									setModel={(m) => {
										chat.setSelectedModel(m);
									}}
									options={newRoomOptions}
									onMcpChange={(mcp) =>
										newRoom.setOptions({
											...newRoom.options,
											mcp,
										})
									}
									onWorkspaceChange={handleAgentChange}
									onPrompt={createRoom}
									excludeCommandIds={
										canChooseAgentMode(config.featureFlags)
											? []
											: ["agent-harness", "chat-mode"]
									}
									onSwitchToAgentHarness={() =>
										setChosenMode("agent")
									}
									onExitAgentHarness={handleSelectChat}
									onDefaultAgentChange={
										modeFollowsAgent
											? handleDefaultAgentChange
											: undefined
									}
									// The new-room flow has no cancellable turn, so
									// it's only ever busy (spinner) or idle (send).
									sendState={
										isLoading || isPreparing
											? "loading"
											: "send"
									}
									workbenchPanels={{
										room: workbenchRoom,
										newRoomPanels: newRoomPanels,
									}}
								/>
								{newRoomOptions.predefinedPrompts.length > 0 ? (
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
				</FittedRoomLayout>
			</div>
		</div>
	);
};
