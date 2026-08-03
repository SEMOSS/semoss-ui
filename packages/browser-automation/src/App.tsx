import {
	Check,
	ChevronDown,
	ChevronRight,
	Circle,
	ScanLine,
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
import { BrowserTabStrip } from "./components/BrowserTabStrip";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BrowserViewer } from "./components/BrowserViewer";
import { ConnectionStatus } from "./components/ConnectionStatus";
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
import type {
	BrowserTabInfo,
	ClientToServerEvent,
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
	const [selectionMode, setSelectionMode] = useState(false);
	const [isCapturingSelectedText, setIsCapturingSelectedText] =
		useState(false);
	const [pendingBrowserActionCount, setPendingBrowserActionCount] =
		useState(0);
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
	const handleFrame = useCallback((data: string, _w: number, _h: number) => {
		setLatestFrame(data);
	}, []);

	const handleNavigated = useCallback((url: string) => {
		setCurrentUrl(url);
		setSelectionMode(false);
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
		onError: handleSocketError,
		onTabsChanged: handleTabsChanged,
		onTabActivated: handleTabActivated,
		onCursorChanged: setBrowserCursor,
	});
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
		playback.resetExecution();
	}, [playback.resetExecution, toolExecutionKey]);

	const runBrowserAction = useCallback(
		async (event: ClientToServerEvent) => {
			setPendingBrowserActionCount((count) => count + 1);
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
				setPendingBrowserActionCount((count) => Math.max(0, count - 1));
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

	const handleSelectedTextCapture = useCallback(
		async (bounds: SelectionBounds) => {
			setSelectionMode(false);
			setIsCapturingSelectedText(true);
			try {
				const context = await captureSelectedText(bounds);
				selectedContextSequenceRef.current += 1;
				const title = (context.title || "Website text")
					.trim()
					.slice(0, 72);
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
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Failed to capture selected website text",
				);
			} finally {
				setIsCapturingSelectedText(false);
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
			const info = await createSession(normalizedUrl);
			if (info) {
				setSelectedTextContexts([]);
				setSelectedTextContextsOpen(false);
				setSelectionMode(false);
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
		const info = await createSession(targetUrl, 1365, 768, false);
		if (!info) {
			autoStartedRef.current = false;
			return;
		}

		setCurrentUrl(info.currentUrl || targetUrl);
		setSelectedTextContexts([]);
		setSelectedTextContextsOpen(false);
		setSelectionMode(false);
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
		setSelectionMode(false);
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

	const handleStop = useCallback(async () => {
		if (isRecording) {
			sendEvent({
				type: "recording-control",
				recording: false,
				discard: true,
			});
		}
		await closeBrowserSession();
	}, [closeBrowserSession, isRecording, sendEvent]);

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
				waitAfterMs: 1200,
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
		isCreating ||
		pendingBrowserActionCount > 0 ||
		playback.runningStepId !== null;
	const replayMenuOpen =
		playback.controlsOpen || playback.loadedRecordingOpen;

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
					onStop={handleStop}
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
					<ConnectionStatus state={connectionState} />
					{session && (
						<Button
							size="sm"
							variant={selectionMode ? "default" : "outline"}
							className={
								selectionMode
									? "bg-warning text-canvas hover:bg-warning/90"
									: ""
							}
							disabled={
								connectionState !== "connected" ||
								isCapturingSelectedText ||
								isReturningToPlayground
							}
							onClick={() => {
								if (selectionMode) {
									setSelectionMode(false);
									return;
								}
								playback.requestPause(
									"Playback paused for context selection",
								);
								setSelectionMode(true);
							}}
						>
							{isCapturingSelectedText ? (
								<Spinner />
							) : (
								<ScanLine />
							)}
							{isCapturingSelectedText
								? "Extracting..."
								: selectionMode
									? "Cancel Capture"
									: "Add context"}
						</Button>
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
								isSavingRecording ||
								isCapturingSelectedText ||
								selectionMode
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
					<Button
						size="sm"
						variant={recordedStepsOpen ? "default" : "outline"}
						disabled={!isRecording && recordedSteps.length === 0}
						onClick={() => setRecordedStepsOpen((open) => !open)}
					>
						<Circle
							className={
								isRecording ? "fill-danger text-danger" : ""
							}
						/>
						Recorded{" "}
						{recordedSteps.length
							? `(${recordedSteps.length})`
							: ""}
					</Button>
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
				{/* Browser canvas */}
				<BrowserViewer
					connectionState={connectionState}
					remoteWidth={remoteWidth}
					remoteHeight={remoteHeight}
					latestFrame={latestFrame}
					browserCursor={browserCursor}
					sendEvent={sendViewerEvent}
					selectionMode={selectionMode}
					onSelectionComplete={handleSelectedTextCapture}
					onSelectionCancel={() => setSelectionMode(false)}
					onUserInput={() =>
						playback.requestPause(
							"Playback will pause after your interaction",
						)
					}
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
