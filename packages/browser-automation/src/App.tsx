import {
	Check,
	ChevronDown,
	ChevronRight,
	Circle,
	Copy,
	ScanLine,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { AutomationActionIndicator } from "./components/AutomationActionIndicator";
import { AutomationControls } from "./components/AutomationControls";
import { BrowserTabStrip } from "./components/BrowserTabStrip";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BrowserViewer } from "./components/BrowserViewer";
import { PlaybackCompleteDialog } from "./components/dialogs/PlaybackCompleteDialog";
import { ReturnToPlaygroundDialog } from "./components/dialogs/ReturnToPlaygroundDialog";
import { SaveRecordingDialog } from "./components/dialogs/SaveRecordingDialog";
import { StopRecordingDialog } from "./components/dialogs/StopRecordingDialog";
import { PlaygroundStartPrompt } from "./components/PlaygroundStartPrompt";
import { ReplaySidebar } from "./components/replay/ReplaySidebar";
import { normalizeBrowserUrl } from "./domain/browser-url";
import {
	applyGeneratedRecordingMetadata,
	buildRecordingFileName,
	enrichEnvelopeForRoomSave,
	getRecordingStartUrl,
} from "./domain/recording";
import {
	appendBoundedSelectedContext,
	MAX_SELECTED_CONTEXT_CHARS,
	renderSelectedTextContext,
	selectedContextsForPlayground,
} from "./domain/selected-text";
import {
	getToolStringMapParameter,
	getToolStringParameter,
	isPlayRecordingTool,
} from "./domain/tool-context";
import { useBrowserSocket } from "./hooks/useBrowserSocket";
import { usePlaybackController } from "./hooks/usePlaybackController";
import { useRemoteBrowserSession } from "./hooks/useRemoteBrowserSession";
import {
	bindSemossInsightToRoom,
	generatePlaywrightRecordingMetadata,
	getSemossInsightId,
	initSemoss,
	listPlaywrightRoomRecordings,
	listRecordingMetadataModels,
	resolvePlaywrightRoomRecording,
	sendMcpResponseToPlayground,
	subscribeToMcpToolContext,
} from "./semoss/client";
import { runPixel } from "./semoss/pixel";
import type {
	BrowserScrollMetrics,
	BrowserTabInfo,
	ClientToServerEvent,
	LoadedRecordingStep,
	McpToolContext,
	RecordingMetadataModelOption,
	RecordingProjectOption,
	RemoteBrowserRecordedStep,
	SelectedTextContext,
	SelectionBounds,
} from "./types/browserEvents";

/** Seconds a finished replay stays on screen before the session is closed. */
const PLAYBACK_CLOSE_SECONDS = 10;

type ResolvedPlaywrightRecording = {
	source: "project" | "room";
	projectId?: string;
	fileName: string;
	roomPath?: string;
	score: number;
	reason: string;
	startUrl?: string;
};

type ResolvePlaywrightRecordingResponse = {
	selected: ResolvedPlaywrightRecording | null;
	candidates: ResolvedPlaywrightRecording[];
	searchedProjectRecordings: number;
	searchedRoomRecordings: number;
};

type AutomationHistoryEntry = {
	iteration: number;
	type: "click" | "fill" | "select" | "scroll";
	label: string;
	value?: string;
	pageUrl: string;
	reason: string;
};

type PendingTextSelection = {
	context: SelectedTextContext | null;
	clientX: number;
	clientY: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function App() {
	const { insightId } = useInsight();
	const {
		session,
		error: sessionError,
		isCreating,
		isSaving,
		isLoadingProjects,
		createSession,
		closeSession,
		saveRecording,
		getRecordingEnvelope,
		saveRoomRecording,
		listRecordingProjects,
		listRecordingFiles,
		getRoomRecordingEnvelope,
		loadRecording,
		replaySingleStep,
		getRecordedSteps,
		saveRoomMcpEntry,
		saveProjectMcpEntry,
	} = useRemoteBrowserSession();
	const [latestFrame, setLatestFrame] = useState<string | null>(null);
	const [browserScrollMetrics, setBrowserScrollMetrics] =
		useState<BrowserScrollMetrics>({
			scrollTop: 0,
			scrollHeight: 1,
			viewportHeight: 1,
		});
	const [currentUrl, setCurrentUrl] = useState("");
	const [browserCursor, setBrowserCursor] = useState("default");
	const [browserTabs, setBrowserTabs] = useState<BrowserTabInfo[]>([]);
	const [activeBrowserTabId, setActiveBrowserTabId] = useState("tab-1");
	const browserTabsRef = useRef<BrowserTabInfo[]>([]);
	const [snackError, setSnackError] = useState<string | null>(null);
	const [snackMessage, setSnackMessage] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [toolContext, setToolContext] = useState<McpToolContext | null>(null);
	const [semossContextReady, setSemossContextReady] = useState(false);
	const [mcpStartUrlInput, setMcpStartUrlInput] = useState("");
	const [isReturningToPlayground, setIsReturningToPlayground] =
		useState(false);
	const [returnDialogOpen, setReturnDialogOpen] = useState(false);
	const [returnProjects, setReturnProjects] = useState<
		RecordingProjectOption[]
	>([]);
	const [returnProject, setReturnProject] =
		useState<RecordingProjectOption | null>(null);
	const [isLoadingReturnProjects, setIsLoadingReturnProjects] =
		useState(false);
	const [isGeneratingRecordingMetadata, setIsGeneratingRecordingMetadata] =
		useState(false);
	const [isLoadingMetadataModels, setIsLoadingMetadataModels] =
		useState(false);
	const [metadataModels, setMetadataModels] = useState<
		RecordingMetadataModelOption[]
	>([]);
	const [metadataModel, setMetadataModel] =
		useState<RecordingMetadataModelOption | null>(null);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [stopRecordingDialogOpen, setStopRecordingDialogOpen] =
		useState(false);
	const [isSavingRecording, setIsSavingRecording] = useState(false);
	const [saveProject, setSaveProject] = useState<{
		label: string;
		value: string;
	} | null>(null);
	const [saveTitle, setSaveTitle] = useState("");
	const [saveDescription, setSaveDescription] = useState("");
	const [saveIntent, setSaveIntent] = useState("");
	const [recordedSteps, setRecordedSteps] = useState<
		RemoteBrowserRecordedStep[]
	>([]);
	const [selectedTextContexts, setSelectedTextContexts] = useState<
		SelectedTextContext[]
	>([]);
	const [selectedTextContextsOpen, setSelectedTextContextsOpen] =
		useState(false);
	const [pendingTextSelection, setPendingTextSelection] =
		useState<PendingTextSelection | null>(null);
	const [pendingNavigationCount, setPendingNavigationCount] = useState(0);
	const [isRemoteNavigating, setIsRemoteNavigating] = useState(false);
	const [recordedStepsOpen, setRecordedStepsOpen] = useState(false);
	const [playbackCloseCountdown, setPlaybackCloseCountdown] = useState<
		number | null
	>(null);
	const [playbackStepsRun, setPlaybackStepsRun] = useState(0);

	// ── Automation mode ──────────────────────────────────────────────────────
	const [automationMode, setAutomationMode] = useState(false);
	const [automationModelId, setAutomationModelId] = useState("");
	const [automationSubMode, setAutomationSubMode] = useState<
		"click" | "fill-page" | "run-goal"
	>("click");
	const [isAutomationGenerating, setIsAutomationGenerating] = useState(false);
	const [isGoalAutomationRunning, setIsGoalAutomationRunning] =
		useState(false);
	const [automationGoal, setAutomationGoal] = useState("");
	const [isAutomationGoalGenerating, setIsAutomationGoalGenerating] =
		useState(false);
	const [automationGoalGenerationError, setAutomationGoalGenerationError] =
		useState("");
	const [automationMaxIterations, setAutomationMaxIterations] = useState(10);
	const [automationProgress, setAutomationProgress] = useState<{
		iteration: number;
		maxIterations: number;
	} | null>(null);
	const [automationClickPos, setAutomationClickPos] = useState<{
		localX: number;
		localY: number;
	} | null>(null);

	const autoStartedRef = useRef(false);
	const autoRecordingStartedRef = useRef(false);
	const autoPlaybackProjectSelectedRef = useRef(false);
	const autoPlaybackRecordingSelectedRef = useRef(false);
	const autoPlaybackLoadStartedRef = useRef(false);
	const autoPlaybackRunStartedRef = useRef(false);
	const autoPlaybackErrorSentRef = useRef(false);
	const returningToPlaygroundRef = useRef(false);
	const selectedContextSequenceRef = useRef(0);
	const textSelectionRequestRef = useRef(0);
	const activeToolExecutionRef = useRef("");
	const automationRunTokenRef = useRef(0);
	const automationGoalExecutionRef = useRef("");

	useEffect(() => {
		if (!snackError) return;
		toast.error(snackError);
		setSnackError(null);
	}, [snackError]);

	useEffect(() => {
		if (!snackMessage) return;
		toast(snackMessage);
		setSnackMessage(null);
	}, [snackMessage]);

	const isPlaygroundMode = !!toolContext;
	const isMcpPlaybackMode = isPlayRecordingTool(toolContext);
	const mcpStartUrl = normalizeBrowserUrl(
		getToolStringParameter(toolContext, "start_url") ||
			getToolStringParameter(toolContext, "startUrl"),
	);
	const mcpRecordingNameHint =
		getToolStringParameter(toolContext, "recording_name_hint") ||
		getToolStringParameter(toolContext, "recordingNameHint");
	const mcpRecordingFile =
		getToolStringParameter(toolContext, "recording_file") ||
		getToolStringParameter(toolContext, "recordingFile") ||
		getToolStringParameter(toolContext, "file_name") ||
		getToolStringParameter(toolContext, "fileName");
	const mcpPlaybackProjectId =
		getToolStringParameter(toolContext, "project_id") ||
		getToolStringParameter(toolContext, "projectId");
	const effectiveInsightId = getSemossInsightId() || insightId;

	// Frame callback - stable reference so it doesn't re-trigger the socket effect
	const handleFrame = useCallback(
		(
			data: string,
			_w: number,
			_h: number,
			scrollMetrics: BrowserScrollMetrics,
		) => {
			setLatestFrame(data);
			setBrowserScrollMetrics(scrollMetrics);
		},
		[],
	);

	const handleNavigated = useCallback((url: string) => {
		setCurrentUrl(url);
		textSelectionRequestRef.current += 1;
		setPendingTextSelection(null);
	}, []);

	const handleSocketError = useCallback((msg: string) => {
		setSnackError(msg);
	}, []);

	const handleTabsChanged = useCallback(
		(tabs: BrowserTabInfo[], activeTabId: string) => {
			browserTabsRef.current = tabs;
			setBrowserTabs(tabs);
			setActiveBrowserTabId(activeTabId);
			const activeTab = tabs.find((tab) => tab.tabId === activeTabId);
			if (activeTab?.url) setCurrentUrl(activeTab.url);
		},
		[],
	);

	const handleTabActivated = useCallback((tabId: string) => {
		setActiveBrowserTabId(tabId);
		const activeTab = browserTabsRef.current.find(
			(tab) => tab.tabId === tabId,
		);
		if (activeTab?.url) setCurrentUrl(activeTab.url);
		setLatestFrame(null);
		setBrowserScrollMetrics({
			scrollTop: 0,
			scrollHeight: 1,
			viewportHeight: 1,
		});
	}, []);

	useEffect(() => {
		setBrowserCursor("default");
	}, [session?.sessionId]);

	const {
		connectionState,
		sendEvent,
		sendReplayEvent,
		sendTabControlEvent,
		sendRecordingControlEvent,
		captureSelectedText,
	} = useBrowserSocket({
		wsUrl: session?.webSocketUrl ?? null,
		onFrame: handleFrame,
		onNavigated: handleNavigated,
		onLoadingChanged: setIsRemoteNavigating,
		onError: handleSocketError,
		onTabsChanged: handleTabsChanged,
		onTabActivated: handleTabActivated,
		onCursorChanged: setBrowserCursor,
	});
	const storeSelectedTextContext = useCallback(
		(context: SelectedTextContext) => {
			selectedContextSequenceRef.current += 1;
			const title = (context.title || "Website text").trim().slice(0, 72);
			const boundedContent = context.content
				.trim()
				.slice(0, MAX_SELECTED_CONTEXT_CHARS);
			const stored: SelectedTextContext = {
				...context,
				label: `${title} - Selection ${selectedContextSequenceRef.current}`,
				content: boundedContent,
				text: renderSelectedTextContext({
					...context,
					content: boundedContent,
				}),
				stats: {
					...context.stats,
					characterCount: boundedContent.length,
					truncated:
						context.stats.truncated ||
						context.content.length > boundedContent.length,
				},
			};
			setSelectedTextContexts((current) =>
				appendBoundedSelectedContext(current, stored),
			);
			setSelectedTextContextsOpen(true);
			setSnackMessage(
				`Captured ${boundedContent.length} characters of website text`,
			);
		},
		[],
	);
	const replayContextStep = useCallback(
		async (step: LoadedRecordingStep) => {
			const points = Array.isArray(step.multiCoords)
				? step.multiCoords.filter(isRecord)
				: [];
			if (points.length < 2) {
				throw new Error("recorded selection bounds are missing");
			}
			const start = points[0];
			const end = points[points.length - 1];
			const viewport = isRecord(step.viewport) ? step.viewport : {};
			const recordedWidth =
				typeof viewport.width === "number" ? viewport.width : 0;
			const recordedHeight =
				typeof viewport.height === "number" ? viewport.height : 0;
			const scaleX =
				recordedWidth > 0 && session?.viewport.width
					? session.viewport.width / recordedWidth
					: 1;
			const scaleY =
				recordedHeight > 0 && session?.viewport.height
					? session.viewport.height / recordedHeight
					: 1;
			const coordinate = (
				point: Record<string, unknown>,
				key: "x" | "y",
				scale: number,
			) => {
				const value = point[key];
				if (typeof value !== "number" || !Number.isFinite(value)) {
					throw new Error(
						`recorded selection ${key} coordinate is invalid`,
					);
				}
				return value * scale;
			};
			const context = await captureSelectedText({
				startX: coordinate(start, "x", scaleX),
				startY: coordinate(start, "y", scaleY),
				endX: coordinate(end, "x", scaleX),
				endY: coordinate(end, "y", scaleY),
			});
			storeSelectedTextContext(context);
		},
		[
			captureSelectedText,
			session?.viewport.height,
			session?.viewport.width,
			storeSelectedTextContext,
		],
	);
	const loadRoomRecording = useCallback(
		(roomInsightId: string, fileName: string) =>
			getRoomRecordingEnvelope(roomInsightId, `/playwright/${fileName}`),
		[getRoomRecordingEnvelope],
	);
	const playback = usePlaybackController({
		insightId: effectiveInsightId,
		session,
		isMcpPlaybackMode,
		listRecordingProjects,
		listRecordingFiles,
		loadRecording,
		loadRoomRecording,
		replaySingleStep,
		sendReplayEvent,
		sendTabControlEvent,
		replayContextStep,
		onError: setSnackError,
		onMessage: setSnackMessage,
	});

	// The playback resolution effect below is guarded to run once per tool
	// execution. Reading the project list through refs keeps it out of that
	// effect's dependencies: the list loads asynchronously, and re-triggering the
	// effect runs a cleanup that cancels the in-flight recording fetch which the
	// run-once guard then refuses to retry, leaving playback stuck at idle.
	const playbackProjectsRef = useRef(playback.projects);
	playbackProjectsRef.current = playback.projects;
	const playbackProjectRef = useRef(playback.project);
	playbackProjectRef.current = playback.project;

	// Same reasoning as the refs above, for the tool context itself. Two paths set
	// it with equal content but different object identity: the postMessage
	// subscription and the initSemoss() resolution. Depending on the object would
	// invalidate the run-once resolution effect mid-flight and cancel the in-flight
	// recording fetch. The effect keys off the content-based toolExecutionKey and
	// reads the value through this ref instead.
	const toolContextRef = useRef(toolContext);
	toolContextRef.current = toolContext;

	// Also read through a ref, for the same reason. Binding the insight to the room
	// swaps in a new insight id, so depending on the value would invalidate the
	// resolution effect at the exact moment its fetch is in flight. The effect
	// triggers on readiness instead, which only transitions once.
	const effectiveInsightIdRef = useRef(effectiveInsightId);
	effectiveInsightIdRef.current = effectiveInsightId;
	const isInsightReady = !!effectiveInsightId;

	const toolExecutionKey = toolContext
		? [
				toolContext.roomId,
				toolContext.message,
				toolContext.id,
				toolContext.originalName,
				JSON.stringify(
					toolContext.executedParameters ?? toolContext.parameters,
				),
			].join("\u001f")
		: "";

	useEffect(() => {
		if (
			!toolExecutionKey ||
			activeToolExecutionRef.current === toolExecutionKey
		) {
			return;
		}
		activeToolExecutionRef.current = toolExecutionKey;
		autoStartedRef.current = false;
		autoRecordingStartedRef.current = false;
		autoPlaybackProjectSelectedRef.current = false;
		autoPlaybackRecordingSelectedRef.current = false;
		autoPlaybackLoadStartedRef.current = false;
		autoPlaybackRunStartedRef.current = false;
		autoPlaybackErrorSentRef.current = false;
		returningToPlaygroundRef.current = false;
		setIsReturningToPlayground(false);
		setReturnDialogOpen(false);
		setSaveDialogOpen(false);
		setSelectedTextContexts([]);
		setRecordedSteps([]);
		setAutomationGoal("");
		setAutomationGoalGenerationError("");
		automationGoalExecutionRef.current = "";
		playback.resetExecution();
	}, [playback.resetExecution, toolExecutionKey]);

	const runBrowserAction = useCallback(
		async (event: ClientToServerEvent) => {
			const isNavigation = [
				"navigate",
				"navigate-back",
				"navigate-forward",
				"reload",
			].includes(event.type);
			if (isNavigation) {
				setPendingNavigationCount((count) => count + 1);
			}
			try {
				await sendReplayEvent({
					...event,
					requestId: crypto.randomUUID(),
				});
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Browser action failed",
				);
			} finally {
				if (isNavigation) {
					setPendingNavigationCount((count) =>
						Math.max(0, count - 1),
					);
				}
			}
		},
		[sendReplayEvent],
	);

	const sendViewerEvent = useCallback(
		(event: ClientToServerEvent) => {
			// Pointer movement stays fire-and-forget so cursor motion does not
			// continuously trigger the toolbar activity indicator.
			if (event.type === "mouse-move") {
				sendEvent(event);
				return;
			}
			void runBrowserAction(event);
		},
		[runBrowserAction, sendEvent],
	);

	const defaultRecordingName = useMemo(() => {
		const title = saveTitle.trim() || "remote-browser-recording";
		const today = new Date().toISOString().split("T")[0];
		return `${title}-${today}`;
	}, [saveTitle]);

	useEffect(() => {
		let mounted = true;

		initSemoss().then((context) => {
			if (!mounted) return;
			setToolContext(context);
			setMcpStartUrlInput(
				normalizeBrowserUrl(
					getToolStringParameter(context, "start_url") ||
						getToolStringParameter(context, "startUrl"),
				),
			);
			setSemossContextReady(true);
		});

		const unsubscribe = subscribeToMcpToolContext((context) => {
			if (!mounted) return;
			setToolContext(context);
			setMcpStartUrlInput(
				normalizeBrowserUrl(
					getToolStringParameter(context, "start_url") ||
						getToolStringParameter(context, "startUrl"),
				),
			);
		});

		return () => {
			mounted = false;
			unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!semossContextReady) return;
		if (autoStartedRef.current || session || isCreating) return;
		const startupUrl = isMcpPlaybackMode
			? mcpStartUrl || playback.startUrl
			: mcpStartUrl;
		if (isPlaygroundMode && !startupUrl) return;

		autoStartedRef.current = true;
		if (startupUrl) setCurrentUrl(startupUrl);
		createSession(
			isPlaygroundMode ? startupUrl : "",
			1365,
			768,
			!isPlaygroundMode,
		).then((info) => {
			if (!info) {
				autoStartedRef.current = false;
				return;
			}
			setCurrentUrl(
				info.currentUrl || startupUrl || "https://example.com",
			);
			setLatestFrame(null);
			setIsRecording(false);
		});
	}, [
		createSession,
		isCreating,
		isMcpPlaybackMode,
		isPlaygroundMode,
		mcpStartUrl,
		playback.startUrl,
		semossContextReady,
		session,
	]);

	useEffect(() => {
		if (
			!isPlaygroundMode ||
			isMcpPlaybackMode ||
			autoRecordingStartedRef.current ||
			!session ||
			connectionState !== "connected"
		) {
			return;
		}

		autoRecordingStartedRef.current = true;
		sendEvent({ type: "recording-control", recording: true });
		setIsRecording(true);
		setSnackMessage("Recording started");
	}, [
		connectionState,
		isMcpPlaybackMode,
		isPlaygroundMode,
		sendEvent,
		session,
	]);

	useEffect(() => {
		setSaveProject((current) => current ?? playback.appProjects[0] ?? null);
	}, [playback.appProjects]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackProjectSelectedRef.current ||
			playback.projects.length === 0 ||
			// selectProject() resets source to "project". Once a room recording has
			// been resolved, letting the project list arrive afterwards would flip
			// source away from "room" and silently break the room replay branch.
			playback.source === "room"
		) {
			return;
		}

		const selectedProject =
			(mcpPlaybackProjectId &&
				playback.projects.find(
					(project) => project.value === mcpPlaybackProjectId,
				)) ||
			playback.projects[0] ||
			null;

		if (selectedProject) {
			autoPlaybackProjectSelectedRef.current = true;
			playback.selectProject(selectedProject);
		}
	}, [
		isMcpPlaybackMode,
		mcpPlaybackProjectId,
		playback.projects,
		playback.selectProject,
		playback.source,
	]);

	useEffect(() => {
		// Deliberately not gated on playback.projects. A room recording is fetched
		// straight out of the room's asset folder, so waiting on the MCP project
		// list would strand playback whenever no project happens to be tagged MCP.
		if (
			!isMcpPlaybackMode ||
			autoPlaybackRecordingSelectedRef.current ||
			!isInsightReady
		) {
			return;
		}
		const parameterValues = {
			...getToolStringMapParameter(
				toolContextRef.current,
				"param_values",
			),
			...getToolStringMapParameter(toolContextRef.current, "paramValues"),
		};

		autoPlaybackRecordingSelectedRef.current = true;

		let cancelled = false;

		(async () => {
			const roomId = toolContextRef.current?.roomId;
			if (roomId) {
				await bindSemossInsightToRoom(roomId);
			}
			const roomInsightId =
				getSemossInsightId() || effectiveInsightIdRef.current;

			if (!roomId) {
				throw new Error(
					"Playground room ID is required to resolve a room recording",
				);
			}
			try {
				playback.configureRoomRecordings(
					await listPlaywrightRoomRecordings(),
				);
			} catch {
				// Matching can still proceed. The selected room file is inserted
				// into the controls even if the optional catalog listing fails.
			}

			const directProject =
				(mcpPlaybackProjectId &&
					playbackProjectsRef.current.find(
						(project) => project.value === mcpPlaybackProjectId,
					)) ||
				playbackProjectRef.current ||
				playbackProjectsRef.current[0] ||
				null;
			const exactFileName = mcpRecordingFile
				.split(/[\\/]/)
				.filter(Boolean)
				.pop();

			if (exactFileName) {
				const directRoomPath = `/playwright/${exactFileName}`;
				for (let attempt = 0; attempt < 2; attempt += 1) {
					const envelope = await getRoomRecordingEnvelope(
						roomInsightId,
						directRoomPath,
					);
					if (cancelled) return;
					if (envelope) {
						playback.configureResolvedRecording({
							source: "room",
							project: directProject,
							fileName: exactFileName,
							startUrl:
								mcpStartUrl ||
								getRecordingStartUrl(envelope) ||
								"https://example.com",
							recording: envelope,
							parameterValues,
						});
						setSnackMessage(
							`Matched room recording ${directRoomPath} (exact filename)`,
						);
						return;
					}
					if (attempt === 0) {
						await new Promise((resolve) =>
							window.setTimeout(resolve, 400),
						);
					}
				}
			}

			const resolved =
				await resolvePlaywrightRoomRecording<ResolvePlaywrightRecordingResponse>(
					roomId,
					{
						recordingNameHint: mcpRecordingNameHint,
						recordingFile: mcpRecordingFile,
						projectId:
							mcpPlaybackProjectId ||
							playbackProjectRef.current?.value ||
							"",
					},
				);

			if (cancelled) return;

			const selected = resolved.selected;

			if (!selected) {
				const message = `No recording matched "${mcpRecordingFile || mcpRecordingNameHint}"`;
				setSnackError(message);
				if (
					!autoPlaybackErrorSentRef.current &&
					toolContextRef.current
				) {
					autoPlaybackErrorSentRef.current = true;
					try {
						sendMcpResponseToPlayground(
							{
								played: false,
								error: message,
								recordingNameHint: mcpRecordingNameHint,
								recordingFile: mcpRecordingFile || null,
								searchedProjectRecordingCount:
									resolved.searchedProjectRecordings,
								searchedRoomRecordingCount:
									resolved.searchedRoomRecordings,
							},
							"error",
							toolContextRef.current.parameters,
						);
					} catch {
						// Nothing else to do if the iframe cannot notify Playground.
					}
				}
				return;
			}

			const selectedProject =
				playbackProjectsRef.current.find(
					(project) => project.value === selected.projectId,
				) ||
				(selected.projectId
					? { label: selected.projectId, value: selected.projectId }
					: null) ||
				playbackProjectRef.current ||
				playbackProjectsRef.current[0] ||
				null;

			// Room recordings do not need one; only the project-sourced branch below
			// dereferences it.
			if (!selectedProject && selected.source !== "room") {
				setSnackError(
					"No Playwright project is available for playback",
				);
				return;
			}

			if (selected.source === "room") {
				if (!selected.roomPath) {
					setSnackError(
						`Could not load room recording ${selected.roomPath}`,
					);
					return;
				}
				const envelope = await getRoomRecordingEnvelope(
					roomInsightId,
					selected.roomPath,
				);
				if (!envelope) {
					setSnackError(
						`Could not load room recording ${selected.roomPath}`,
					);
					return;
				}
				if (cancelled) return;
				playback.configureResolvedRecording({
					source: "room",
					project: selectedProject,
					fileName: selected.fileName,
					startUrl:
						mcpStartUrl ||
						selected.startUrl ||
						"https://example.com",
					recording: envelope,
					parameterValues,
				});
				setSnackMessage(
					`Matched room recording ${selected.roomPath} (${selected.reason})`,
				);
				return;
			}

			playback.configureResolvedRecording({
				source: "project",
				project: selectedProject,
				fileName: selected.fileName,
				startUrl:
					mcpStartUrl || selected.startUrl || "https://example.com",
				parameterValues,
			});
			setSnackMessage(
				`Matched ${selected.fileName} (${selected.reason})`,
			);
		})().catch((error) => {
			if (cancelled) return;
			const message =
				error instanceof Error
					? error.message
					: "Failed to resolve Playwright recording";
			setSnackError(message);
			if (!autoPlaybackErrorSentRef.current && toolContextRef.current) {
				autoPlaybackErrorSentRef.current = true;
				try {
					sendMcpResponseToPlayground(
						{ played: false, error: message },
						"error",
						toolContextRef.current.parameters,
					);
				} catch {
					// Nothing else to do if the iframe cannot notify Playground.
				}
			}
		});

		return () => {
			cancelled = true;
		};
	}, [
		isInsightReady,
		getRoomRecordingEnvelope,
		isMcpPlaybackMode,
		mcpRecordingFile,
		mcpRecordingNameHint,
		mcpPlaybackProjectId,
		mcpStartUrl,
		playback.configureResolvedRecording,
		playback.configureRoomRecordings,
		// playback.project / playback.projects are deliberately omitted and read
		// through refs instead. See the refs above: their async arrival would
		// cancel this run-once effect's in-flight fetch.
		toolExecutionKey,
	]);

	useEffect(() => {
		if (!isRecording || !session) {
			setRecordedSteps([]);
			return;
		}

		let cancelled = false;
		const refresh = async () => {
			const steps = await getRecordedSteps();
			if (!cancelled) {
				setRecordedSteps(steps);
			}
		};

		refresh();
		const id = window.setInterval(refresh, 1500);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [getRecordedSteps, isRecording, session]);

	const dismissPendingTextSelection = useCallback(() => {
		textSelectionRequestRef.current += 1;
		setPendingTextSelection(null);
	}, []);

	const handleTextDragComplete = useCallback(
		async (
			bounds: SelectionBounds,
			anchor: { clientX: number; clientY: number },
		) => {
			const request = textSelectionRequestRef.current + 1;
			textSelectionRequestRef.current = request;
			setPendingTextSelection({
				context: null,
				clientX: anchor.clientX,
				clientY: anchor.clientY,
			});
			try {
				const context = await captureSelectedText(bounds);
				if (textSelectionRequestRef.current !== request) return;
				setPendingTextSelection({
					context,
					clientX: anchor.clientX,
					clientY: anchor.clientY,
				});
			} catch (error) {
				if (textSelectionRequestRef.current !== request) return;
				setPendingTextSelection(null);
				const message = error instanceof Error ? error.message : "";
				// Ordinary drags (sliders, maps, canvases) are not text selections.
				// Keep those interactions quiet; surface only transport/server failures.
				if (!message.includes("No visible DOM text")) {
					setSnackError(
						message || "Failed to inspect selected website text",
					);
				}
			}
		},
		[captureSelectedText],
	);

	const handleCopySelectedContext = useCallback(
		async (context: SelectedTextContext) => {
			try {
				await navigator.clipboard.writeText(context.content);
				setSnackMessage("Selected website text copied");
			} catch {
				setSnackError("Could not copy selected website text");
			}
		},
		[],
	);

	const handleAddSelectedContext = useCallback(
		async (context: SelectedTextContext) => {
			let captured = context;
			let recordingError = "";
			if (isRecording) {
				try {
					captured = await captureSelectedText(
						context.bounds,
						true,
						context.title || "Selected website text",
					);
				} catch (error) {
					recordingError =
						error instanceof Error
							? error.message
							: "Could not record the context extraction step";
				}
			}
			storeSelectedTextContext(captured);
			dismissPendingTextSelection();
			if (recordingError) {
				setSnackError(
					`Context was added, but its recording step failed: ${recordingError}`,
				);
			}
		},
		[
			captureSelectedText,
			dismissPendingTextSelection,
			isRecording,
			storeSelectedTextContext,
		],
	);

	const handleDeleteSelectedContext = useCallback(
		(contextId: string) => {
			const next = selectedTextContexts.filter(
				(context) => context.id !== contextId,
			);
			setSelectedTextContexts(next);
			if (!next.length) setSelectedTextContextsOpen(false);
		},
		[selectedTextContexts],
	);

	const handleSaveSelectedContext = useCallback(
		(contextId: string, content: string) => {
			const bounded = content.trim().slice(0, MAX_SELECTED_CONTEXT_CHARS);
			setSelectedTextContexts((current) =>
				current.map((context) => {
					if (context.id !== contextId) return context;
					const updated = {
						...context,
						content: bounded,
						edited: true,
						stats: {
							...context.stats,
							characterCount: bounded.length,
							truncated:
								context.stats.truncated ||
								content.trim().length > bounded.length,
						},
					};
					return {
						...updated,
						text: renderSelectedTextContext(updated),
					};
				}),
			);
			setSnackMessage("Captured context updated");
		},
		[],
	);

	// --- Toolbar handlers ---------------------------------------------------
	const handleStart = useCallback(
		async (url: string) => {
			const normalizedUrl = normalizeBrowserUrl(url);
			setCurrentUrl(normalizedUrl);
			const info = await createSession(normalizedUrl);
			if (info) {
				setSelectedTextContexts([]);
				setSelectedTextContextsOpen(false);
				selectedContextSequenceRef.current = 0;
				setCurrentUrl(info.currentUrl || normalizedUrl);
				setLatestFrame(null);
				setBrowserTabs([]);
				browserTabsRef.current = [];
				setActiveBrowserTabId("tab-1");
				playback.resetReplayPreparation();
				setIsRecording(false);
			}
		},
		[createSession, playback.resetReplayPreparation],
	);

	const handleStartMcpSession = useCallback(async () => {
		const targetUrl = normalizeBrowserUrl(mcpStartUrlInput);
		if (!targetUrl) {
			setSnackError(
				"URL is required before opening a Playground recording session",
			);
			return;
		}

		autoStartedRef.current = true;
		setCurrentUrl(targetUrl);
		const info = await createSession(targetUrl, 1365, 768, false);
		if (!info) {
			autoStartedRef.current = false;
			return;
		}

		setCurrentUrl(info.currentUrl || targetUrl);
		setSelectedTextContexts([]);
		setSelectedTextContextsOpen(false);
		selectedContextSequenceRef.current = 0;
		setLatestFrame(null);
		setBrowserTabs([]);
		browserTabsRef.current = [];
		setActiveBrowserTabId("tab-1");
		playback.resetReplayPreparation();
		setIsRecording(false);
	}, [createSession, mcpStartUrlInput, playback.resetReplayPreparation]);

	const closeBrowserSession = useCallback(async () => {
		sendEvent({ type: "close-session" });
		await closeSession();
		setLatestFrame(null);
		setCurrentUrl("");
		setBrowserTabs([]);
		browserTabsRef.current = [];
		setActiveBrowserTabId("tab-1");
		playback.resetReplayPreparation();
		setIsRecording(false);
		setSaveDialogOpen(false);
		setStopRecordingDialogOpen(false);
	}, [closeSession, playback.resetReplayPreparation, sendEvent]);

	// Held in a ref so the countdown effect below depends only on the tick value.
	// Depending on the callback identity would restart the timer on unrelated
	// re-renders and the countdown would never reach zero.
	const closeBrowserSessionRef = useRef(closeBrowserSession);
	closeBrowserSessionRef.current = closeBrowserSession;

	useEffect(() => {
		if (playbackCloseCountdown === null) {
			return;
		}
		if (playbackCloseCountdown <= 0) {
			setPlaybackCloseCountdown(null);
			void closeBrowserSessionRef.current();
			return;
		}
		const timer = window.setTimeout(() => {
			setPlaybackCloseCountdown((current) =>
				current === null ? null : current - 1,
			);
		}, 1000);
		return () => window.clearTimeout(timer);
	}, [playbackCloseCountdown]);

	const handleKeepPlaybackOpen = useCallback(() => {
		setPlaybackCloseCountdown(null);
	}, []);

	const handleClosePlaybackNow = useCallback(() => {
		setPlaybackCloseCountdown(null);
		void closeBrowserSessionRef.current();
	}, []);

	const handleSwitchBrowserTab = useCallback(
		async (tabId: string) => {
			if (tabId === activeBrowserTabId) return;
			setLatestFrame(null);
			setActiveBrowserTabId(tabId);
			const tab = browserTabsRef.current.find(
				(candidate) => candidate.tabId === tabId,
			);
			if (tab?.url) setCurrentUrl(tab.url);
			try {
				await sendTabControlEvent({
					type: "switch-tab",
					targetTabId: tabId,
					requestId: crypto.randomUUID(),
				});
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Could not switch browser tab",
				);
			}
		},
		[activeBrowserTabId, sendTabControlEvent],
	);

	const handleCloseBrowserTab = useCallback(
		async (tabId: string) => {
			if (isRecording || browserTabsRef.current.length <= 1) return;
			playback.requestPause("Playback will pause after closing a tab");
			try {
				await sendTabControlEvent({
					type: "close-tab",
					targetTabId: tabId,
					requestId: crypto.randomUUID(),
				});
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Could not close browser tab",
				);
			}
		},
		[isRecording, playback, sendTabControlEvent],
	);

	const handleNavigate = useCallback(
		(url: string) => {
			void runBrowserAction({
				type: "navigate",
				url: normalizeBrowserUrl(url),
			});
		},
		[runBrowserAction],
	);

	const handleBack = useCallback(
		() =>
			void runBrowserAction({ type: "navigate-back", waitAfterMs: 800 }),
		[runBrowserAction],
	);
	const handleForward = useCallback(
		() =>
			void runBrowserAction({
				type: "navigate-forward",
				waitAfterMs: 800,
			}),
		[runBrowserAction],
	);
	const handleReload = useCallback(
		() => void runBrowserAction({ type: "reload", waitAfterMs: 800 }),
		[runBrowserAction],
	);

	const handleToggleRecording = useCallback(() => {
		if (!isRecording) {
			sendEvent({ type: "recording-control", recording: true });
			playback.resetReplayPreparation();
			setSaveTitle("");
			setSaveDescription("");
			setSaveIntent("");
			setIsRecording(true);
			setSnackMessage("Recording started");
			return;
		}
		setStopRecordingDialogOpen(true);
	}, [isRecording, playback.resetReplayPreparation, sendEvent]);

	const handleDiscardRecording = useCallback(() => {
		sendEvent({
			type: "recording-control",
			recording: false,
			discard: true,
		});
		setIsRecording(false);
		setStopRecordingDialogOpen(false);
		setSaveDialogOpen(false);
		setSnackMessage("Recording discarded");
	}, [sendEvent]);

	const prepareSaveDialog = useCallback(async () => {
		setStopRecordingDialogOpen(false);
		setSaveDialogOpen(true);
		if (metadataModels.length > 0) {
			setMetadataModel((current) => current || metadataModels[0]);
			return;
		}
		setIsLoadingMetadataModels(true);
		try {
			const models =
				await listRecordingMetadataModels(effectiveInsightId);
			setMetadataModels(models);
			setMetadataModel(models[0] || null);
			if (models.length === 0) {
				setSnackMessage(
					"No accessible text-generation model is available. Metadata can still be entered manually.",
				);
			}
		} catch {
			setSnackMessage(
				"Models could not be loaded. Metadata can still be entered manually.",
			);
		} finally {
			setIsLoadingMetadataModels(false);
		}
	}, [effectiveInsightId, metadataModels]);

	const handleGenerateSaveMetadata = useCallback(async () => {
		if (!session || !metadataModel) return;
		setIsGeneratingRecordingMetadata(true);
		try {
			const metadata = await generatePlaywrightRecordingMetadata({
				sessionId: session.sessionId,
				engineId: metadataModel.value,
				recordingNameHint: mcpRecordingNameHint,
				insightId: effectiveInsightId,
				historyLimit: 0,
			});
			if (!metadata.success) {
				setSnackError(
					metadata.error || "Unable to generate recording metadata",
				);
				return;
			}
			setSaveTitle(metadata.title || "");
			setSaveDescription(metadata.description || "");
			setSaveIntent(metadata.intent || "");
			setSnackMessage("Recording details generated");
		} finally {
			setIsGeneratingRecordingMetadata(false);
		}
	}, [effectiveInsightId, mcpRecordingNameHint, metadataModel, session]);

	const handleSaveAndStopRecording = useCallback(() => {
		void prepareSaveDialog();
	}, [prepareSaveDialog]);

	const handleSaveRecording = useCallback(async () => {
		const title = saveTitle.trim();
		const description = saveDescription.trim();
		const intent = saveIntent.trim();
		if (!saveProject) {
			setSnackError("Project is required to save the recording");
			return;
		}
		if (!title || !description || !intent) {
			setSnackError("Title, description, and intent are required");
			return;
		}
		if (!session) {
			setSnackError("No active browser session is available to save");
			return;
		}
		setIsSavingRecording(true);
		let recordingStopped = false;
		let browserClosed = false;
		try {
			await sendRecordingControlEvent({
				type: "recording-control",
				recording: false,
				discard: false,
				requestId: crypto.randomUUID(),
			});
			recordingStopped = true;
			setIsRecording(false);
			const saved = await saveRecording({
				project: saveProject.value,
				name: defaultRecordingName,
				title,
				description,
				intent,
			});

			if (!saved) {
				throw new Error("Failed to save recording to the selected app");
			}
			await saveProjectMcpEntry(effectiveInsightId, saved.project);

			playback.selectSavedRecording(saveProject, saved.fileName);
			setSaveDialogOpen(false);
			await closeBrowserSession();
			browserClosed = true;

			setSnackMessage(`Saved recording: ${saved.fileName}`);
		} catch (error) {
			if (recordingStopped && !browserClosed) {
				try {
					await sendRecordingControlEvent({
						type: "recording-control",
						recording: true,
						requestId: crypto.randomUUID(),
					});
					setIsRecording(true);
				} catch {
					// Preserve the original save error below.
				}
			}
			const message =
				error instanceof Error
					? error.message
					: "Failed to save recording";
			setSnackError(message);
		} finally {
			setIsSavingRecording(false);
		}
	}, [
		closeBrowserSession,
		defaultRecordingName,
		effectiveInsightId,
		saveDescription,
		saveIntent,
		saveProject,
		saveRecording,
		saveProjectMcpEntry,
		saveTitle,
		sendRecordingControlEvent,
		session,
		playback.selectSavedRecording,
	]);

	const handleOpenSaveRecording = useCallback(() => {
		void prepareSaveDialog();
	}, [prepareSaveDialog]);

	const handleOpenReturnDialog = useCallback(async () => {
		setReturnDialogOpen(true);
		setIsLoadingReturnProjects(true);
		try {
			const projects = await listRecordingProjects(effectiveInsightId);
			setReturnProjects(projects);
			setReturnProject(projects[0] ?? null);
			if (projects.length === 0) {
				setSnackMessage("No editable app projects are available");
			}
		} finally {
			setIsLoadingReturnProjects(false);
		}
	}, [effectiveInsightId, listRecordingProjects]);

	const handleReturnToPlayground = useCallback(
		async (appProject: RecordingProjectOption | null) => {
			if (returningToPlaygroundRef.current) return;
			returningToPlaygroundRef.current = true;
			setIsReturningToPlayground(true);

			let recordingStopped = false;
			let browserClosed = false;
			try {
				if (!toolContext) {
					throw new Error("No Playground tool context is available");
				}
				if (!toolContext.roomId) {
					throw new Error(
						"No Playground room ID is available for room file save",
					);
				}
				await bindSemossInsightToRoom(toolContext.roomId);
				const roomBoundInsightId =
					getSemossInsightId() || effectiveInsightId;
				if (!roomBoundInsightId) {
					throw new Error(
						"No SEMOSS insight is available for room file save",
					);
				}
				if (!session) {
					throw new Error(
						"No active browser session is available to save",
					);
				}
				if (isRecording) {
					await sendRecordingControlEvent({
						type: "recording-control",
						recording: false,
						discard: false,
						requestId: crypto.randomUUID(),
					});
					recordingStopped = true;
					setIsRecording(false);
				}

				const envelope = await getRecordingEnvelope();
				if (!envelope) {
					throw new Error("No recording envelope is available");
				}

				const generatedMetadata =
					await generatePlaywrightRecordingMetadata({
						sessionId: session.sessionId,
						roomId: toolContext.roomId,
						recordingNameHint: mcpRecordingNameHint,
						insightId: roomBoundInsightId,
						historyLimit: 8,
					});
				const enrichedEnvelope = applyGeneratedRecordingMetadata(
					enrichEnvelopeForRoomSave(
						envelope,
						session.sessionId,
						mcpRecordingNameHint,
						mcpStartUrl,
					),
					generatedMetadata,
				);
				const fileName = buildRecordingFileName(
					enrichedEnvelope,
					mcpRecordingNameHint,
					mcpStartUrl,
					enrichedEnvelope.meta?.title || "",
				);
				const saved = await saveRoomRecording(
					roomBoundInsightId,
					fileName,
					enrichedEnvelope,
				);
				if (!saved) {
					throw new Error(
						"Failed to save recording to the Playground room",
					);
				}

				let appRecording: { project: string; fileName: string } | null =
					null;
				if (appProject) {
					const appSaved = await saveRecording({
						project: appProject.value,
						name: saved.fileName,
						title: enrichedEnvelope.meta?.title,
						description: enrichedEnvelope.meta?.description,
						intent: enrichedEnvelope.meta?.intent,
					});
					if (!appSaved) {
						throw new Error(
							"Failed to save recording to the selected app",
						);
					}
					await saveProjectMcpEntry(
						roomBoundInsightId,
						appSaved.project,
					);
					appRecording = {
						project: appSaved.project,
						fileName: appSaved.fileName,
					};
				}

				// Regenerate mcp/pixel_mcp.json from all room recordings. This is part
				// of a successful Return to Playground operation, not a best-effort step.
				await saveRoomMcpEntry(
					roomBoundInsightId,
					saved.fileName,
					enrichedEnvelope,
					toolContext.roomId,
					toolContext.projectId,
				);

				// No registration step: the backend picks up a room's
				// mcp/pixel_mcp.json automatically, so writing the file above is
				// enough for the LLM to see the new tools on the next message.
				await closeBrowserSession();
				browserClosed = true;

				sendMcpResponseToPlayground(
					{
						saved: true,
						destination: "room",
						savedToPlaywrightApp: !!appRecording,
						appProjectId: appRecording?.project ?? null,
						appFileName: appRecording?.fileName ?? null,
						recordingPath: saved.roomPath,
						fileName: saved.fileName,
						sessionId: session.sessionId,
						roomId: toolContext.roomId,
						startUrl: getRecordingStartUrl(
							enrichedEnvelope,
							mcpStartUrl,
						),
						title: enrichedEnvelope.meta?.title,
						description: enrichedEnvelope.meta?.description,
						contextCount: selectedTextContexts.length,
						contexts:
							selectedContextsForPlayground(selectedTextContexts),
					},
					"success",
					toolContext.parameters,
				);
				setRecordedSteps([]);
				setReturnDialogOpen(false);
				setSnackMessage(
					appRecording
						? "Saved recording to Playground and app"
						: `Saved recording: ${saved.roomPath}`,
				);
			} catch (error) {
				if (recordingStopped && !browserClosed) {
					try {
						await sendRecordingControlEvent({
							type: "recording-control",
							recording: true,
							requestId: crypto.randomUUID(),
						});
						setIsRecording(true);
					} catch {
						// Report the Return to Playground failure below.
					}
				}
				const message =
					error instanceof Error
						? error.message
						: "Failed to return recording to Playground";
				setSnackError(message);
				try {
					sendMcpResponseToPlayground(
						{ saved: false, destination: "room", error: message },
						"error",
						toolContext?.parameters ?? {},
					);
				} catch {
					// Nothing else to do if the iframe cannot notify Playground.
				}
			} finally {
				setIsReturningToPlayground(false);
				returningToPlaygroundRef.current = false;
			}
		},
		[
			closeBrowserSession,
			getRecordingEnvelope,
			effectiveInsightId,
			isRecording,
			mcpRecordingNameHint,
			mcpStartUrl,
			saveRoomMcpEntry,
			saveRoomRecording,
			saveRecording,
			saveProjectMcpEntry,
			selectedTextContexts,
			sendRecordingControlEvent,
			session,
			toolContext,
		],
	);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackLoadStartedRef.current ||
			connectionState !== "connected" ||
			!session ||
			// Room recordings come straight from the room folder, so requiring a
			// project here would strand playback whenever the MCP project list has
			// not resolved yet (or when no project is tagged MCP at all).
			(playback.source !== "room" && !playback.project) ||
			!playback.selectedRecording ||
			playback.isLoadingRecording
		) {
			return;
		}

		autoPlaybackLoadStartedRef.current = true;
		void playback.load();
	}, [connectionState, isMcpPlaybackMode, playback, session]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			!toolContext ||
			autoPlaybackRunStartedRef.current ||
			!playback.loadedRecording ||
			!playback.selectedRecording ||
			!session ||
			connectionState !== "connected"
		) {
			return;
		}

		autoPlaybackRunStartedRef.current = true;
		playback.setControlsOpen(true);
		playback.setLoadedRecordingOpen(true);

		(async () => {
			try {
				const result = await playback.run();
				if (!result) {
					throw new Error("Playback did not start");
				}

				// The session stays open briefly so the page can be inspected on the
				// last executed step, then the countdown closes it to release the
				// remote browser rather than waiting for the server side TTL.
				if (result.completed) {
					setPlaybackStepsRun(result.stepsRun);
					setPlaybackCloseCountdown(PLAYBACK_CLOSE_SECONDS);
				}

				sendMcpResponseToPlayground(
					{
						played: result.completed,
						status: result.completed ? "completed" : "paused",
						recordingFile: playback.selectedRecording,
						projectId: playback.project?.value ?? null,
						stepsRun: result.stepsRun,
						pausedAtStepId: result.pausedAtStepId ?? null,
						sessionId: session.sessionId,
						roomId: toolContext.roomId,
					},
					result.completed ? "success" : "paused",
					toolContext.parameters,
				);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to play recording";
				setSnackError(message);
				try {
					sendMcpResponseToPlayground(
						{ played: false, error: message },
						"error",
						toolContext.parameters,
					);
				} catch {
					// Nothing else to do if the iframe cannot notify Playground.
				}
			}
		})();
	}, [connectionState, isMcpPlaybackMode, playback, session, toolContext]);

	const remoteWidth = session?.viewport.width ?? 1365;
	const remoteHeight = session?.viewport.height ?? 768;
	const isBrowserLoading =
		isCreating || pendingNavigationCount > 0 || isRemoteNavigating;
	const replayMenuOpen =
		playback.controlsOpen || playback.loadedRecordingOpen;

	const generateAutomationGoal = useCallback(
		async (replaceExisting: boolean) => {
			const roomId = toolContext?.roomId ?? "";
			if (!roomId || !automationModelId || !effectiveInsightId) return;

			setIsAutomationGoalGenerating(true);
			setAutomationGoalGenerationError("");
			try {
				const response = await runPixel<Record<string, unknown>>(
					`GeneratePlaywrightAutomationGoal(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, limit=20);`,
					effectiveInsightId,
				);
				const output = response.pixelReturn?.[0]?.output;
				if (!isRecord(output) || output.success !== true) {
					throw new Error(
						isRecord(output) && typeof output.error === "string"
							? output.error
							: "Could not generate an automation goal.",
					);
				}
				const generatedGoal =
					typeof output.goal === "string" ? output.goal.trim() : "";
				if (!generatedGoal) {
					throw new Error(
						"The model returned an empty automation goal.",
					);
				}
				setAutomationGoal((current) =>
					replaceExisting || !current.trim()
						? generatedGoal
						: current,
				);
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
			} catch (error) {
				setAutomationGoalGenerationError(
					error instanceof Error
						? error.message
						: "Could not generate an automation goal.",
				);
			} finally {
				setIsAutomationGoalGenerating(false);
			}
		},
		[automationModelId, effectiveInsightId, toolContext?.roomId],
	);

	useEffect(() => {
		if (
			!isPlaygroundMode ||
			isMcpPlaybackMode ||
			!toolExecutionKey ||
			!automationModelId ||
			automationGoalExecutionRef.current === toolExecutionKey
		) {
			return;
		}
		automationGoalExecutionRef.current = toolExecutionKey;
		void generateAutomationGoal(false);
	}, [
		automationModelId,
		generateAutomationGoal,
		isMcpPlaybackMode,
		isPlaygroundMode,
		toolExecutionKey,
	]);

	const executeGeneratedFields = useCallback(
		async (output: Record<string, unknown>): Promise<number> => {
			const fields = Array.isArray(output.fields)
				? (output.fields as Array<Record<string, unknown>>)
				: [];
			const expectedUrl =
				typeof output.pageUrl === "string" ? output.pageUrl : undefined;
			const expectedTabId =
				typeof output.tabId === "string" ? output.tabId : undefined;
			let completed = 0;

			for (const field of fields) {
				const value =
					typeof field.value === "string" ? field.value : "";
				const strategy =
					typeof field.selectorStrategy === "string"
						? field.selectorStrategy
						: "css";
				const selectorValue =
					typeof field.selectorValue === "string"
						? field.selectorValue
						: "";
				if (!value || !selectorValue) continue;

				await sendReplayEvent({
					type: "fill-element",
					requestId: crypto.randomUUID(),
					text: value,
					selector: {
						strategy,
						value: selectorValue,
						frameSelector:
							typeof field.frameSelector === "string"
								? field.frameSelector
								: null,
					},
					label:
						typeof field.label === "string"
							? field.label
							: undefined,
					tag: typeof field.tag === "string" ? field.tag : undefined,
					isPassword: field.isPassword === true,
					storeValue: field.storeValue === true,
					expectedUrl,
					expectedTabId,
				});
				completed += 1;
			}
			return completed;
		},
		[sendReplayEvent],
	);

	const generateAndFillSelectedField = useCallback(
		async (remoteX: number, remoteY: number) => {
			if (!session?.sessionId) {
				toast("No active browser session.");
				return;
			}
			setIsAutomationGenerating(true);
			try {
				const roomId = toolContext?.roomId ?? "";
				if (!roomId) {
					toast(
						"No room context available — open this tool from a Playground room.",
					);
					return;
				}

				// Single-field mode: passes x/y so the reactor identifies the clicked field,
				// but still sees ALL form fields for cross-field reasoning accuracy.
				const response = await runPixel<Record<string, unknown>>(
					`GeneratePlaywrightFieldActions(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(session.sessionId)}, limit=20, x=${remoteX}, y=${remoteY});`,
					effectiveInsightId,
				);

				const output = response.pixelReturn?.[0]?.output as
					| Record<string, unknown>
					| undefined;
				if (!output?.success) {
					toast(
						typeof output?.error === "string"
							? output.error
							: "Automation generation failed.",
					);
					return;
				}

				const fields = Array.isArray(output?.fields)
					? output.fields
					: [];

				if (fields.length === 0) {
					toast(
						typeof output?.message === "string"
							? output.message
							: "No editable field or context-supported value was found at that position.",
					);
					return;
				}

				const completed = await executeGeneratedFields(output);
				if (completed === 0) {
					toast("No generated field action could be executed.");
					return;
				}
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
				toast("Filled the selected field from Playground context.");
				setAutomationMode(false);
			} catch (error) {
				toast(
					error instanceof Error
						? error.message
						: "Automation generation failed.",
				);
			} finally {
				setIsAutomationGenerating(false);
				setAutomationClickPos(null);
			}
		},
		[
			automationModelId,
			effectiveInsightId,
			executeGeneratedFields,
			session?.sessionId,
			toolContext?.roomId,
		],
	);

	const handleFieldAutomationTarget = useCallback(
		async (
			localX: number,
			localY: number,
			remoteX: number,
			remoteY: number,
			button: "left" | "right" | "middle",
		) => {
			setAutomationClickPos({ localX, localY });
			try {
				await sendReplayEvent({
					type: "mouse-click",
					requestId: crypto.randomUUID(),
					x: remoteX,
					y: remoteY,
					button,
				});
				await generateAndFillSelectedField(remoteX, remoteY);
			} catch (error) {
				toast(
					error instanceof Error
						? error.message
						: "Could not click the selected browser position.",
				);
				setAutomationClickPos(null);
			}
		},
		[generateAndFillSelectedField, sendReplayEvent],
	);

	const fillVisibleFieldsFromContext = useCallback(async () => {
		if (!session?.sessionId) {
			toast("No active browser session.");
			return;
		}
		const roomId = toolContext?.roomId ?? "";
		if (!roomId) {
			toast(
				"No room context available — open this tool from a Playground room.",
			);
			return;
		}
		setIsAutomationGenerating(true);
		setAutomationMode(false);
		try {
			// All-fields mode: no x/y, reactor fills all visible fields.
			const response = await runPixel<Record<string, unknown>>(
				`GeneratePlaywrightFieldActions(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(session.sessionId)}, limit=20);`,
				effectiveInsightId,
			);

			const output = response.pixelReturn?.[0]?.output as
				| Record<string, unknown>
				| undefined;
			if (!output?.success) {
				toast(
					typeof output?.error === "string"
						? output.error
						: "Page fill failed.",
				);
				return;
			}

			const fields = Array.isArray(output?.fields) ? output.fields : [];

			if (fields.length === 0) {
				toast(
					typeof output?.message === "string"
						? output.message
						: "No editable fields could be filled from the available context.",
				);
				return;
			}

			const completed = await executeGeneratedFields(output);
			if (completed === 0) {
				toast("No generated field action could be executed.");
				return;
			}
			if (!automationModelId && typeof output.engineId === "string") {
				setAutomationModelId(output.engineId);
			}
			toast(
				`Filled ${completed} field${completed !== 1 ? "s" : ""} from Playground context.`,
			);
		} catch (error) {
			toast(error instanceof Error ? error.message : "Page fill failed.");
		} finally {
			setIsAutomationGenerating(false);
		}
	}, [
		automationModelId,
		effectiveInsightId,
		executeGeneratedFields,
		session?.sessionId,
		toolContext?.roomId,
	]);

	const executePlannedAutomationAction = useCallback(
		async (
			output: Record<string, unknown>,
			iteration: number,
		): Promise<AutomationHistoryEntry> => {
			if (!isRecord(output.action)) {
				throw new Error("Automation planner did not return an action.");
			}
			const action = output.action;
			const rawType = action.type;
			const type =
				typeof rawType === "string" ? rawType.trim().toLowerCase() : "";
			if (
				type !== "click" &&
				type !== "fill" &&
				type !== "select" &&
				type !== "scroll"
			) {
				throw new Error(
					`Automation planner returned an unsupported action type: ${JSON.stringify(rawType)}.`,
				);
			}
			const label = typeof action.label === "string" ? action.label : "";
			const expectedUrl =
				typeof output.pageUrl === "string" ? output.pageUrl : undefined;
			const expectedTabId =
				typeof output.tabId === "string" ? output.tabId : undefined;
			const reason =
				typeof output.reason === "string" ? output.reason : "";

			if (type === "scroll") {
				const deltaY =
					typeof action.deltaY === "number" ? action.deltaY : 0;
				if (!deltaY) {
					throw new Error(
						"Automation planner returned an empty scroll amount.",
					);
				}
				await sendReplayEvent({
					type: "wheel",
					requestId: crypto.randomUUID(),
					x: remoteWidth / 2,
					y: remoteHeight / 2,
					deltaX: 0,
					deltaY,
					expectedUrl,
					expectedTabId,
				});
				return {
					iteration,
					type,
					label,
					value: `${deltaY < 0 ? "up" : "down"} 70%`,
					pageUrl: expectedUrl || "",
					reason,
				};
			}
			if (!isRecord(action.selector)) {
				throw new Error("Automation action has no validated selector.");
			}
			const strategy =
				typeof action.selector.strategy === "string"
					? action.selector.strategy
					: "css";
			const selectorValue =
				typeof action.selector.value === "string"
					? action.selector.value
					: "";
			if (!selectorValue) {
				throw new Error("Automation action has an empty selector.");
			}
			const selector = {
				strategy,
				value: selectorValue,
				frameSelector:
					typeof action.selector.frameSelector === "string"
						? action.selector.frameSelector
						: null,
			};
			const tag = typeof action.tag === "string" ? action.tag : undefined;
			const isPassword = action.isPassword === true;
			const storeValue = action.storeValue === true;

			if (type === "click") {
				const coords = isRecord(action.coords) ? action.coords : {};
				await sendReplayEvent({
					type: "mouse-click",
					requestId: crypto.randomUUID(),
					x: typeof coords.x === "number" ? coords.x : 0,
					y: typeof coords.y === "number" ? coords.y : 0,
					button: "left",
					selector,
					label,
					tag,
					waitAfterMs: 500,
					expectedUrl,
					expectedTabId,
				});
				return {
					iteration,
					type,
					label,
					pageUrl: expectedUrl || "",
					reason,
				};
			}

			const value = typeof action.value === "string" ? action.value : "";
			if (!value)
				throw new Error("Automation planner returned an empty value.");
			await sendReplayEvent({
				type: "fill-element",
				requestId: crypto.randomUUID(),
				text: value,
				selector,
				label,
				tag: type === "select" ? "select" : tag,
				isPassword,
				storeValue,
				expectedUrl,
				expectedTabId,
			});
			return {
				iteration,
				type,
				label,
				value: isPassword ? "[REDACTED]" : value,
				pageUrl: expectedUrl || "",
				reason,
			};
		},
		[remoteHeight, remoteWidth, sendReplayEvent],
	);

	const cancelGoalAutomation = useCallback(() => {
		automationRunTokenRef.current += 1;
		setIsGoalAutomationRunning(false);
		setAutomationProgress(null);
		toast("Goal automation stopped.");
	}, []);

	const runGoalAutomation = useCallback(async () => {
		if (!session?.sessionId) {
			toast("No active browser session.");
			return;
		}
		const roomId = toolContext?.roomId ?? "";
		if (!roomId) {
			toast(
				"No room context available — open this tool from a Playground room.",
			);
			return;
		}

		const runToken = automationRunTokenRef.current + 1;
		automationRunTokenRef.current = runToken;
		setAutomationMode(false);
		setIsGoalAutomationRunning(true);
		const history: AutomationHistoryEntry[] = [];
		const resolvedGoal = automationGoal.trim();
		let reachedGoal = false;
		if (!resolvedGoal) {
			setIsGoalAutomationRunning(false);
			toast("Review or enter an automation goal before running.");
			return;
		}

		try {
			for (
				let iteration = 1;
				iteration <= automationMaxIterations;
				iteration += 1
			) {
				if (automationRunTokenRef.current !== runToken) return;
				setAutomationProgress({
					iteration,
					maxIterations: automationMaxIterations,
				});

				const response = await runPixel<Record<string, unknown>>(
					`PlanNextPlaywrightAction(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(session.sessionId)}, goal=${JSON.stringify(resolvedGoal)}, history=${JSON.stringify(JSON.stringify(history))}, iteration=${iteration}, maxIterations=${automationMaxIterations}, limit=20);`,
					effectiveInsightId,
				);
				if (automationRunTokenRef.current !== runToken) return;

				const output = response.pixelReturn?.[0]?.output;
				if (!isRecord(output) || output.success !== true) {
					throw new Error(
						isRecord(output) && typeof output.error === "string"
							? output.error
							: "Browser automation planning failed.",
					);
				}
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
				const reason =
					typeof output.reason === "string" ? output.reason : "";
				if (output.goalReached === true) {
					reachedGoal = true;
					toast(reason || "Browser automation reached the goal.");
					return;
				}
				if (!isRecord(output.action)) {
					toast(
						reason || "Browser automation has no safe next action.",
					);
					return;
				}

				const completed = await executePlannedAutomationAction(
					output,
					iteration,
				);
				if (automationRunTokenRef.current !== runToken) return;
				history.push(completed);
			}

			if (!reachedGoal) {
				toast(
					`Browser automation stopped after ${automationMaxIterations} iterations without confirming the goal.`,
				);
			}
		} catch (error) {
			if (automationRunTokenRef.current === runToken) {
				toast(
					error instanceof Error
						? error.message
						: "Browser automation failed.",
				);
			}
		} finally {
			if (automationRunTokenRef.current === runToken) {
				setIsGoalAutomationRunning(false);
				setAutomationProgress(null);
			}
		}
	}, [
		automationGoal,
		automationMaxIterations,
		automationModelId,
		effectiveInsightId,
		executePlannedAutomationAction,
		session?.sessionId,
		toolContext?.roomId,
	]);
	const pendingSelectionContext = pendingTextSelection?.context ?? null;

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
			{/* Toolbar row */}
			<div className="flex min-h-[38px] flex-wrap items-center gap-1 border-line border-b bg-surface px-1 py-0.5">
				<BrowserToolbar
					currentUrl={currentUrl}
					connectionState={connectionState}
					isCreating={isCreating}
					isLoading={isBrowserLoading}
					onStart={handleStart}
					onNavigate={handleNavigate}
					onBack={handleBack}
					onForward={handleForward}
					onReload={handleReload}
					isRecording={isRecording}
					isSaving={isSaving || isSavingRecording}
					canSaveRecording={!!session && isRecording}
					onToggleRecording={handleToggleRecording}
					onOpenSaveRecording={handleOpenSaveRecording}
				/>
				<div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
					{isPlaygroundMode && session && (
						<AutomationControls
							insightId={effectiveInsightId}
							isActive={
								automationMode ||
								isAutomationGenerating ||
								isGoalAutomationRunning
							}
							isGoalRunning={isGoalAutomationRunning}
							modelId={automationModelId}
							subMode={automationSubMode}
							goal={automationGoal}
							maxIterations={automationMaxIterations}
							isGoalGenerating={isAutomationGoalGenerating}
							goalGenerationError={
								automationGoalGenerationError || undefined
							}
							progressLabel={
								automationProgress
									? `Step ${automationProgress.iteration}/${automationProgress.maxIterations}`
									: undefined
							}
							onToggle={() => {
								if (isGoalAutomationRunning) {
									cancelGoalAutomation();
								} else if (automationSubMode === "run-goal") {
									void runGoalAutomation();
								} else if (automationSubMode === "fill-page") {
									void fillVisibleFieldsFromContext();
								} else {
									setAutomationMode((on) => !on);
								}
							}}
							onSubModeChange={setAutomationSubMode}
							onModelChange={setAutomationModelId}
							onGoalChange={(goal) => {
								setAutomationGoal(goal);
								setAutomationGoalGenerationError("");
							}}
							onRegenerateGoal={() =>
								void generateAutomationGoal(true)
							}
							onMaxIterationsChange={setAutomationMaxIterations}
						/>
					)}
					{selectedTextContexts.length > 0 && (
						<Button
							size="sm"
							variant={
								selectedTextContextsOpen ? "default" : "outline"
							}
							onClick={() =>
								setSelectedTextContextsOpen((open) => !open)
							}
						>
							<ScanLine />
							Contexts ({selectedTextContexts.length})
						</Button>
					)}
					{isPlaygroundMode && session && (
						<Button
							size="sm"
							disabled={
								isReturningToPlayground ||
								isSaving ||
								isSavingRecording
							}
							onClick={() => void handleOpenReturnDialog()}
						>
							{isReturningToPlayground ||
							isSaving ||
							isSavingRecording ? (
								<Spinner />
							) : (
								<Check />
							)}
							{isReturningToPlayground ||
							isSaving ||
							isSavingRecording
								? "Returning"
								: "Return to Playground"}
						</Button>
					)}
					<Button
						size="sm"
						variant={replayMenuOpen ? "default" : "outline"}
						onClick={() => {
							playback.setControlsOpen(!replayMenuOpen);
							playback.setLoadedRecordingOpen(
								!replayMenuOpen && !!playback.loadedRecording,
							);
						}}
					>
						{replayMenuOpen ? <ChevronDown /> : <ChevronRight />}
						Replay
					</Button>
					{recordedSteps.length > 0 && (
						<Button
							size="sm"
							variant={recordedStepsOpen ? "default" : "outline"}
							onClick={() =>
								setRecordedStepsOpen((open) => !open)
							}
						>
							<Circle
								className={
									isRecording ? "fill-danger text-danger" : ""
								}
							/>
							Recorded ({recordedSteps.length})
						</Button>
					)}
					{playback.isPaused && (
						<Badge
							variant="outline"
							className="border-warning text-warning"
						>
							Paused
						</Badge>
					)}
					{playback.isRunning && (
						<Badge>Step {playback.runningStepId ?? ""}</Badge>
					)}
				</div>
			</div>

			<BrowserTabStrip
				tabs={browserTabs}
				activeTabId={activeBrowserTabId}
				connectionState={connectionState}
				isRecording={isRecording}
				onSwitch={handleSwitchBrowserTab}
				onClose={handleCloseBrowserTab}
			/>

			{/* Session creation error banner */}
			{sessionError && (
				<Alert variant="destructive" className="mx-1 mt-1 w-auto py-2">
					<AlertDescription>{sessionError}</AlertDescription>
				</Alert>
			)}

			{isPlaygroundMode &&
				!isMcpPlaybackMode &&
				!session &&
				!mcpStartUrl && (
					<PlaygroundStartPrompt
						value={mcpStartUrlInput}
						isCreating={isCreating}
						onChange={setMcpStartUrlInput}
						onOpen={handleStartMcpSession}
					/>
				)}

			<div className="relative flex min-h-0 flex-1 overflow-hidden">
				{/* Click-to-fill loading indicator */}
				{isAutomationGenerating && automationClickPos && (
					<AutomationActionIndicator
						localX={automationClickPos.localX}
						localY={automationClickPos.localY}
					/>
				)}
				{pendingTextSelection && (
					<div
						className="fixed z-50 w-72 rounded-lg border border-line bg-surface p-3 text-ink shadow-xl"
						style={{
							left: Math.max(
								8,
								Math.min(
									pendingTextSelection.clientX + 10,
									window.innerWidth - 296,
								),
							),
							top: Math.max(
								8,
								Math.min(
									pendingTextSelection.clientY + 10,
									window.innerHeight - 180,
								),
							),
						}}
					>
						<div className="mb-2 flex items-center justify-between gap-2">
							<p className="font-medium text-sm">
								Selected website text
							</p>
							<Button
								size="icon-sm"
								variant="ghost"
								aria-label="Dismiss selected text"
								onClick={dismissPendingTextSelection}
							>
								<X />
							</Button>
						</div>
						{pendingSelectionContext ? (
							<>
								<p className="mb-3 line-clamp-3 text-ink-muted text-xs leading-5">
									{pendingSelectionContext.content}
								</p>
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											void (async () => {
												await handleCopySelectedContext(
													pendingSelectionContext,
												);
												dismissPendingTextSelection();
											})();
										}}
									>
										<Copy />
										Copy
									</Button>
									<Button
										size="sm"
										onClick={() => {
											void handleAddSelectedContext(
												pendingSelectionContext,
											);
										}}
									>
										<ScanLine />
										Add as context
									</Button>
								</div>
							</>
						) : (
							<div className="flex items-center gap-2 text-ink-muted text-sm">
								<Spinner />
								Reading selected text…
							</div>
						)}
					</div>
				)}
				{/* Browser canvas */}
				<BrowserViewer
					connectionState={connectionState}
					remoteWidth={remoteWidth}
					remoteHeight={remoteHeight}
					latestFrame={latestFrame}
					scrollMetrics={browserScrollMetrics}
					browserCursor={browserCursor}
					sendEvent={sendViewerEvent}
					onTextDragComplete={handleTextDragComplete}
					onUserInput={() => {
						playback.requestPause(
							"Playback will pause after your interaction",
						);
						if (pendingTextSelection) {
							dismissPendingTextSelection();
						}
						if (isGoalAutomationRunning) cancelGoalAutomation();
					}}
					automationMode={
						automationMode && automationSubMode === "click"
					}
					onAutomationClick={handleFieldAutomationTarget}
				/>

				<ReplaySidebar
					playback={playback}
					recordedStepsOpen={recordedStepsOpen}
					recordedSteps={recordedSteps}
					isRecording={isRecording}
					onToggleRecordedSteps={() =>
						setRecordedStepsOpen((open) => !open)
					}
					onSaveRecording={handleOpenSaveRecording}
					selectedTextContextsOpen={selectedTextContextsOpen}
					selectedTextContexts={selectedTextContexts}
					onToggleSelectedTextContexts={() =>
						setSelectedTextContextsOpen((open) => !open)
					}
					onCopySelectedContext={handleCopySelectedContext}
					onDeleteSelectedContext={handleDeleteSelectedContext}
					onSaveSelectedContext={handleSaveSelectedContext}
				/>
			</div>

			<ReturnToPlaygroundDialog
				open={returnDialogOpen}
				disabled={
					isReturningToPlayground || isSaving || isSavingRecording
				}
				projects={returnProjects}
				project={returnProject}
				isLoadingProjects={isLoadingReturnProjects}
				onClose={() => setReturnDialogOpen(false)}
				onProjectChange={setReturnProject}
				onSubmit={(project) => {
					void handleReturnToPlayground(project);
				}}
			/>

			<StopRecordingDialog
				open={stopRecordingDialogOpen}
				onClose={() => setStopRecordingDialogOpen(false)}
				onDiscard={handleDiscardRecording}
				onSave={handleSaveAndStopRecording}
			/>

			<PlaybackCompleteDialog
				secondsRemaining={playbackCloseCountdown}
				stepsRun={playbackStepsRun}
				onKeepOpen={handleKeepPlaybackOpen}
				onCloseNow={handleClosePlaybackNow}
			/>

			<SaveRecordingDialog
				open={saveDialogOpen}
				projects={playback.appProjects}
				project={saveProject}
				models={metadataModels}
				model={metadataModel}
				title={saveTitle}
				fileName={defaultRecordingName}
				description={saveDescription}
				intent={saveIntent}
				isLoadingProjects={isLoadingProjects}
				isLoadingModels={isLoadingMetadataModels}
				isGeneratingMetadata={isGeneratingRecordingMetadata}
				isSaving={isSaving || isSavingRecording}
				canSave={!!session && isRecording}
				onClose={() => setSaveDialogOpen(false)}
				onProjectChange={setSaveProject}
				onModelChange={setMetadataModel}
				onTitleChange={setSaveTitle}
				onDescriptionChange={setSaveDescription}
				onIntentChange={setSaveIntent}
				onGenerateMetadata={() => void handleGenerateSaveMetadata()}
				onSave={handleSaveRecording}
			/>
		</div>
	);
}
