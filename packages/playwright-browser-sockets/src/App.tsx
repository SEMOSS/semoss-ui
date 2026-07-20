import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CropFreeIcon from "@mui/icons-material/CropFree";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Divider,
	IconButton,
	List,
	ListItemButton,
	ListItemText,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk-react";
import { BrowserTabStrip } from "./components/BrowserTabStrip";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BrowserViewer } from "./components/BrowserViewer";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { SaveRecordingDialog } from "./components/dialogs/SaveRecordingDialog";
import { StopRecordingDialog } from "./components/dialogs/StopRecordingDialog";
import { PlaygroundStartPrompt } from "./components/PlaygroundStartPrompt";
import { SelectedTextContextsPanel } from "./components/SelectedTextContextsPanel";
import { normalizeBrowserUrl } from "./domain/browser-url";
import {
	buildRecordingFileName,
	enrichEnvelopeForRoomSave,
	getRecordingStartUrl,
} from "./domain/recording";
import {
	getReplayWaitAfterMs,
	getStepCoords,
	getStepSelector,
	wait,
} from "./domain/replay-step";
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
import { useRemoteBrowserSession } from "./hooks/useRemoteBrowserSession";
import {
	bindSemossInsightToRoom,
	getSemossInsightId,
	initSemoss,
	resolvePlaywrightRoomRecording,
	sendMcpResponseToPlayground,
	subscribeToMcpToolContext,
} from "./semoss/client";
import { assertPixelSuccess, runPixel } from "./semoss/pixel";
import type {
	BrowserTabInfo,
	ClientToServerEvent,
	LoadedRecording,
	LoadedRecordingStep,
	McpToolContext,
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

type PlaybackRecordingSource = "project" | "room";

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
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [stopRecordingDialogOpen, setStopRecordingDialogOpen] =
		useState(false);
	const [saveAfterStop, setSaveAfterStop] = useState(false);
	const [recordingProjects, setRecordingProjects] = useState<
		Array<{ label: string; value: string }>
	>([]);
	const [saveProject, setSaveProject] = useState<{
		label: string;
		value: string;
	} | null>(null);
	const [saveTitle, setSaveTitle] = useState("");
	const [saveDescription, setSaveDescription] = useState("");
	const [saveIntent, setSaveIntent] = useState("");
	const [playbackProject, setPlaybackProject] = useState<{
		label: string;
		value: string;
	} | null>(null);
	const [recordingFiles, setRecordingFiles] = useState<string[]>([]);
	const [selectedRecording, setSelectedRecording] = useState<string | null>(
		null,
	);
	const [playbackStartUrl, setPlaybackStartUrl] = useState("");
	const [playbackRecordingSource, setPlaybackRecordingSource] =
		useState<PlaybackRecordingSource>("project");
	const [loadedRecording, setLoadedRecording] =
		useState<LoadedRecording | null>(null);
	const [runningStepId, setRunningStepId] = useState<number | null>(null);
	const [executedStepIds, setExecutedStepIds] = useState<Set<number>>(
		() => new Set(),
	);
	const [editedTypeValues, setEditedTypeValues] = useState<
		Record<number, string>
	>({});
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
	const [isLoadingPlaybackProjects, setIsLoadingPlaybackProjects] =
		useState(false);
	const [isLoadingRecordingFiles, setIsLoadingRecordingFiles] =
		useState(false);
	const [isLoadingRecording, setIsLoadingRecording] = useState(false);
	const [isRunningRecording, setIsRunningRecording] = useState(false);
	const [pendingBrowserActionCount, setPendingBrowserActionCount] =
		useState(0);
	const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
	const [playbackControlsOpen, setPlaybackControlsOpen] = useState(true);
	const [loadedRecordingOpen, setLoadedRecordingOpen] = useState(false);
	const [recordedStepsOpen, setRecordedStepsOpen] = useState(false);
	const [editingStepId, setEditingStepId] = useState<number | null>(null);
	const [valueRequiredStepId, setValueRequiredStepId] = useState<
		number | null
	>(null);
	const autoStartedRef = useRef(false);
	const autoRecordingStartedRef = useRef(false);
	const autoPlaybackProjectSelectedRef = useRef(false);
	const autoPlaybackRecordingSelectedRef = useRef(false);
	const autoPlaybackLoadStartedRef = useRef(false);
	const autoPlaybackRunStartedRef = useRef(false);
	const autoPlaybackErrorSentRef = useRef(false);
	const returningToPlaygroundRef = useRef(false);
	const pauseRequestedRef = useRef(false);
	const selectedContextSequenceRef = useRef(0);
	const replayPreparedRef = useRef(false);

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

	const flattenedSteps = useMemo((): Array<{
		tabId: string;
		step: LoadedRecordingStep;
		index: number;
	}> => {
		if (!loadedRecording?.steps) return [];
		const rows: Array<{
			tabId: string;
			step: LoadedRecordingStep;
			index: number;
		}> = [];
		Object.entries(loadedRecording.steps).forEach(([tabId, tabSteps]) => {
			const maybeNested = tabSteps as Array<
				LoadedRecordingStep | LoadedRecordingStep[]
			>;
			const flat = maybeNested.flatMap((item) =>
				Array.isArray(item) ? item : [item],
			);
			flat.forEach((step, index) => {
				rows.push({ tabId, step, index });
			});
		});
		return rows;
	}, [loadedRecording]);

	const loadedStepCount = useMemo(() => {
		return flattenedSteps.length;
	}, [flattenedSteps.length]);

	const typeSteps = useMemo(
		() =>
			flattenedSteps.filter(
				({ step }) =>
					step.type === "TYPE" && typeof step.id === "number",
			),
		[flattenedSteps],
	);

	const initializeLoadedRecording = useCallback(
		(recording: LoadedRecording, label: string) => {
			setLoadedRecording(recording);
			setExecutedStepIds(new Set());
			setRunningStepId(null);
			setIsPlaybackPaused(false);
			setValueRequiredStepId(null);
			pauseRequestedRef.current = false;
			replayPreparedRef.current = false;
			const initialValues: Record<number, string> = {};
			Object.values(recording.steps).forEach((tabSteps) => {
				const maybeNested = tabSteps as Array<
					LoadedRecordingStep | LoadedRecordingStep[]
				>;
				maybeNested
					.flatMap((item) => (Array.isArray(item) ? item : [item]))
					.forEach((step) => {
						if (
							step.type === "TYPE" &&
							typeof step.id === "number" &&
							typeof step.text === "string"
						) {
							initialValues[step.id] = step.text;
						}
					});
			});
			setEditedTypeValues(initialValues);
			setLoadedRecordingOpen(true);
			setSnackMessage(`Loaded ${label}`);
		},
		[],
	);

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
			? mcpStartUrl || playbackStartUrl
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
		playbackStartUrl,
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

	const loadPlaywrightProjects = useCallback(() => {
		let cancelled = false;
		if (!effectiveInsightId) {
			return () => {
				cancelled = true;
			};
		}

		setIsLoadingPlaybackProjects(true);
		listRecordingProjects(effectiveInsightId)
			.then((projects) => {
				if (cancelled) return;
				const options = projects
					.map((project) => ({
						label:
							project.label ||
							project.project_name ||
							project.value,
						value: project.value || project.project_id || "",
					}))
					.filter((project) => project.value);
				setRecordingProjects(options);
				setSaveProject((current) => current ?? options[0] ?? null);
				setPlaybackProject((current) => current ?? options[0] ?? null);
			})
			.finally(() => {
				if (!cancelled) setIsLoadingPlaybackProjects(false);
			});

		return () => {
			cancelled = true;
		};
	}, [effectiveInsightId, listRecordingProjects]);

	useEffect(() => {
		const cleanup = loadPlaywrightProjects();
		return () => {
			if (typeof cleanup === "function") cleanup();
		};
	}, [loadPlaywrightProjects]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackProjectSelectedRef.current ||
			recordingProjects.length === 0
		) {
			return;
		}

		const selectedProject =
			(mcpPlaybackProjectId &&
				recordingProjects.find(
					(project) => project.value === mcpPlaybackProjectId,
				)) ||
			recordingProjects[0] ||
			null;

		if (selectedProject) {
			autoPlaybackProjectSelectedRef.current = true;
			setPlaybackProject(selectedProject);
		}
	}, [isMcpPlaybackMode, mcpPlaybackProjectId, recordingProjects]);

	useEffect(() => {
		if (!saveDialogOpen || recordingProjects.length > 0) return;
		const cleanup = loadPlaywrightProjects();
		return () => {
			if (typeof cleanup === "function") cleanup();
		};
	}, [loadPlaywrightProjects, recordingProjects.length, saveDialogOpen]);

	useEffect(() => {
		let cancelled = false;
		if (isMcpPlaybackMode && playbackRecordingSource === "room") {
			return;
		}
		setLoadedRecording(null);
		setSelectedRecording(null);
		if (!effectiveInsightId || !playbackProject?.value) {
			setRecordingFiles([]);
			return;
		}

		setIsLoadingRecordingFiles(true);
		listRecordingFiles(effectiveInsightId, playbackProject.value)
			.then((files) => {
				if (cancelled) return;
				setRecordingFiles(files);
				if (!isMcpPlaybackMode) {
					setSelectedRecording(files[0] ?? null);
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoadingRecordingFiles(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		effectiveInsightId,
		isMcpPlaybackMode,
		listRecordingFiles,
		playbackProject,
		playbackRecordingSource,
	]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackRecordingSelectedRef.current ||
			!effectiveInsightId ||
			recordingProjects.length === 0
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
			const resolved =
				await resolvePlaywrightRoomRecording<ResolvePlaywrightRecordingResponse>(
					toolContext.roomId,
					{
						recordingNameHint: mcpRecordingNameHint,
						recordingFile: mcpRecordingFile,
						projectId:
							mcpPlaybackProjectId ||
							playbackProject?.value ||
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
				recordingProjects.find(
					(project) => project.value === selected.projectId,
				) ||
				(selected.projectId
					? { label: selected.projectId, value: selected.projectId }
					: null) ||
				playbackProject ||
				recordingProjects[0] ||
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
				setPlaybackStartUrl(
					normalizeBrowserUrl(
						mcpStartUrl ||
							selected.startUrl ||
							"https://example.com",
					),
				);
				setPlaybackRecordingSource("room");
				setPlaybackProject(selectedProject);
				setSelectedRecording(selected.fileName);
				initializeLoadedRecording(envelope, selected.fileName);
				setSnackMessage(
					`Matched room recording ${selected.roomPath} (${selected.reason})`,
				);
				return;
			}

			setPlaybackStartUrl(
				normalizeBrowserUrl(
					mcpStartUrl || selected.startUrl || "https://example.com",
				),
			);
			setPlaybackRecordingSource("project");
			setPlaybackProject(selectedProject);
			setSelectedRecording(selected.fileName);
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
		initializeLoadedRecording,
		isMcpPlaybackMode,
		mcpRecordingFile,
		mcpRecordingNameHint,
		mcpPlaybackProjectId,
		playbackProject,
		recordingProjects,
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

	const requestPlaybackPause = useCallback(
		(reason = "Playback paused") => {
			if (!isRunningRecording) return;
			pauseRequestedRef.current = true;
			setIsPlaybackPaused(true);
			setSnackMessage(reason);
		},
		[isRunningRecording],
	);

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
				replayPreparedRef.current = false;
				setIsRecording(false);
			}
		},
		[createSession],
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
		replayPreparedRef.current = false;
		setIsRecording(false);
	}, [createSession, mcpStartUrlInput]);

	const replayRoomStepViaSocket = useCallback(
		async (step: LoadedRecordingStep): Promise<boolean> => {
			const type = String(step.type || "").toUpperCase();
			const coords = getStepCoords(step);
			const selector = getStepSelector(step);
			const trigger =
				step.isTriggerNewTab && typeof step.isTriggerNewTab === "object"
					? (step.isTriggerNewTab as Record<string, unknown>)
					: null;
			const replayTriggerTabId =
				trigger?.isTrue === true && typeof trigger.tabId === "string"
					? trigger.tabId
					: undefined;
			const replay = (event: ClientToServerEvent) =>
				sendReplayEvent({ ...event, requestId: crypto.randomUUID() });

			try {
				switch (type) {
					case "NAVIGATE": {
						const url =
							typeof step.url === "string"
								? normalizeBrowserUrl(step.url)
								: "";
						if (!url)
							throw new Error(
								`Step ${step.id ?? ""} is missing a URL`,
							);
						await replay({
							type: "navigate",
							url,
							record: false,
							waitAfterMs: getReplayWaitAfterMs(step, 1200),
						});
						return true;
					}
					case "CLICK": {
						if (!coords && !selector) {
							throw new Error(
								`Step ${step.id ?? ""} is missing a click target`,
							);
						}
						await replay({
							type: "mouse-click",
							x: coords?.x ?? 0,
							y: coords?.y ?? 0,
							button: "left",
							record: false,
							selector,
							replayTriggerTabId,
							waitAfterMs: getReplayWaitAfterMs(step, 400),
						});
						return true;
					}
					case "TYPE": {
						const text =
							typeof step.id === "number"
								? (editedTypeValues[step.id] ??
									String(step.text || ""))
								: String(step.text || "");
						await replay({
							type: "type-text",
							text,
							record: false,
							selector,
							x: coords?.x,
							y: coords?.y,
							waitAfterMs:
								step.pressEnter === true
									? 0
									: getReplayWaitAfterMs(step, 400),
						});
						if (step.pressEnter === true) {
							await replay({
								type: "key",
								key: "Enter",
								code: "Enter",
								record: false,
								waitAfterMs: getReplayWaitAfterMs(step, 400),
							});
						}
						return true;
					}
					case "SCROLL": {
						const deltaY = Number(step.deltaY);
						await replay({
							type: "wheel",
							x: coords?.x ?? 0,
							y: coords?.y ?? 0,
							deltaX: 0,
							deltaY: Number.isFinite(deltaY) ? deltaY : 600,
							record: false,
							waitAfterMs: getReplayWaitAfterMs(step, 300),
						});
						return true;
					}
					case "HOVER": {
						if (!coords)
							throw new Error(
								`Step ${step.id ?? ""} is missing hover coordinates`,
							);
						await replay({
							type: "mouse-move",
							x: coords.x,
							y: coords.y,
							record: false,
							waitAfterMs: getReplayWaitAfterMs(step, 250),
						});
						return true;
					}
					case "WAIT":
						await wait(getReplayWaitAfterMs(step, 1000));
						return true;
					case "CONTEXT":
						return true;
					default:
						throw new Error(
							`Unsupported room playback step type: ${type || "unknown"}`,
						);
				}
			} catch (error) {
				setSnackError(
					error instanceof Error
						? error.message
						: "Replay step failed",
				);
				return false;
			}
		},
		[editedTypeValues, sendReplayEvent],
	);

	const handleStop = useCallback(async () => {
		if (isRecording) {
			sendEvent({
				type: "recording-control",
				recording: false,
				discard: true,
			});
		}
		sendEvent({ type: "close-session" });
		await closeSession();
		setLatestFrame(null);
		setCurrentUrl("");
		setBrowserTabs([]);
		browserTabsRef.current = [];
		setActiveBrowserTabId("tab-1");
		replayPreparedRef.current = false;
		setIsRecording(false);
		setSelectionMode(false);
		setSaveDialogOpen(false);
		setStopRecordingDialogOpen(false);
	}, [isRecording, sendEvent, closeSession]);

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
			requestPlaybackPause("Playback will pause after closing a tab");
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
		[isRecording, requestPlaybackPause, sendTabControlEvent],
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
			replayPreparedRef.current = false;
			setIsRecording(true);
			setSnackMessage("Recording started");
			return;
		}
		setStopRecordingDialogOpen(true);
	}, [isRecording, sendEvent]);

	const handleDiscardRecording = useCallback(() => {
		sendEvent({
			type: "recording-control",
			recording: false,
			discard: true,
		});
		setIsRecording(false);
		setStopRecordingDialogOpen(false);
		setSaveDialogOpen(false);
		setSaveAfterStop(false);
		setSnackMessage("Recording discarded");
	}, [sendEvent]);

	const handleSaveAndStopRecording = useCallback(() => {
		setSaveAfterStop(true);
		setStopRecordingDialogOpen(false);
		setSaveDialogOpen(true);
	}, []);

	const handleSaveRecording = useCallback(async () => {
		const title = saveTitle.trim();
		if (!saveProject) {
			setSnackError("Project is required to save the recording");
			return;
		}

		const saved = await saveRecording({
			project: saveProject.value,
			name: defaultRecordingName,
			title,
			description: saveDescription.trim(),
			intent: saveIntent.trim(),
		});

		if (saved) {
			setSaveDialogOpen(false);
			if (saveAfterStop) {
				sendEvent({
					type: "recording-control",
					recording: false,
					discard: true,
				});
				setIsRecording(false);
				setSaveAfterStop(false);
			}
			setSnackMessage(`Saved recording: ${saved.fileName}`);
		}
	}, [
		defaultRecordingName,
		saveAfterStop,
		saveDescription,
		saveIntent,
		saveProject,
		saveRecording,
		saveTitle,
		sendEvent,
	]);

	const handleOpenSaveRecording = useCallback(() => {
		setSaveAfterStop(false);
		setSaveDialogOpen(true);
	}, []);

	const handleReturnToPlayground = useCallback(async () => {
		if (returningToPlaygroundRef.current) return;
		returningToPlaygroundRef.current = true;
		setIsReturningToPlayground(true);

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
				sendEvent({
					type: "recording-control",
					recording: false,
					discard: false,
				});
				setIsRecording(false);
			}

			const envelope = await getRecordingEnvelope();
			if (!envelope) {
				throw new Error("No recording envelope is available");
			}

			const enrichedEnvelope = enrichEnvelopeForRoomSave(
				envelope,
				session.sessionId,
				mcpRecordingNameHint,
				mcpStartUrl,
			);
			const fileName = buildRecordingFileName(
				enrichedEnvelope,
				mcpRecordingNameHint,
				mcpStartUrl,
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

			sendMcpResponseToPlayground(
				{
					saved: true,
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
			sendEvent({ type: "close-session" });
			await closeSession();
			setLatestFrame(null);
			setCurrentUrl("");
			setRecordedSteps([]);
			setSnackMessage(`Saved recording: ${saved.roomPath}`);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to return recording to Playground";
			setSnackError(message);
			try {
				sendMcpResponseToPlayground(
					{ saved: false, error: message },
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
		closeSession,
		getRecordingEnvelope,
		effectiveInsightId,
		isRecording,
		mcpRecordingNameHint,
		mcpStartUrl,
		saveRoomMcpEntry,
		saveRoomRecording,
		selectedTextContexts,
		sendEvent,
		session,
		toolContext,
	]);

	const handleLoadRecording = useCallback(async () => {
		if (playbackRecordingSource === "room" && loadedRecording) {
			initializeLoadedRecording(
				loadedRecording,
				selectedRecording || "room recording",
			);
			return;
		}

		if (!effectiveInsightId || !playbackProject || !selectedRecording) {
			setSnackError("Select a project and recording first");
			return;
		}
		if (!session) {
			setSnackError(
				"Start a remote browser session before loading a recording",
			);
			return;
		}

		setIsLoadingRecording(true);
		const loaded = await loadRecording(
			effectiveInsightId,
			playbackProject.value,
			selectedRecording,
		);
		setIsLoadingRecording(false);
		if (loaded) {
			initializeLoadedRecording(loaded, selectedRecording);
		}
	}, [
		effectiveInsightId,
		initializeLoadedRecording,
		loadRecording,
		loadedRecording,
		playbackProject,
		playbackRecordingSource,
		selectedRecording,
		session,
	]);

	const handleRunStep = useCallback(
		async (tabId: string, step: LoadedRecordingStep) => {
			if (
				!effectiveInsightId ||
				!playbackProject ||
				!selectedRecording ||
				typeof step.id !== "number"
			) {
				setSnackError("Cannot run this step");
				return false;
			}

			if (step.type === "TYPE") {
				const typeValue =
					editedTypeValues[step.id] ??
					(typeof step.text === "string" ? step.text : "");
				if (!typeValue.trim()) {
					setValueRequiredStepId(step.id);
					setEditingStepId(step.id);
					setLoadedRecordingOpen(true);
					setPlaybackControlsOpen(true);
					setIsPlaybackPaused(true);
					pauseRequestedRef.current = true;
					setSnackError(
						`Enter a value for step ${step.id} before continuing`,
					);
					return false;
				}
			}

			setValueRequiredStepId(null);
			setRunningStepId(step.id);
			try {
				if (!replayPreparedRef.current) {
					const firstRunnableStep = flattenedSteps.find(
						(row) => row.step.shouldRun !== false,
					)?.step;
					await sendTabControlEvent({
						type: "prepare-replay",
						reuseActiveTab:
							String(
								firstRunnableStep?.type || "",
							).toUpperCase() !== "NAVIGATE",
						requestId: crypto.randomUUID(),
					});
					replayPreparedRef.current = true;
				}
				await sendTabControlEvent({
					type: "switch-replay-tab",
					targetTabId: tabId,
					requestId: crypto.randomUUID(),
				});
			} catch (error) {
				setRunningStepId(null);
				setSnackError(
					error instanceof Error
						? error.message
						: `Could not prepare ${tabId} for playback`,
				);
				return false;
			}

			if (playbackRecordingSource === "room") {
				const success = await replayRoomStepViaSocket(step);
				setRunningStepId(null);
				if (!success) {
					return false;
				}
				setExecutedStepIds((prev) =>
					new Set(prev).add(step.id as number),
				);
				if (pauseRequestedRef.current) {
					setSnackMessage(`Playback paused after step ${step.id}`);
					return false;
				}
				return true;
			}

			const paramValues =
				step.type === "TYPE" && typeof step.label === "string"
					? {
							[step.label]:
								editedTypeValues[step.id] ??
								(typeof step.text === "string"
									? step.text
									: ""),
						}
					: undefined;
			const result = await replaySingleStep(
				effectiveInsightId,
				playbackProject.value,
				selectedRecording,
				step.id,
				tabId,
				paramValues,
			);
			setRunningStepId(null);
			if (!result.success) {
				setSnackError(result.error || `Failed running step ${step.id}`);
				return false;
			}
			setExecutedStepIds((prev) => new Set(prev).add(step.id as number));
			if (result.shouldStop) {
				setSnackMessage(`Playback paused at step ${step.id}`);
				return false;
			}
			if (pauseRequestedRef.current) {
				setSnackMessage(`Playback paused after step ${step.id}`);
				return false;
			}
			return true;
		},
		[
			editedTypeValues,
			effectiveInsightId,
			flattenedSteps,
			playbackProject,
			playbackRecordingSource,
			replaySingleStep,
			replayRoomStepViaSocket,
			sendTabControlEvent,
			selectedRecording,
		],
	);

	const handleRunLoadedRecording = useCallback(async (): Promise<{
		completed: boolean;
		stepsRun: number;
		pausedAtStepId?: number;
	} | null> => {
		if (
			!effectiveInsightId ||
			!playbackProject ||
			!selectedRecording ||
			!loadedRecording
		) {
			setSnackError("Load a recording before running it");
			return null;
		}

		setIsRunningRecording(true);
		setIsPlaybackPaused(false);
		setValueRequiredStepId(null);
		pauseRequestedRef.current = false;
		let stepsRun = 0;
		try {
			for (const { tabId, step } of flattenedSteps) {
				if (step.shouldRun === false || typeof step.id !== "number") {
					continue;
				}
				if (executedStepIds.has(step.id)) {
					continue;
				}
				const shouldContinue = await handleRunStep(tabId, step);
				if (shouldContinue) {
					stepsRun += 1;
				}
				if (!shouldContinue) {
					return {
						completed: false,
						stepsRun,
						pausedAtStepId: step.id,
					};
				}
			}
			setSnackMessage(`Finished playback: ${selectedRecording}`);
			setIsPlaybackPaused(false);
			return { completed: true, stepsRun };
		} finally {
			setIsRunningRecording(false);
		}
	}, [
		executedStepIds,
		flattenedSteps,
		handleRunStep,
		effectiveInsightId,
		loadedRecording,
		playbackProject,
		selectedRecording,
	]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			autoPlaybackLoadStartedRef.current ||
			connectionState !== "connected" ||
			!session ||
			!playbackProject ||
			!selectedRecording ||
			isLoadingRecording
		) {
			return;
		}

		autoPlaybackLoadStartedRef.current = true;
		handleLoadRecording();
	}, [
		connectionState,
		handleLoadRecording,
		isLoadingRecording,
		isMcpPlaybackMode,
		playbackProject,
		selectedRecording,
		session,
	]);

	useEffect(() => {
		if (
			!isMcpPlaybackMode ||
			!toolContext ||
			autoPlaybackRunStartedRef.current ||
			!loadedRecording ||
			!selectedRecording ||
			!session ||
			connectionState !== "connected"
		) {
			return;
		}

		autoPlaybackRunStartedRef.current = true;
		setPlaybackControlsOpen(true);
		setLoadedRecordingOpen(true);

		(async () => {
			try {
				const result = await handleRunLoadedRecording();
				if (!result) {
					throw new Error("Playback did not start");
				}

				sendMcpResponseToPlayground(
					{
						played: result.completed,
						status: result.completed ? "completed" : "paused",
						recordingFile: selectedRecording,
						projectId: playbackProject?.value ?? null,
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
		effectiveInsightId,
		connectionState,
		handleRunLoadedRecording,
		isMcpPlaybackMode,
		loadedRecording,
		playbackProject,
		selectedRecording,
		session,
		toolContext,
	]);

	const remoteWidth = session?.viewport.width ?? 1365;
	const remoteHeight = session?.viewport.height ?? 768;
	const isBrowserLoading =
		isCreating || pendingBrowserActionCount > 0 || runningStepId !== null;

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
					gap: 0.5,
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
					isSaving={isSaving}
					canSaveRecording={!!session && isRecording}
					onToggleRecording={handleToggleRecording}
					onOpenSaveRecording={handleOpenSaveRecording}
				/>
				<ConnectionStatus state={connectionState} />
				<Box sx={{ flex: 1 }} />
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
							requestPlaybackPause(
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
								: "Capture Context"}
					</Button>
				)}
				{selectedTextContexts.length > 0 && (
					<Button
						size="small"
						variant={
							selectedTextContextsOpen ? "contained" : "outlined"
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
							isCapturingSelectedText ||
							selectionMode
						}
						onClick={handleReturnToPlayground}
						startIcon={
							isReturningToPlayground || isSaving ? (
								<CircularProgress size={14} color="inherit" />
							) : (
								<DoneIcon fontSize="small" />
							)
						}
						sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1 }}
					>
						{isReturningToPlayground || isSaving
							? "Returning"
							: "Return to Playground"}
					</Button>
				)}
				<Button
					size="small"
					variant={
						playbackControlsOpen || loadedRecordingOpen
							? "contained"
							: "outlined"
					}
					startIcon={
						playbackControlsOpen || loadedRecordingOpen ? (
							<ExpandMoreIcon />
						) : (
							<ChevronRightIcon />
						)
					}
					onClick={() => {
						setPlaybackControlsOpen((open) => !open);
						if (loadedRecording) setLoadedRecordingOpen(true);
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
					{recordedSteps.length ? `(${recordedSteps.length})` : ""}
				</Button>
				{isPlaybackPaused && (
					<Chip size="small" color="warning" label="Paused" />
				)}
				{isRunningRecording && (
					<Chip
						size="small"
						color="primary"
						label={`Step ${runningStepId ?? ""}`}
					/>
				)}
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

			<Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
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
						requestPlaybackPause(
							"Playback will pause after your interaction",
						)
					}
				/>

				<Box
					sx={{
						width:
							playbackControlsOpen ||
							loadedRecordingOpen ||
							recordedStepsOpen ||
							selectedTextContextsOpen
								? 340
								: 0,
						borderLeft: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
						overflow: "hidden",
						transition: "width 160ms ease",
					}}
				>
					<Box sx={{ overflow: "auto", minHeight: 0 }}>
						<Box
							sx={{
								px: 0.75,
								py: 0.4,
								borderBottom: "1px solid",
								borderColor: "divider",
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<IconButton
								size="small"
								onClick={() =>
									setPlaybackControlsOpen((open) => !open)
								}
								sx={{ p: 0.25 }}
							>
								{playbackControlsOpen ? (
									<ExpandMoreIcon />
								) : (
									<ChevronRightIcon />
								)}
							</IconButton>
							<Typography variant="subtitle2" sx={{ flex: 1 }}>
								Replay controls
							</Typography>
							{isPlaybackPaused && (
								<Chip
									size="small"
									color="warning"
									label="Paused"
								/>
							)}
							{isRunningRecording && (
								<Chip
									size="small"
									color="primary"
									label="Running"
								/>
							)}
						</Box>
						<Collapse in={playbackControlsOpen}>
							<Stack spacing={0.75} sx={{ p: 0.75 }}>
								<Autocomplete
									size="small"
									options={recordingProjects}
									value={playbackProject}
									onChange={(_, value) => {
										setPlaybackRecordingSource("project");
										setPlaybackProject(value);
									}}
									loading={isLoadingPlaybackProjects}
									getOptionLabel={(option) => option.label}
									isOptionEqualToValue={(option, value) =>
										option.value === value.value
									}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Project"
										/>
									)}
									slotProps={{
										paper: { sx: { fontSize: 13 } },
									}}
								/>
								<Autocomplete
									size="small"
									options={recordingFiles}
									value={selectedRecording}
									onChange={(_, value) => {
										setPlaybackRecordingSource("project");
										setSelectedRecording(value);
										setLoadedRecording(null);
										setLoadedRecordingOpen(false);
										setEditingStepId(null);
									}}
									loading={isLoadingRecordingFiles}
									getOptionLabel={(option) => option}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Recording file"
										/>
									)}
									noOptionsText={
										playbackProject
											? "No recordings found"
											: "Select a project first"
									}
								/>
								<Stack direction="row" spacing={0.75}>
									<Button
										size="small"
										variant="outlined"
										disabled={
											!session ||
											!selectedRecording ||
											isLoadingRecording ||
											isRunningRecording
										}
										onClick={handleLoadRecording}
										startIcon={
											isLoadingRecording ? (
												<CircularProgress size={14} />
											) : (
												<FolderOpenIcon />
											)
										}
										fullWidth
									>
										Load
									</Button>
									<Button
										size="small"
										variant="contained"
										disabled={
											!loadedRecording ||
											isRunningRecording
										}
										onClick={handleRunLoadedRecording}
										startIcon={
											isRunningRecording ? (
												<CircularProgress size={14} />
											) : (
												<PlayArrowIcon />
											)
										}
										fullWidth
									>
										{isPlaybackPaused
											? "Resume"
											: loadedRecording
												? `Run ${loadedStepCount}`
												: "Run"}
									</Button>
									<Button
										size="small"
										color="warning"
										variant="outlined"
										disabled={!isRunningRecording}
										onClick={() =>
											requestPlaybackPause(
												"Playback pause requested",
											)
										}
										startIcon={<PauseIcon />}
									>
										Pause
									</Button>
								</Stack>
							</Stack>
						</Collapse>

						<Divider />
						<SelectedTextContextsPanel
							open={selectedTextContextsOpen}
							contexts={selectedTextContexts}
							onToggle={() =>
								setSelectedTextContextsOpen((open) => !open)
							}
							onCopy={handleCopySelectedContext}
							onDelete={handleDeleteSelectedContext}
							onSave={handleSaveSelectedContext}
						/>

						<Divider />
						<Box
							sx={{
								px: 0.75,
								py: 0.4,
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								borderBottom: loadedRecordingOpen
									? "1px solid"
									: 0,
								borderColor: "divider",
							}}
						>
							<IconButton
								size="small"
								disabled={!loadedRecording}
								onClick={() =>
									setLoadedRecordingOpen((open) => !open)
								}
								sx={{ p: 0.25 }}
							>
								{loadedRecordingOpen ? (
									<ExpandMoreIcon />
								) : (
									<ChevronRightIcon />
								)}
							</IconButton>
							<Box sx={{ flex: 1 }}>
								<Typography variant="subtitle2">
									Loaded recording
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{loadedRecording
										? selectedRecording
										: "Load a recording to inspect and replay steps"}
								</Typography>
							</Box>
							{loadedRecording && (
								<Chip
									size="small"
									label={`${loadedStepCount} steps`}
								/>
							)}
							{typeSteps.length > 0 && (
								<Chip
									size="small"
									label={`${typeSteps.length} inputs`}
								/>
							)}
						</Box>
						<Collapse in={loadedRecordingOpen}>
							<List dense disablePadding>
								{flattenedSteps.length === 0 ? (
									<Box sx={{ p: 2 }}>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											Load a recording to see its steps
											here.
										</Typography>
									</Box>
								) : (
									flattenedSteps.map(
										({ tabId, step, index }) => {
											const stepId =
												typeof step.id === "number"
													? step.id
													: undefined;
											const isRunning =
												runningStepId === stepId;
											const isDone =
												stepId !== undefined &&
												executedStepIds.has(stepId);
											const disabled =
												isRunningRecording ||
												step.shouldRun === false ||
												stepId === undefined;
											const isType =
												step.type === "TYPE" &&
												stepId !== undefined;
											const displayValue =
												stepId !== undefined
													? (editedTypeValues[
															stepId
														] ??
														step.text ??
														"")
													: (step.text ?? "");
											const isEditing =
												isType &&
												editingStepId === stepId;
											const needsValue =
												isType &&
												valueRequiredStepId === stepId;

											return (
												<Box
													key={`${tabId}-${stepId ?? index}`}
													sx={{
														borderBottom:
															"1px solid",
														borderColor: needsValue
															? "warning.main"
															: "divider",
														bgcolor: needsValue
															? "rgba(237, 108, 2, 0.08)"
															: "transparent",
													}}
												>
													<ListItemButton
														disabled={disabled}
														selected={isRunning}
														onClick={() =>
															handleRunStep(
																tabId,
																step,
															)
														}
														sx={{
															alignItems:
																"flex-start",
															py: 0.5,
															px: 1,
															pr: isType
																? 0.25
																: 1,
														}}
													>
														<ListItemText
															primary={
																<Stack
																	direction="row"
																	spacing={1}
																	alignItems="center"
																>
																	<Typography
																		variant="body2"
																		sx={{
																			fontWeight: 600,
																		}}
																	>
																		#
																		{stepId ??
																			index +
																				1}{" "}
																		{step.type ||
																			"STEP"}
																	</Typography>
																	{isRunning && (
																		<CircularProgress
																			size={
																				12
																			}
																		/>
																	)}
																	{isDone && (
																		<Chip
																			size="small"
																			color="success"
																			label="done"
																		/>
																	)}
																	{step.shouldRun ===
																		false && (
																		<Chip
																			size="small"
																			label="skipped"
																		/>
																	)}
																	{needsValue && (
																		<Chip
																			size="small"
																			color="warning"
																			label="value required"
																		/>
																	)}
																</Stack>
															}
															secondary={
																<Typography
																	variant="caption"
																	color="text.secondary"
																	component="span"
																>
																	{tabId}
																	{typeof step.label ===
																		"string" &&
																	step.label
																		? ` · ${step.label}`
																		: ""}
																	{typeof displayValue ===
																		"string" &&
																	displayValue
																		? ` · "${displayValue}"`
																		: ""}
																</Typography>
															}
														/>
														{isType && (
															<Tooltip title="Edit typed value">
																<span>
																	<IconButton
																		size="small"
																		disabled={
																			isRunningRecording
																		}
																		sx={{
																			p: 0.5,
																		}}
																		onClick={(
																			event,
																		) => {
																			event.preventDefault();
																			event.stopPropagation();
																			setEditingStepId(
																				(
																					current,
																				) =>
																					current ===
																					stepId
																						? null
																						: stepId,
																			);
																		}}
																	>
																		<EditIcon fontSize="small" />
																	</IconButton>
																</span>
															</Tooltip>
														)}
													</ListItemButton>
													{isEditing &&
														stepId !==
															undefined && (
															<Box
																sx={{
																	px: 1,
																	pb: 0.75,
																}}
																onClick={(
																	event,
																) =>
																	event.stopPropagation()
																}
																onMouseDown={(
																	event,
																) =>
																	event.stopPropagation()
																}
															>
																<TextField
																	size="small"
																	fullWidth
																	autoFocus={
																		needsValue
																	}
																	label={
																		typeof step.label ===
																			"string" &&
																		step.label
																			? step.label
																			: `Step ${stepId} value`
																	}
																	type={
																		step.isPassword ===
																		true
																			? "password"
																			: "text"
																	}
																	value={
																		editedTypeValues[
																			stepId
																		] ?? ""
																	}
																	error={
																		needsValue
																	}
																	onChange={(
																		event,
																	) => {
																		const nextValue =
																			event
																				.target
																				.value;
																		setEditedTypeValues(
																			(
																				prev,
																			) => ({
																				...prev,
																				[stepId]:
																					nextValue,
																			}),
																		);
																		if (
																			nextValue.trim() &&
																			valueRequiredStepId ===
																				stepId
																		) {
																			setValueRequiredStepId(
																				null,
																			);
																			setIsPlaybackPaused(
																				false,
																			);
																			pauseRequestedRef.current = false;
																		}
																	}}
																	helperText={
																		needsValue
																			? "Enter a value, then click Run/Resume to continue."
																			: typeof step.description ===
																						"string" &&
																					step.description
																				? step.description
																				: "This value is used when replaying this TYPE step."
																	}
																	InputProps={{
																		endAdornment:
																			(
																				<Stack
																					direction="row"
																					spacing={
																						0.25
																					}
																				>
																					<IconButton
																						size="small"
																						onClick={() =>
																							setEditingStepId(
																								null,
																							)
																						}
																					>
																						<DoneIcon fontSize="small" />
																					</IconButton>
																					<IconButton
																						size="small"
																						onClick={() => {
																							setEditedTypeValues(
																								(
																									prev,
																								) => ({
																									...prev,
																									[stepId]:
																										typeof step.text ===
																										"string"
																											? step.text
																											: "",
																								}),
																							);
																							setEditingStepId(
																								null,
																							);
																						}}
																					>
																						<CloseIcon fontSize="small" />
																					</IconButton>
																				</Stack>
																			),
																	}}
																/>
															</Box>
														)}
												</Box>
											);
										},
									)
								)}
							</List>
						</Collapse>

						<Divider />
						<Box
							sx={{
								px: 0.75,
								py: 0.4,
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								borderBottom: recordedStepsOpen
									? "1px solid"
									: 0,
								borderColor: "divider",
							}}
						>
							<IconButton
								size="small"
								disabled={
									!isRecording && recordedSteps.length === 0
								}
								onClick={() =>
									setRecordedStepsOpen((open) => !open)
								}
								sx={{ p: 0.25 }}
							>
								{recordedStepsOpen ? (
									<ExpandMoreIcon />
								) : (
									<ChevronRightIcon />
								)}
							</IconButton>
							<Box sx={{ flex: 1 }}>
								<Typography variant="subtitle2">
									Recorded steps
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Current unsaved recording window
								</Typography>
							</Box>
							<Chip
								size="small"
								label={`${recordedSteps.length}`}
							/>
							<Button
								size="small"
								disabled={!isRecording}
								onClick={handleOpenSaveRecording}
							>
								Save
							</Button>
						</Box>
						<Collapse in={recordedStepsOpen}>
							<List dense disablePadding>
								{recordedSteps.length === 0 ? (
									<Box sx={{ p: 2 }}>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{isRecording
												? "Interact with the browser to see recorded steps."
												: "Start recording to preview captured steps."}
										</Typography>
									</Box>
								) : (
									recordedSteps.map((step, index) => (
										<ListItemButton
											key={`${step.timestamp ?? index}-${index}`}
											disabled
											sx={{ py: 0.5, px: 1 }}
										>
											<ListItemText
												primary={
													<Typography
														variant="body2"
														sx={{ fontWeight: 600 }}
													>
														#{index + 1}{" "}
														{step.type || "STEP"}
													</Typography>
												}
												secondary={
													<Typography
														variant="caption"
														color="text.secondary"
														component="span"
													>
														{step.selector
															? `${step.role || "selector"}: ${step.selector}`
															: ""}
														{step.text
															? ` · "${step.text}"`
															: ""}
														{step.coordinates
															? ` · (${Math.round(
																	step
																		.coordinates
																		.x,
																)}, ${Math.round(step.coordinates.y)})`
															: ""}
													</Typography>
												}
											/>
										</ListItemButton>
									))
								)}
							</List>
						</Collapse>
					</Box>
				</Box>
			</Box>

			<StopRecordingDialog
				open={stopRecordingDialogOpen}
				onClose={() => setStopRecordingDialogOpen(false)}
				onDiscard={handleDiscardRecording}
				onSave={handleSaveAndStopRecording}
			/>

			<SaveRecordingDialog
				open={saveDialogOpen}
				projects={recordingProjects}
				project={saveProject}
				title={saveTitle}
				fileName={defaultRecordingName}
				description={saveDescription}
				intent={saveIntent}
				isLoadingProjects={isLoadingProjects}
				isSaving={isSaving}
				canSave={!!session && isRecording}
				onClose={() => setSaveDialogOpen(false)}
				onProjectChange={setSaveProject}
				onTitleChange={setSaveTitle}
				onDescriptionChange={setSaveDescription}
				onIntentChange={setSaveIntent}
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
