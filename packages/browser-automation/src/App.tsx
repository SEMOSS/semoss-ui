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
import { BrowserDownloadsTray } from "./components/BrowserDownloadsTray";
import { BrowserTabStrip } from "./components/BrowserTabStrip";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BrowserViewer } from "./components/BrowserViewer";
import { BrowserDebugPanel } from "./components/browser-debug-panel";
import { PlaybackCompleteDialog } from "./components/dialogs/PlaybackCompleteDialog";
import {
	type RecordingSaveDestination,
	SaveRecordingDialog,
} from "./components/dialogs/SaveRecordingDialog";
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
	appendCapturedContext,
	buildContextReturnPlan,
	normalizeContextLimits,
	renderSelectedTextContext,
} from "./domain/selected-text";
import {
	getToolBooleanParameter,
	getToolStringMapParameter,
	getToolStringParameter,
	isPlayRecordingTool,
} from "./domain/tool-context";
import { useAutomation } from "./hooks/useAutomation";
import { useBrowserDebug } from "./hooks/useBrowserDebug";
import { useBrowserSocket } from "./hooks/useBrowserSocket";
import { useDownloads } from "./hooks/useDownloads";
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
import type {
	BrowserScrollMetrics,
	BrowserTabInfo,
	ClientToServerEvent,
	GeneratedRecordingMetadata,
	LoadedRecordingStep,
	McpToolContext,
	RecordingMetadataModelOption,
	RemoteBrowserRecordedStep,
	SelectedTextContext,
	SelectionBounds,
	StepsEnvelope,
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

type PendingTextSelection = {
	context: SelectedTextContext | null;
	clientX: number;
	clientY: number;
};

type ReplayContextCaptureError = {
	stepId: number | null;
	error: string;
};

type PendingMcpPlaybackCompletion = {
	recordingFile: string;
	projectId: string | null;
	stepsRun: number;
	sessionId: string;
	roomId: string;
	executedParameters: Record<string, unknown>;
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
		listDownloads,
		saveDownloadsToInsight,
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
	const activeBrowserTabIdRef = useRef("tab-1");
	const browserTabsRef = useRef<BrowserTabInfo[]>([]);
	const [snackError, setSnackError] = useState<string | null>(null);
	const [snackMessage, setSnackMessage] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [toolContext, setToolContext] = useState<McpToolContext | null>(null);
	const [semossContextReady, setSemossContextReady] = useState(false);
	const [mcpStartUrlInput, setMcpStartUrlInput] = useState("");
	const [isReturningToPlayground, setIsReturningToPlayground] =
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
	const [saveDestination, setSaveDestination] =
		useState<RecordingSaveDestination>("playground");
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
	const [includedContextIds, setIncludedContextIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [returnBudgetChars, setReturnBudgetChars] = useState(
		() => normalizeContextLimits(null).defaultReturnBudgetChars,
	);
	const [selectedTextContextsOpen, setSelectedTextContextsOpen] =
		useState(false);
	const [isCapturingFullPage, setIsCapturingFullPage] = useState(false);
	const [pendingTextSelection, setPendingTextSelection] =
		useState<PendingTextSelection | null>(null);
	const [pendingNavigationCount, setPendingNavigationCount] = useState(0);
	const [isRemoteNavigating, setIsRemoteNavigating] = useState(false);
	const [recordedStepsOpen, setRecordedStepsOpen] = useState(false);
	const [playbackCloseCountdown, setPlaybackCloseCountdown] = useState<
		number | null
	>(null);
	const [playbackStepsRun, setPlaybackStepsRun] = useState(0);

	const autoStartedRef = useRef(false);
	const autoRecordingStartedRef = useRef(false);
	const autoPlaybackProjectSelectedRef = useRef(false);
	const autoPlaybackRecordingSelectedRef = useRef(false);
	const autoPlaybackLoadStartedRef = useRef(false);
	const autoPlaybackRunStartedRef = useRef(false);
	const autoPlaybackErrorSentRef = useRef(false);
	const returningToPlaygroundRef = useRef(false);
	const selectedContextSequenceRef = useRef(0);
	const selectedTextContextsRef = useRef<SelectedTextContext[]>([]);
	// Refs are required because MCP replay completion runs outside React state.
	const includedContextIdsRef = useRef<Set<string>>(new Set());
	const returnBudgetCharsRef = useRef(returnBudgetChars);
	const replayContextCaptureErrorsRef = useRef<ReplayContextCaptureError[]>(
		[],
	);
	const pendingMcpPlaybackCompletionRef =
		useRef<PendingMcpPlaybackCompletion | null>(null);
	const mcpPlaybackCompletionPromiseRef = useRef<Promise<void> | null>(null);
	const mcpPlaybackResponseSentRef = useRef(false);
	const textSelectionRequestRef = useRef(0);
	const activeToolExecutionRef = useRef("");

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

	const contextLimits = useMemo(
		() => normalizeContextLimits(session?.contextLimits),
		[session?.contextLimits],
	);
	const contextLimitsRef = useRef(contextLimits);
	contextLimitsRef.current = contextLimits;
	returnBudgetCharsRef.current = returnBudgetChars;

	const resetCapturedContexts = useCallback(() => {
		selectedTextContextsRef.current = [];
		setSelectedTextContexts([]);
		includedContextIdsRef.current = new Set();
		setIncludedContextIds(new Set());
		selectedContextSequenceRef.current = 0;
		const budget = contextLimitsRef.current.defaultReturnBudgetChars;
		returnBudgetCharsRef.current = budget;
		setReturnBudgetChars(budget);
	}, []);

	const contextReturnPlan = useMemo(
		() =>
			buildContextReturnPlan(
				selectedTextContexts,
				includedContextIds,
				returnBudgetChars,
			),
		[includedContextIds, returnBudgetChars, selectedTextContexts],
	);

	/** Every MCP return path must build its payload from the latest refs. */
	const buildContextResponsePayload = useCallback(() => {
		const plan = buildContextReturnPlan(
			selectedTextContextsRef.current,
			includedContextIdsRef.current,
			returnBudgetCharsRef.current,
		);
		return {
			capturedContextCount: plan.summary.capturedContextCount,
			contextCount: plan.contexts.length,
			contexts: plan.contexts,
			contextBudget: plan.summary,
		};
	}, []);

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
	const captureFullPageAtEnd =
		getToolBooleanParameter(toolContext, "capture_full_page_at_end") ||
		getToolBooleanParameter(toolContext, "captureFullPageAtEnd");
	const mcpPlaybackProjectId =
		getToolStringParameter(toolContext, "project_id") ||
		getToolStringParameter(toolContext, "projectId") ||
		// Generated MCP calls may omit schema defaults; _meta still carries the project.
		toolContext?.projectId ||
		"";
	const effectiveInsightId = getSemossInsightId() || insightId;
	const effectiveInsightIdRef = useRef(effectiveInsightId);
	effectiveInsightIdRef.current = effectiveInsightId;

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
		setCurrentUrl(url === "about:blank" ? "" : url);
		textSelectionRequestRef.current += 1;
		setPendingTextSelection(null);
	}, []);

	const handleSocketError = useCallback((msg: string) => {
		setSnackError(msg);
	}, []);

	const handleTabsChanged = useCallback(
		(tabs: BrowserTabInfo[], activeTabId: string) => {
			browserTabsRef.current = tabs;
			activeBrowserTabIdRef.current = activeTabId;
			setBrowserTabs(tabs);
			setActiveBrowserTabId(activeTabId);
			const activeTab = tabs.find((tab) => tab.tabId === activeTabId);
			if (activeTab?.url)
				setCurrentUrl(
					activeTab.url === "about:blank" ? "" : activeTab.url,
				);
		},
		[],
	);

	const handleTabActivated = useCallback((tabId: string) => {
		activeBrowserTabIdRef.current = tabId;
		setActiveBrowserTabId(tabId);
		const activeTab = browserTabsRef.current.find(
			(tab) => tab.tabId === tabId,
		);
		if (activeTab?.url)
			setCurrentUrl(activeTab.url === "about:blank" ? "" : activeTab.url);
		setLatestFrame(null);
		setBrowserScrollMetrics({
			scrollTop: 0,
			scrollHeight: 1,
			viewportHeight: 1,
		});
	}, []);

	const {
		downloads,
		downloadErrors,
		downloadsOpen,
		setDownloadsOpen,
		applyDownloadSaveResponse,
		flushDownloads,
		downloadMcpPayload,
		resetDownloads,
		handleDownload,
	} = useDownloads({
		insightId: effectiveInsightId,
		insightIdRef: effectiveInsightIdRef,
		listDownloads,
		saveDownloadsToInsight,
	});

	const {
		debugEvents,
		debugDroppedCount,
		debugOpen,
		debugPaused,
		handleDebugEvents,
		bindSetDebugEnabled,
		handleToggleDebug,
		handleToggleDebugPause,
		handleClearDebug,
	} = useBrowserDebug({
		sessionId: session?.sessionId,
		onError: setSnackError,
		onSessionChange: useCallback(() => setBrowserCursor("default"), []),
	});

	const {
		connectionState,
		sendEvent,
		sendReplayEvent,
		sendTabControlEvent,
		sendRecordingControlEvent,
		setDebugEnabled,
		captureSelectedText,
		captureFullPageText,
	} = useBrowserSocket({
		wsUrl: session?.webSocketUrl ?? null,
		onFrame: handleFrame,
		onNavigated: handleNavigated,
		onLoadingChanged: setIsRemoteNavigating,
		onError: handleSocketError,
		onTabsChanged: handleTabsChanged,
		onTabActivated: handleTabActivated,
		onCursorChanged: setBrowserCursor,
		onDownload: handleDownload,
		onDebugEvents: handleDebugEvents,
	});
	bindSetDebugEnabled(setDebugEnabled);

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
	const remoteWidth = session?.viewport.width ?? 1365;
	const remoteHeight = session?.viewport.height ?? 768;
	const {
		automationMode,
		setAutomationMode,
		automationModelId,
		setAutomationModelId,
		automationSubMode,
		setAutomationSubMode,
		isAutomationGenerating,
		isGoalAutomationRunning,
		automationGoal,
		setAutomationGoal,
		isAutomationGoalGenerating,
		automationGoalGenerationError,
		setAutomationGoalGenerationError,
		automationMaxIterations,
		setAutomationMaxIterations,
		automationProgress,
		automationClickPos,
		resetAutomationGoal,
		generateAutomationGoal,
		handleFieldAutomationTarget,
		fillVisibleFieldsFromContext,
		cancelGoalAutomation,
		runGoalAutomation,
	} = useAutomation({
		sessionId: session?.sessionId,
		toolContext,
		insightId: effectiveInsightId,
		toolExecutionKey,
		isPlaygroundMode,
		isMcpPlaybackMode,
		remoteWidth,
		remoteHeight,
		sendReplayEvent,
	});

	const storeSelectedTextContext = useCallback(
		(context: SelectedTextContext): SelectedTextContext => {
			selectedContextSequenceRef.current += 1;
			const title = (context.title || "Website text").trim().slice(0, 72);
			const limits = contextLimitsRef.current;
			const maxChars =
				context.kind === "full-page-text"
					? limits.fullPageCaptureHardLimitChars
					: limits.selectedCaptureHardLimitChars;
			const trimmed = context.content.trim();
			const boundedContent = trimmed.slice(0, maxChars);
			const clientTruncated = trimmed.length > boundedContent.length;
			const stored: SelectedTextContext = {
				...context,
				label: `${title} - ${context.kind === "full-page-text" ? "Full page" : "Selection"} ${selectedContextSequenceRef.current}`,
				content: boundedContent,
				text: renderSelectedTextContext({
					...context,
					content: boundedContent,
				}),
				stats: {
					...context.stats,
					characterCount: boundedContent.length,
					truncated: context.stats.truncated || clientTruncated,
					...(clientTruncated
						? {
								originalCharacterCount: trimmed.length,
								includedCharacterCount: boundedContent.length,
								omittedCharacterCount:
									trimmed.length - boundedContent.length,
								limitChars: maxChars,
								truncationReason: "capture-character-limit",
							}
						: {}),
				},
			};
			const { contexts: next, removed } = appendCapturedContext(
				selectedTextContextsRef.current,
				stored,
				limits.maxCapturedContexts,
			);
			selectedTextContextsRef.current = next;
			setSelectedTextContexts(next);
			const included = new Set(includedContextIdsRef.current);
			included.add(stored.id);
			if (removed) included.delete(removed.id);
			includedContextIdsRef.current = included;
			setIncludedContextIds(included);
			setSelectedTextContextsOpen(true);
			const original =
				stored.stats.originalCharacterCount ?? boundedContent.length;
			const omitted = stored.stats.omittedCharacterCount ?? 0;
			setSnackMessage(
				stored.stats.truncated && omitted > 0
					? `Captured ${boundedContent.length.toLocaleString()} of ${original.toLocaleString()} source characters. ${omitted.toLocaleString()} were omitted.`
					: `Captured ${boundedContent.length.toLocaleString()} characters of website text`,
			);
			if (removed) {
				setSnackError(
					`Removed "${removed.label ?? removed.title}" because only ${limits.maxCapturedContexts} captured contexts are kept.`,
				);
			}
			return stored;
		},
		[],
	);
	const captureAndStoreFullPage = useCallback(async () => {
		setIsCapturingFullPage(true);
		try {
			const context = await captureFullPageText(
				activeBrowserTabIdRef.current,
			);
			const stored = storeSelectedTextContext(context);
			return stored;
		} finally {
			setIsCapturingFullPage(false);
		}
	}, [captureFullPageText, storeSelectedTextContext]);
	const recordReplayContextCaptureError = useCallback(
		(stepId: number, error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: "Could not capture selected website text";
			replayContextCaptureErrorsRef.current.push({
				stepId,
				error: message,
			});
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
			const context = await captureSelectedText(
				{
					startX: coordinate(start, "x", scaleX),
					startY: coordinate(start, "y", scaleY),
					endX: coordinate(end, "x", scaleX),
					endY: coordinate(end, "y", scaleY),
				},
				false,
				undefined,
				activeBrowserTabIdRef.current,
			);
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
		onContextError: recordReplayContextCaptureError,
		onError: setSnackError,
		onMessage: setSnackMessage,
		onReplayDownloads: (downloads, errors) =>
			applyDownloadSaveResponse({ downloads, downloadErrors: errors }),
	});

	// Read through refs so the run-once resolution effect keeps its in-flight fetch.
	const playbackProjectsRef = useRef(playback.projects);
	playbackProjectsRef.current = playback.projects;
	const playbackProjectRef = useRef(playback.project);
	playbackProjectRef.current = playback.project;

	const toolContextRef = useRef(toolContext);
	toolContextRef.current = toolContext;

	const isInsightReady = !!effectiveInsightId;

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
		pendingMcpPlaybackCompletionRef.current = null;
		mcpPlaybackCompletionPromiseRef.current = null;
		mcpPlaybackResponseSentRef.current = false;
		returningToPlaygroundRef.current = false;
		setPlaybackCloseCountdown(null);
		setIsReturningToPlayground(false);
		setSaveDialogOpen(false);
		resetCapturedContexts();
		resetDownloads();
		setRecordedSteps([]);
		resetAutomationGoal();
		playback.resetExecution();
	}, [
		playback.resetExecution,
		resetAutomationGoal,
		resetCapturedContexts,
		resetDownloads,
		toolExecutionKey,
	]);

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
			const tabScopedEvent = {
				...event,
				expectedTabId: activeBrowserTabIdRef.current,
			} as ClientToServerEvent;
			// Fire-and-forget so cursor motion does not trigger the activity indicator.
			if (event.type === "mouse-move") {
				sendEvent(tabScopedEvent);
				return;
			}
			void runBrowserAction(tabScopedEvent);
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
			resetDownloads();
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
		resetDownloads,
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
			// Keeping source as "room" once resolved; selectProject() would flip it.
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
		// Not gated on playback.projects: room recordings need no MCP project.
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
				// The selected room file is inserted even if the catalog listing fails.
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

			// Project-backed tools resolve against the project; the room path would 404.
			if (exactFileName && !mcpPlaybackProjectId) {
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

			// Only the project-sourced branch below dereferences it.
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
		// playback.project / playback.projects read through refs; see the refs above.
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
				const context = await captureSelectedText(
					bounds,
					false,
					undefined,
					activeBrowserTabIdRef.current,
				);
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
				// Ordinary drags (sliders, maps) are not text selections; stay quiet.
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
						activeBrowserTabIdRef.current,
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

	const handleDeleteSelectedContext = useCallback((contextId: string) => {
		const next = selectedTextContextsRef.current.filter(
			(context) => context.id !== contextId,
		);
		selectedTextContextsRef.current = next;
		setSelectedTextContexts(next);
		const included = new Set(includedContextIdsRef.current);
		included.delete(contextId);
		includedContextIdsRef.current = included;
		setIncludedContextIds(included);
		if (!next.length) setSelectedTextContextsOpen(false);
	}, []);

	const handleToggleContextIncluded = useCallback(
		(contextId: string, include: boolean) => {
			const included = new Set(includedContextIdsRef.current);
			if (include) included.add(contextId);
			else included.delete(contextId);
			includedContextIdsRef.current = included;
			setIncludedContextIds(included);
		},
		[],
	);

	const handleReturnBudgetChange = useCallback((chars: number) => {
		const budget = Math.min(
			Math.max(1, Math.floor(chars)),
			contextLimitsRef.current.maximumReturnBudgetChars,
		);
		returnBudgetCharsRef.current = budget;
		setReturnBudgetChars(budget);
	}, []);

	const handleSaveSelectedContext = useCallback(
		(contextId: string, content: string) => {
			const limits = contextLimitsRef.current;
			const current = selectedTextContextsRef.current;
			const next = current.map((context) => {
				if (context.id !== contextId) return context;
				const maxChars =
					context.kind === "full-page-text"
						? limits.fullPageCaptureHardLimitChars
						: limits.selectedCaptureHardLimitChars;
				const trimmed = content.trim();
				const bounded = trimmed.slice(0, maxChars);
				const updated = {
					...context,
					content: bounded,
					edited: true,
					// Capture-origin truncation metadata is preserved as-is.
					stats: {
						...context.stats,
						characterCount: bounded.length,
					},
				};
				return {
					...updated,
					text: renderSelectedTextContext(updated),
				};
			});
			selectedTextContextsRef.current = next;
			setSelectedTextContexts(next);
			setSnackMessage("Captured context updated");
		},
		[],
	);

	const handleCaptureFullPage = useCallback(async () => {
		try {
			await captureAndStoreFullPage();
		} catch (error) {
			setSnackError(
				error instanceof Error
					? error.message
					: "Could not capture full-page website text",
			);
		}
	}, [captureAndStoreFullPage]);

	// --- Toolbar handlers ---------------------------------------------------
	const handleStart = useCallback(
		async (url: string) => {
			const normalizedUrl = normalizeBrowserUrl(url);
			setCurrentUrl(normalizedUrl);
			const info = await createSession(normalizedUrl);
			if (info) {
				resetDownloads();
				resetCapturedContexts();
				setSelectedTextContextsOpen(false);
				setCurrentUrl(info.currentUrl || normalizedUrl);
				setLatestFrame(null);
				setBrowserTabs([]);
				browserTabsRef.current = [];
				setActiveBrowserTabId("tab-1");
				playback.resetReplayPreparation();
				setIsRecording(false);
			}
		},
		[
			createSession,
			playback.resetReplayPreparation,
			resetCapturedContexts,
			resetDownloads,
		],
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
		resetDownloads();
		resetCapturedContexts();
		setSelectedTextContextsOpen(false);
		setLatestFrame(null);
		setBrowserTabs([]);
		browserTabsRef.current = [];
		setActiveBrowserTabId("tab-1");
		playback.resetReplayPreparation();
		setIsRecording(false);
	}, [
		createSession,
		mcpStartUrlInput,
		playback.resetReplayPreparation,
		resetCapturedContexts,
		resetDownloads,
	]);

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
		resetDownloads();
	}, [
		closeSession,
		playback.resetReplayPreparation,
		resetDownloads,
		sendEvent,
	]);

	const closeBrowserSessionRef = useRef(closeBrowserSession);
	closeBrowserSessionRef.current = closeBrowserSession;

	/**
	 * Completes a finished MCP replay exactly once. Keeping the browser open leaves
	 * this response pending so context captured during inspection is included.
	 */
	const completePendingMcpPlayback = useCallback(
		async (closeBrowser: boolean) => {
			if (mcpPlaybackCompletionPromiseRef.current) {
				return mcpPlaybackCompletionPromiseRef.current;
			}
			const pending = pendingMcpPlaybackCompletionRef.current;
			if (!pending || mcpPlaybackResponseSentRef.current) return;

			const completion = (async () => {
				// Snapshot downloads before closing resets local state.
				await flushDownloads();
				const contextPayload = buildContextResponsePayload();
				const downloadPayload = downloadMcpPayload();
				sendMcpResponseToPlayground(
					{
						played: true,
						status: "completed",
						recordingFile: pending.recordingFile,
						projectId: pending.projectId,
						stepsRun: pending.stepsRun,
						pausedAtStepId: null,
						sessionId: pending.sessionId,
						roomId: pending.roomId,
						...contextPayload,
						contextCaptureErrors:
							replayContextCaptureErrorsRef.current,
						...downloadPayload,
					},
					"success",
					pending.executedParameters,
				);
				mcpPlaybackResponseSentRef.current = true;
				pendingMcpPlaybackCompletionRef.current = null;
				setPlaybackCloseCountdown(null);

				if (closeBrowser) {
					await closeBrowserSessionRef.current();
				}
			})();
			mcpPlaybackCompletionPromiseRef.current = completion;
			try {
				await completion;
			} finally {
				if (mcpPlaybackCompletionPromiseRef.current === completion) {
					mcpPlaybackCompletionPromiseRef.current = null;
				}
			}
		},
		[buildContextResponsePayload, downloadMcpPayload, flushDownloads],
	);

	useEffect(() => {
		if (playbackCloseCountdown === null) {
			return;
		}
		if (playbackCloseCountdown <= 0) {
			setPlaybackCloseCountdown(null);
			void completePendingMcpPlayback(true).catch((error) => {
				setSnackError(
					error instanceof Error
						? error.message
						: "Failed to return playback to Playground",
				);
			});
			return;
		}
		const timer = window.setTimeout(() => {
			setPlaybackCloseCountdown((current) =>
				current === null ? null : current - 1,
			);
		}, 1000);
		return () => window.clearTimeout(timer);
	}, [completePendingMcpPlayback, playbackCloseCountdown]);

	const handleKeepPlaybackOpen = useCallback(() => {
		setPlaybackCloseCountdown(null);
		setSnackMessage(
			"Browser kept open. Capture any context, then return to Playground when ready.",
		);
	}, []);

	const handleClosePlaybackAndReturn = useCallback(() => {
		setPlaybackCloseCountdown(null);
		void completePendingMcpPlayback(true).catch((error) => {
			setSnackError(
				error instanceof Error
					? error.message
					: "Failed to return playback to Playground",
			);
		});
	}, [completePendingMcpPlayback]);

	const handleSwitchBrowserTab = useCallback(
		async (tabId: string) => {
			if (tabId === activeBrowserTabId) return;
			setLatestFrame(null);
			try {
				await sendTabControlEvent({
					type: "switch-tab",
					targetTabId: tabId,
					requestId: crypto.randomUUID(),
				});
				activeBrowserTabIdRef.current = tabId;
				setActiveBrowserTabId(tabId);
				const tab = browserTabsRef.current.find(
					(candidate) => candidate.tabId === tabId,
				);
				if (tab?.url)
					setCurrentUrl(tab.url === "about:blank" ? "" : tab.url);
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

	const handleNewBrowserTab = useCallback(async () => {
		playback.requestPause("Playback will pause after opening a new tab");
		setLatestFrame(null);
		setCurrentUrl("");
		try {
			await sendTabControlEvent({
				type: "new-tab",
				requestId: crypto.randomUUID(),
			});
		} catch (error) {
			setSnackError(
				error instanceof Error
					? error.message
					: "Could not open a new browser tab",
			);
		}
	}, [playback, sendTabControlEvent]);

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
			resetDownloads();
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
	}, [
		isRecording,
		playback.resetReplayPreparation,
		resetDownloads,
		sendEvent,
	]);

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
		setSaveDestination(
			isPlaygroundMode ? "playground" : "playground-and-app",
		);
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
	}, [effectiveInsightId, isPlaygroundMode, metadataModels]);

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

	/**
	 * Writes the recording, its metadata and the regenerated room MCP entry into
	 * the Playground room. Both "Save recording" and "Return to Playground" go
	 * through here so the two paths cannot drift apart.
	 *
	 * Metadata and the file name are resolved by the caller because they differ:
	 * the save dialog supplies values typed by the user, while Return to
	 * Playground generates them from the recorded actions. Both are resolved
	 * after the room insight is bound, since generation needs that insight ID.
	 */
	const saveRecordingToRoom = useCallback(
		async (
			resolveMetadata: (
				insightId: string,
			) => Promise<GeneratedRecordingMetadata | null>,
			resolveFileName: (envelope: StepsEnvelope) => string,
		): Promise<{
			insightId: string;
			envelope: StepsEnvelope;
			fileName: string;
			roomPath: string;
		}> => {
			if (!session) {
				throw new Error(
					"No active browser session is available to save",
				);
			}
			if (!toolContext?.roomId) {
				throw new Error(
					"No Playground room ID is available for room file save",
				);
			}
			await bindSemossInsightToRoom(toolContext.roomId);
			const insightId = getSemossInsightId() || effectiveInsightId;
			if (!insightId) {
				throw new Error(
					"No SEMOSS insight is available for room file save",
				);
			}
			// Lets a download from the final recorded click mark it before serializing.
			await flushDownloads();
			const envelope = await getRecordingEnvelope();
			if (!envelope) {
				throw new Error("No recording envelope is available");
			}
			const enrichedEnvelope = applyGeneratedRecordingMetadata(
				enrichEnvelopeForRoomSave(
					envelope,
					session.sessionId,
					mcpRecordingNameHint,
					mcpStartUrl,
				),
				await resolveMetadata(insightId),
			);
			const saved = await saveRoomRecording(
				insightId,
				resolveFileName(enrichedEnvelope),
				enrichedEnvelope,
			);
			if (!saved) {
				throw new Error(
					"Failed to save recording to the Playground room",
				);
			}
			// Required, not best-effort: writing it is what exposes the new tools.
			await saveRoomMcpEntry(
				insightId,
				saved.fileName,
				enrichedEnvelope,
				toolContext.roomId,
				toolContext.projectId,
			);
			return {
				insightId,
				envelope: enrichedEnvelope,
				fileName: saved.fileName,
				roomPath: saved.roomPath,
			};
		},
		[
			effectiveInsightId,
			flushDownloads,
			getRecordingEnvelope,
			mcpRecordingNameHint,
			mcpStartUrl,
			saveRoomMcpEntry,
			saveRoomRecording,
			session,
			toolContext,
		],
	);

	const handleSaveRecording = useCallback(async () => {
		const title = saveTitle.trim();
		const description = saveDescription.trim();
		const intent = saveIntent.trim();
		const saveToPlayground = isPlaygroundMode;
		const saveToApp =
			!isPlaygroundMode || saveDestination === "playground-and-app";
		if (saveToApp && !saveProject) {
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

			let roomPath = "";
			let roomBoundInsightId = effectiveInsightId;
			// Drain downloads first so a late callback can still mark its producing click.
			if (!saveToPlayground) {
				await flushDownloads();
			}
			if (saveToPlayground) {
				const roomSaved = await saveRecordingToRoom(
					async () => ({ success: true, title, description, intent }),
					() => defaultRecordingName,
				);
				roomBoundInsightId = roomSaved.insightId;
				roomPath = roomSaved.roomPath;
			}

			let appFileName = "";
			if (saveToApp && saveProject) {
				const appSaved = await saveRecording({
					project: saveProject.value,
					name: defaultRecordingName,
					title,
					description,
					intent,
				});
				if (!appSaved) {
					throw new Error(
						"Failed to save recording to the selected app",
					);
				}
				await saveProjectMcpEntry(roomBoundInsightId, appSaved.project);
				playback.selectSavedRecording(saveProject, appSaved.fileName);
				appFileName = appSaved.fileName;
			}
			// Closing the session removes staged files, so drain against the bound insight.
			effectiveInsightIdRef.current =
				roomBoundInsightId || effectiveInsightIdRef.current;
			await flushDownloads();

			setSaveDialogOpen(false);
			await closeBrowserSession();
			browserClosed = true;

			setSnackMessage(
				roomPath && appFileName
					? "Saved recording to Playground and app"
					: `Saved recording: ${roomPath || appFileName}`,
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
		isPlaygroundMode,
		saveDescription,
		saveDestination,
		saveIntent,
		saveProject,
		saveRecording,
		saveProjectMcpEntry,
		saveRecordingToRoom,
		saveTitle,
		sendRecordingControlEvent,
		session,
		flushDownloads,
		playback.selectSavedRecording,
	]);

	const handleOpenSaveRecording = useCallback(() => {
		void prepareSaveDialog();
	}, [prepareSaveDialog]);

	const handleReturnToPlayground = useCallback(async () => {
		if (returningToPlaygroundRef.current) return;
		returningToPlaygroundRef.current = true;
		setIsReturningToPlayground(true);
		if (isMcpPlaybackMode) {
			try {
				if (!pendingMcpPlaybackCompletionRef.current) {
					throw new Error(
						playback.isRunning
							? "Playback is still running"
							: "No completed playback is waiting to return",
					);
				}
				await completePendingMcpPlayback(true);
				setSnackMessage(
					"Playback and captured context returned to Playground",
				);
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Failed to return playback to Playground",
				);
			} finally {
				setIsReturningToPlayground(false);
				returningToPlaygroundRef.current = false;
			}
			return;
		}

		let recordingStopped = false;
		let browserClosed = false;
		const contextCaptureErrors: ReplayContextCaptureError[] = [];
		try {
			if (!toolContext) {
				throw new Error("No Playground tool context is available");
			}
			const roomId = toolContext.roomId;
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
			if (captureFullPageAtEnd) {
				try {
					await captureAndStoreFullPage();
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Could not capture full-page website text";
					contextCaptureErrors.push({ stepId: null, error: message });
				}
			}

			const saved = await saveRecordingToRoom(
				(insightId) =>
					generatePlaywrightRecordingMetadata({
						sessionId: session.sessionId,
						roomId,
						recordingNameHint: mcpRecordingNameHint,
						insightId,
						historyLimit: 8,
					}),
				(enrichedEnvelope) =>
					buildRecordingFileName(
						enrichedEnvelope,
						mcpRecordingNameHint,
						mcpStartUrl,
						enrichedEnvelope.meta?.title || "",
					),
			);
			const enrichedEnvelope = saved.envelope;
			effectiveInsightIdRef.current = saved.insightId;
			await flushDownloads();
			const downloadPayload = downloadMcpPayload();

			await closeBrowserSession();
			browserClosed = true;

			sendMcpResponseToPlayground(
				{
					saved: true,
					destination: "room",
					savedToPlaywrightApp: false,
					appProjectId: null,
					appFileName: null,
					recordingPath: saved.roomPath,
					fileName: saved.fileName,
					sessionId: session.sessionId,
					roomId,
					startUrl: getRecordingStartUrl(
						enrichedEnvelope,
						mcpStartUrl,
					),
					title: enrichedEnvelope.meta?.title,
					description: enrichedEnvelope.meta?.description,
					...buildContextResponsePayload(),
					contextCaptureErrors,
					...downloadPayload,
				},
				"success",
				toolContext.parameters,
			);
			setRecordedSteps([]);
			setSnackMessage(`Saved recording: ${saved.roomPath}`);
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
	}, [
		closeBrowserSession,
		completePendingMcpPlayback,
		buildContextResponsePayload,
		captureAndStoreFullPage,
		captureFullPageAtEnd,
		downloadMcpPayload,
		flushDownloads,
		isMcpPlaybackMode,
		isRecording,
		mcpRecordingNameHint,
		mcpStartUrl,
		saveRecordingToRoom,
		sendRecordingControlEvent,
		session,
		playback.isRunning,
		toolContext,
	]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackLoadStartedRef.current ||
			connectionState !== "connected" ||
			!session ||
			// Room recordings come from the room folder, so a project is not required.
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
		resetDownloads();
		replayContextCaptureErrorsRef.current = [];
		const selectedRecording = playback.selectedRecording;
		const selectedProjectId = playback.project?.value ?? null;
		const expectsDownload = playback.flattenedSteps.some(
			({ step }) => step.downloadExpected === true,
		);

		(async () => {
			try {
				const result = await playback.run();
				if (!result) {
					throw new Error("Playback did not start");
				}

				if (result.completed && captureFullPageAtEnd) {
					try {
						await captureAndStoreFullPage();
					} catch (error) {
						replayContextCaptureErrorsRef.current.push({
							stepId: null,
							error:
								error instanceof Error
									? `Full-page capture failed: ${error.message}`
									: "Full-page capture failed",
						});
					}
				}
				await flushDownloads(result.completed && expectsDownload);

				// Held pending so later context and downloads reach the response.
				if (result.completed) {
					pendingMcpPlaybackCompletionRef.current = {
						recordingFile: selectedRecording,
						projectId: selectedProjectId,
						stepsRun: result.stepsRun,
						sessionId: session.sessionId,
						roomId: toolContext.roomId,
						executedParameters: toolContext.parameters,
					};
					setPlaybackStepsRun(result.stepsRun);
					setPlaybackCloseCountdown(PLAYBACK_CLOSE_SECONDS);
					return;
				}

				const downloadPayload = downloadMcpPayload();

				const contextPayload = buildContextResponsePayload();
				sendMcpResponseToPlayground(
					{
						played: false,
						status: "paused",
						recordingFile: selectedRecording,
						projectId: selectedProjectId,
						stepsRun: result.stepsRun,
						pausedAtStepId: result.pausedAtStepId ?? null,
						sessionId: session.sessionId,
						roomId: toolContext.roomId,
						...contextPayload,
						contextCaptureErrors:
							replayContextCaptureErrorsRef.current,
						...downloadPayload,
					},
					"paused",
					toolContext.parameters,
				);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to play recording";
				setSnackError(message);
				try {
					const downloadPayload = downloadMcpPayload();
					sendMcpResponseToPlayground(
						{ played: false, error: message, ...downloadPayload },
						"error",
						toolContext.parameters,
					);
				} catch {
					// Nothing else to do if the iframe cannot notify Playground.
				}
			}
		})();
	}, [
		buildContextResponsePayload,
		captureAndStoreFullPage,
		captureFullPageAtEnd,
		downloadMcpPayload,
		flushDownloads,
		connectionState,
		isMcpPlaybackMode,
		playback,
		resetDownloads,
		session,
		toolContext,
	]);

	const isBrowserLoading =
		isCreating || pendingNavigationCount > 0 || isRemoteNavigating;
	const replayMenuOpen =
		playback.controlsOpen || playback.loadedRecordingOpen;

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
					isCapturingFullPage={isCapturingFullPage}
					onCaptureFullPage={() => void handleCaptureFullPage()}
					isDebugOpen={debugOpen}
					onToggleDebug={() => void handleToggleDebug()}
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
					{(downloads.length > 0 || downloadErrors.length > 0) && (
						<BrowserDownloadsTray
							downloads={downloads}
							errors={downloadErrors}
							open={downloadsOpen}
							onToggle={() => setDownloadsOpen((open) => !open)}
						/>
					)}
					{isPlaygroundMode && session && (
						<Button
							size="sm"
							disabled={
								isReturningToPlayground ||
								isCapturingFullPage ||
								isSaving ||
								isSavingRecording
							}
							onClick={() => void handleReturnToPlayground()}
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
				onNew={() => void handleNewBrowserTab()}
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

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
						contextLimits={contextLimits}
						contextReturnPlan={contextReturnPlan}
						returnBudgetChars={returnBudgetChars}
						includedContextIds={includedContextIds}
						onToggleSelectedTextContexts={() =>
							setSelectedTextContextsOpen((open) => !open)
						}
						onCopySelectedContext={handleCopySelectedContext}
						onDeleteSelectedContext={handleDeleteSelectedContext}
						onSaveSelectedContext={handleSaveSelectedContext}
						onToggleContextIncluded={handleToggleContextIncluded}
						onReturnBudgetChange={handleReturnBudgetChange}
					/>
				</div>
				{debugOpen && (
					<BrowserDebugPanel
						events={debugEvents}
						droppedCount={debugDroppedCount}
						isPaused={debugPaused}
						onTogglePause={() => void handleToggleDebugPause()}
						onClear={() => void handleClearDebug()}
						onClose={() => void handleToggleDebug()}
					/>
				)}
			</div>

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
				onCloseAndReturn={handleClosePlaybackAndReturn}
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
				showPlaygroundDestinations={isPlaygroundMode}
				destination={saveDestination}
				onClose={() => setSaveDialogOpen(false)}
				onProjectChange={setSaveProject}
				onModelChange={setMetadataModel}
				onTitleChange={setSaveTitle}
				onDescriptionChange={setSaveDescription}
				onIntentChange={setSaveIntent}
				onGenerateMetadata={() => void handleGenerateSaveMetadata()}
				onDestinationChange={setSaveDestination}
				onSave={handleSaveRecording}
			/>
		</div>
	);
}
