import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CropFreeIcon from "@mui/icons-material/CropFree";
import DoneIcon from "@mui/icons-material/Done";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Snackbar,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk-react";
import { BrowserTabStrip } from "./components/BrowserTabStrip";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BrowserViewer } from "./components/BrowserViewer";
import { ConnectionStatus } from "./components/ConnectionStatus";
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
	listRecordingMetadataModels,
	resolvePlaywrightRoomRecording,
	sendMcpResponseToPlayground,
	subscribeToMcpToolContext,
} from "./semoss/client";
import { assertPixelSuccess, runPixel } from "./semoss/pixel";
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
		listMcpProjects,
		listRecordingFiles,
		getRoomRecordingEnvelope,
		loadRecording,
		replaySingleStep,
		getRecordedSteps,
		saveRoomMcpEntry,
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
	const playback = usePlaybackController({
		insightId: effectiveInsightId,
		session,
		isMcpPlaybackMode,
		listRecordingProjects,
		listRecordingFiles,
		loadRecording,
		replaySingleStep,
		sendReplayEvent,
		sendTabControlEvent,
		onError: setSnackError,
		onMessage: setSnackMessage,
	});

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
		setSaveProject((current) => current ?? playback.projects[0] ?? null);
	}, [playback.projects]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackProjectSelectedRef.current ||
			playback.projects.length === 0
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
	]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackRecordingSelectedRef.current ||
			!effectiveInsightId ||
			playback.projects.length === 0
		) {
			return;
		}

		autoPlaybackRecordingSelectedRef.current = true;

		let cancelled = false;

		(async () => {
			if (toolContext?.roomId) {
				await bindSemossInsightToRoom(toolContext.roomId);
			}
			const roomInsightId = getSemossInsightId() || effectiveInsightId;

			if (!toolContext?.roomId) {
				throw new Error(
					"Playground room ID is required to resolve a room recording",
				);
			}

			const directProject =
				(mcpPlaybackProjectId &&
					playback.projects.find(
						(project) => project.value === mcpPlaybackProjectId,
					)) ||
				playback.project ||
				playback.projects[0] ||
				null;
			const exactFileName = mcpRecordingFile
				.split(/[\\/]/)
				.filter(Boolean)
				.pop();

			if (exactFileName && directProject) {
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
					toolContext.roomId,
					{
						recordingNameHint: mcpRecordingNameHint,
						recordingFile: mcpRecordingFile,
						projectId:
							mcpPlaybackProjectId ||
							playback.project?.value ||
							"",
					},
				);

			if (cancelled) return;

			const selected = resolved.selected;

			if (!selected) {
				const message = `No recording matched "${mcpRecordingFile || mcpRecordingNameHint}"`;
				setSnackError(message);
				if (!autoPlaybackErrorSentRef.current && toolContext) {
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
							toolContext.parameters,
						);
					} catch {
						// Nothing else to do if the iframe cannot notify Playground.
					}
				}
				return;
			}

			const selectedProject =
				playback.projects.find(
					(project) => project.value === selected.projectId,
				) ||
				(selected.projectId
					? { label: selected.projectId, value: selected.projectId }
					: null) ||
				playback.project ||
				playback.projects[0] ||
				null;

			if (!selectedProject) {
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
			if (!autoPlaybackErrorSentRef.current && toolContext) {
				autoPlaybackErrorSentRef.current = true;
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
		});

		return () => {
			cancelled = true;
		};
	}, [
		effectiveInsightId,
		getRoomRecordingEnvelope,
		isMcpPlaybackMode,
		mcpRecordingFile,
		mcpRecordingNameHint,
		mcpPlaybackProjectId,
		mcpStartUrl,
		playback.configureResolvedRecording,
		playback.project,
		playback.projects,
		toolContext,
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
					label: `${title} · Selection ${selectedContextSequenceRef.current}`,
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

	// ─── Toolbar handlers ───────────────────────────────────────────────────
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
				throw new Error(
					"Failed to save recording to the Playwright app",
				);
			}

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
		saveDescription,
		saveIntent,
		saveProject,
		saveRecording,
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
			const projects = await listMcpProjects(effectiveInsightId);
			setReturnProjects(projects);
			setReturnProject(projects[0] ?? null);
			if (projects.length === 0) {
				setSnackMessage("No MCP-tagged projects are available");
			}
		} finally {
			setIsLoadingReturnProjects(false);
		}
	}, [effectiveInsightId, listMcpProjects]);

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
							"Failed to save recording to the current Playwright app",
						);
					}
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

				// Safely add the __insight__ MCP entry to the room's tool list so the
				// LLM sees recording-specific tools on the next message (read-modify-write).
				const addMcpResponse = await runPixel(
					`AddInsightMCPToRoom(roomId=${JSON.stringify(toolContext.roomId)});`,
					roomBoundInsightId,
				);
				assertPixelSuccess(addMcpResponse, "Room MCP registration");

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
						? "Saved recording to Playground and Playwright app"
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
			!playback.project ||
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
				if (result.completed) {
					await closeBrowserSession();
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
	}, [
		closeBrowserSession,
		connectionState,
		isMcpPlaybackMode,
		playback,
		session,
		toolContext,
	]);

	const remoteWidth = session?.viewport.width ?? 1365;
	const remoteHeight = session?.viewport.height ?? 768;
	const isBrowserLoading =
		isCreating ||
		pendingBrowserActionCount > 0 ||
		playback.runningStepId !== null;
	const replayMenuOpen =
		playback.controlsOpen || playback.loadedRecordingOpen;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				bgcolor: "background.default",
				overflow: "hidden",
			}}
		>
			{/* Toolbar row */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 0.5,
					rowGap: 0.5,
					px: 0.5,
					py: 0.25,
					bgcolor: "background.paper",
					borderBottom: "1px solid",
					borderColor: "divider",
					minHeight: 38,
				}}
			>
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
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						flexWrap: "wrap",
						gap: 0.5,
						ml: "auto",
						maxWidth: "100%",
					}}
				>
					<ConnectionStatus state={connectionState} />
					{session && (
						<Button
							size="small"
							variant={selectionMode ? "contained" : "outlined"}
							color={selectionMode ? "warning" : "primary"}
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
							startIcon={
								isCapturingSelectedText ? (
									<CircularProgress size={14} />
								) : (
									<CropFreeIcon fontSize="small" />
								)
							}
							sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
						>
							{isCapturingSelectedText
								? "Extracting…"
								: selectionMode
									? "Cancel Capture"
									: "Add context"}
						</Button>
					)}
					{selectedTextContexts.length > 0 && (
						<Button
							size="small"
							variant={
								selectedTextContextsOpen
									? "contained"
									: "outlined"
							}
							startIcon={<CropFreeIcon fontSize="small" />}
							onClick={() =>
								setSelectedTextContextsOpen((open) => !open)
							}
							sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
						>
							Contexts ({selectedTextContexts.length})
						</Button>
					)}
					{isPlaygroundMode && session && (
						<Button
							size="small"
							variant="contained"
							color="primary"
							disabled={
								isReturningToPlayground ||
								isSaving ||
								isSavingRecording ||
								isCapturingSelectedText ||
								selectionMode
							}
							onClick={() => void handleOpenReturnDialog()}
							startIcon={
								isReturningToPlayground ||
								isSaving ||
								isSavingRecording ? (
									<CircularProgress
										size={14}
										color="inherit"
									/>
								) : (
									<DoneIcon fontSize="small" />
								)
							}
							sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
						>
							{isReturningToPlayground ||
							isSaving ||
							isSavingRecording
								? "Returning"
								: "Return to Playground"}
						</Button>
					)}
					<Button
						size="small"
						variant={replayMenuOpen ? "contained" : "outlined"}
						startIcon={
							replayMenuOpen ? (
								<ExpandMoreIcon />
							) : (
								<ChevronRightIcon />
							)
						}
						onClick={() => {
							playback.setControlsOpen(!replayMenuOpen);
							playback.setLoadedRecordingOpen(
								!replayMenuOpen && !!playback.loadedRecording,
							);
						}}
						sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
					>
						Replay
					</Button>
					<Button
						size="small"
						variant={recordedStepsOpen ? "contained" : "outlined"}
						startIcon={
							<FiberManualRecordIcon
								color={isRecording ? "error" : "inherit"}
							/>
						}
						disabled={!isRecording && recordedSteps.length === 0}
						onClick={() => setRecordedStepsOpen((open) => !open)}
						sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
					>
						Recorded{" "}
						{recordedSteps.length
							? `(${recordedSteps.length})`
							: ""}
					</Button>
					{playback.isPaused && (
						<Chip size="small" color="warning" label="Paused" />
					)}
					{playback.isRunning && (
						<Chip
							size="small"
							color="primary"
							label={`Step ${playback.runningStepId ?? ""}`}
						/>
					)}
				</Box>
			</Box>

			<BrowserTabStrip
				tabs={browserTabs}
				activeTabId={activeBrowserTabId}
				isRecording={isRecording}
				onSwitch={handleSwitchBrowserTab}
				onClose={handleCloseBrowserTab}
			/>

			{/* Session creation error banner */}
			{sessionError && (
				<Alert severity="error" sx={{ mx: 0.5, mt: 0.5, py: 0 }}>
					{sessionError}
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

			<Box
				sx={{
					display: "flex",
					position: "relative",
					flex: 1,
					minHeight: 0,
					overflow: "hidden",
				}}
			>
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
			</Box>

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

			<SaveRecordingDialog
				open={saveDialogOpen}
				projects={playback.projects}
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

			{/* WebSocket error toast */}
			<Snackbar
				open={!!snackError}
				autoHideDuration={4000}
				onClose={() => setSnackError(null)}
				message={snackError}
			/>
			<Snackbar
				open={!!snackMessage}
				autoHideDuration={3000}
				onClose={() => setSnackMessage(null)}
				message={snackMessage}
			/>
		</Box>
	);
}
