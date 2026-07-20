import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeBrowserUrl } from "../domain/browser-url";
import {
	getReplayWaitAfterMs,
	getStepCoords,
	getStepSelector,
	wait,
} from "../domain/replay-step";
import type {
	ClientToServerEvent,
	LoadedRecording,
	LoadedRecordingStep,
	RecordingProjectOption,
	RemoteBrowserSessionInfo,
	ReplayStepResult,
} from "../types/browserEvents";

export type PlaybackProject = { label: string; value: string };
export type PlaybackRecordingSource = "project" | "room";
export type FlattenedRecordingStep = {
	tabId: string;
	step: LoadedRecordingStep;
	index: number;
};

export interface PlaybackRunResult {
	completed: boolean;
	stepsRun: number;
	pausedAtStepId?: number;
}

interface UsePlaybackControllerOptions {
	insightId: string;
	session: RemoteBrowserSessionInfo | null;
	isMcpPlaybackMode: boolean;
	listRecordingProjects: (
		insightId: string,
	) => Promise<RecordingProjectOption[]>;
	listRecordingFiles: (
		insightId: string,
		projectId: string,
	) => Promise<string[]>;
	loadRecording: (
		insightId: string,
		projectId: string,
		fileName: string,
	) => Promise<LoadedRecording | null>;
	replaySingleStep: (
		insightId: string,
		projectId: string,
		fileName: string,
		stepId: number,
		tabId: string,
		paramValues?: Record<string, string>,
	) => Promise<ReplayStepResult>;
	sendReplayEvent: (
		event: ClientToServerEvent & { requestId: string },
	) => Promise<void>;
	sendTabControlEvent: (
		event: ClientToServerEvent & { requestId: string },
	) => Promise<void>;
	onError: (message: string) => void;
	onMessage: (message: string) => void;
}

interface ResolvedRecordingSelection {
	source: PlaybackRecordingSource;
	project: PlaybackProject;
	fileName: string;
	startUrl: string;
	recording?: LoadedRecording;
}

export function usePlaybackController({
	insightId,
	session,
	isMcpPlaybackMode,
	listRecordingProjects,
	listRecordingFiles,
	loadRecording,
	replaySingleStep,
	sendReplayEvent,
	sendTabControlEvent,
	onError,
	onMessage,
}: UsePlaybackControllerOptions) {
	const [projects, setProjects] = useState<PlaybackProject[]>([]);
	const [project, setProject] = useState<PlaybackProject | null>(null);
	const [files, setFiles] = useState<string[]>([]);
	const [selectedRecording, setSelectedRecording] = useState<string | null>(
		null,
	);
	const [startUrl, setStartUrl] = useState("");
	const [source, setSource] = useState<PlaybackRecordingSource>("project");
	const [loadedRecording, setLoadedRecording] =
		useState<LoadedRecording | null>(null);
	const [runningStepId, setRunningStepId] = useState<number | null>(null);
	const [executedStepIds, setExecutedStepIds] = useState<Set<number>>(
		() => new Set(),
	);
	const [editedTypeValues, setEditedTypeValues] = useState<
		Record<number, string>
	>({});
	const [isLoadingProjects, setIsLoadingProjects] = useState(false);
	const [isLoadingFiles, setIsLoadingFiles] = useState(false);
	const [isLoadingRecording, setIsLoadingRecording] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [controlsOpen, setControlsOpen] = useState(true);
	const [loadedRecordingOpen, setLoadedRecordingOpen] = useState(false);
	const [editingStepId, setEditingStepId] = useState<number | null>(null);
	const [valueRequiredStepId, setValueRequiredStepId] = useState<
		number | null
	>(null);
	const pauseRequestedRef = useRef(false);
	const replayPreparedRef = useRef(false);

	const flattenedSteps = useMemo<FlattenedRecordingStep[]>(() => {
		if (!loadedRecording?.steps) return [];
		const rows: FlattenedRecordingStep[] = [];
		Object.entries(loadedRecording.steps).forEach(([tabId, tabSteps]) => {
			const nested = tabSteps as Array<
				LoadedRecordingStep | LoadedRecordingStep[]
			>;
			nested
				.flatMap((item) => (Array.isArray(item) ? item : [item]))
				.forEach((step, index) => {
					rows.push({ tabId, step, index });
				});
		});
		return rows;
	}, [loadedRecording]);

	const typeStepCount = useMemo(
		() =>
			flattenedSteps.filter(
				({ step }) =>
					step.type === "TYPE" && typeof step.id === "number",
			).length,
		[flattenedSteps],
	);

	const initializeLoadedRecording = useCallback(
		(recording: LoadedRecording, label: string) => {
			setLoadedRecording(recording);
			setExecutedStepIds(new Set());
			setRunningStepId(null);
			setIsPaused(false);
			setValueRequiredStepId(null);
			setEditingStepId(null);
			pauseRequestedRef.current = false;
			replayPreparedRef.current = false;
			const initialValues: Record<number, string> = {};
			Object.values(recording.steps).forEach((tabSteps) => {
				const nested = tabSteps as Array<
					LoadedRecordingStep | LoadedRecordingStep[]
				>;
				nested
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
			onMessage(`Loaded ${label}`);
		},
		[onMessage],
	);

	const refreshProjects = useCallback(async () => {
		if (!insightId) {
			setProjects([]);
			return;
		}
		setIsLoadingProjects(true);
		try {
			const options = (await listRecordingProjects(insightId))
				.map((item) => ({
					label: item.label || item.project_name || item.value,
					value: item.value || item.project_id || "",
				}))
				.filter((item) => item.value);
			setProjects(options);
			setProject((current) => current ?? options[0] ?? null);
		} finally {
			setIsLoadingProjects(false);
		}
	}, [insightId, listRecordingProjects]);

	useEffect(() => {
		void refreshProjects();
	}, [refreshProjects]);

	useEffect(() => {
		let cancelled = false;
		if (isMcpPlaybackMode && source === "room") return;
		setLoadedRecording(null);
		setSelectedRecording(null);
		setLoadedRecordingOpen(false);
		setEditingStepId(null);
		if (!insightId || !project?.value) {
			setFiles([]);
			return;
		}

		setIsLoadingFiles(true);
		listRecordingFiles(insightId, project.value)
			.then((recordingFiles) => {
				if (cancelled) return;
				setFiles(recordingFiles);
				if (!isMcpPlaybackMode) {
					setSelectedRecording(recordingFiles[0] ?? null);
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoadingFiles(false);
			});

		return () => {
			cancelled = true;
		};
	}, [insightId, isMcpPlaybackMode, listRecordingFiles, project, source]);

	const selectProject = useCallback((next: PlaybackProject | null) => {
		setSource("project");
		setProject(next);
	}, []);

	const selectRecording = useCallback((fileName: string | null) => {
		setSource("project");
		setSelectedRecording(fileName);
		setLoadedRecording(null);
		setLoadedRecordingOpen(false);
		setEditingStepId(null);
	}, []);

	const configureResolvedRecording = useCallback(
		(selection: ResolvedRecordingSelection) => {
			setStartUrl(normalizeBrowserUrl(selection.startUrl));
			setSource(selection.source);
			setProject(selection.project);
			setSelectedRecording(selection.fileName);
			if (selection.recording) {
				initializeLoadedRecording(
					selection.recording,
					selection.fileName,
				);
			}
		},
		[initializeLoadedRecording],
	);

	const resetReplayPreparation = useCallback(() => {
		replayPreparedRef.current = false;
	}, []);

	const requestPause = useCallback(
		(reason = "Playback paused") => {
			if (!isRunning) return;
			pauseRequestedRef.current = true;
			setIsPaused(true);
			onMessage(reason);
		},
		[isRunning, onMessage],
	);

	const replayRoomStep = useCallback(
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
					case "CLICK":
						if (!coords && !selector)
							throw new Error(
								`Step ${step.id ?? ""} is missing a click target`,
							);
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
					case "HOVER":
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
				onError(
					error instanceof Error
						? error.message
						: "Replay step failed",
				);
				return false;
			}
		},
		[editedTypeValues, onError, sendReplayEvent],
	);

	const load = useCallback(async () => {
		if (source === "room" && loadedRecording) {
			initializeLoadedRecording(
				loadedRecording,
				selectedRecording || "room recording",
			);
			return;
		}
		if (!insightId || !project || !selectedRecording) {
			onError("Select a project and recording first");
			return;
		}
		if (!session) {
			onError(
				"Start a remote browser session before loading a recording",
			);
			return;
		}
		setIsLoadingRecording(true);
		try {
			const recording = await loadRecording(
				insightId,
				project.value,
				selectedRecording,
			);
			if (recording)
				initializeLoadedRecording(recording, selectedRecording);
		} finally {
			setIsLoadingRecording(false);
		}
	}, [
		initializeLoadedRecording,
		insightId,
		loadRecording,
		loadedRecording,
		onError,
		project,
		selectedRecording,
		session,
		source,
	]);

	const runStep = useCallback(
		async (tabId: string, step: LoadedRecordingStep) => {
			if (
				!insightId ||
				!project ||
				!selectedRecording ||
				typeof step.id !== "number"
			) {
				onError("Cannot run this step");
				return false;
			}
			if (step.type === "TYPE") {
				const value =
					editedTypeValues[step.id] ??
					(typeof step.text === "string" ? step.text : "");
				if (!value.trim()) {
					setValueRequiredStepId(step.id);
					setEditingStepId(step.id);
					setLoadedRecordingOpen(true);
					setControlsOpen(true);
					setIsPaused(true);
					pauseRequestedRef.current = true;
					onError(
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
				onError(
					error instanceof Error
						? error.message
						: `Could not prepare ${tabId} for playback`,
				);
				return false;
			}

			if (source === "room") {
				const success = await replayRoomStep(step);
				setRunningStepId(null);
				if (!success) return false;
				setExecutedStepIds((current) =>
					new Set(current).add(step.id as number),
				);
				if (pauseRequestedRef.current) {
					onMessage(`Playback paused after step ${step.id}`);
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
				insightId,
				project.value,
				selectedRecording,
				step.id,
				tabId,
				paramValues,
			);
			setRunningStepId(null);
			if (!result.success) {
				onError(result.error || `Failed running step ${step.id}`);
				return false;
			}
			setExecutedStepIds((current) =>
				new Set(current).add(step.id as number),
			);
			if (result.shouldStop) {
				onMessage(`Playback paused at step ${step.id}`);
				return false;
			}
			if (pauseRequestedRef.current) {
				onMessage(`Playback paused after step ${step.id}`);
				return false;
			}
			return true;
		},
		[
			editedTypeValues,
			flattenedSteps,
			insightId,
			onError,
			onMessage,
			project,
			replayRoomStep,
			replaySingleStep,
			selectedRecording,
			sendTabControlEvent,
			source,
		],
	);

	const run = useCallback(async (): Promise<PlaybackRunResult | null> => {
		if (!insightId || !project || !selectedRecording || !loadedRecording) {
			onError("Load a recording before running it");
			return null;
		}
		setIsRunning(true);
		setIsPaused(false);
		setValueRequiredStepId(null);
		pauseRequestedRef.current = false;
		let stepsRun = 0;
		try {
			for (const { tabId, step } of flattenedSteps) {
				if (step.shouldRun === false || typeof step.id !== "number")
					continue;
				if (executedStepIds.has(step.id)) continue;
				const shouldContinue = await runStep(tabId, step);
				if (shouldContinue) stepsRun += 1;
				if (!shouldContinue) {
					return {
						completed: false,
						stepsRun,
						pausedAtStepId: step.id,
					};
				}
			}
			onMessage(`Finished playback: ${selectedRecording}`);
			setIsPaused(false);
			return { completed: true, stepsRun };
		} finally {
			setIsRunning(false);
		}
	}, [
		executedStepIds,
		flattenedSteps,
		insightId,
		loadedRecording,
		onError,
		onMessage,
		project,
		runStep,
		selectedRecording,
	]);

	const updateTypeValue = useCallback((stepId: number, value: string) => {
		setEditedTypeValues((current) => ({ ...current, [stepId]: value }));
		if (value.trim()) {
			setValueRequiredStepId((current) =>
				current === stepId ? null : current,
			);
			setIsPaused(false);
			pauseRequestedRef.current = false;
		}
	}, []);

	const resetTypeValue = useCallback((stepId: number, value: string) => {
		setEditedTypeValues((current) => ({ ...current, [stepId]: value }));
		setEditingStepId(null);
	}, []);

	return {
		hasSession: session !== null,
		projects,
		project,
		files,
		selectedRecording,
		startUrl,
		source,
		loadedRecording,
		flattenedSteps,
		loadedStepCount: flattenedSteps.length,
		typeStepCount,
		runningStepId,
		executedStepIds,
		editedTypeValues,
		isLoadingProjects,
		isLoadingFiles,
		isLoadingRecording,
		isRunning,
		isPaused,
		controlsOpen,
		loadedRecordingOpen,
		editingStepId,
		valueRequiredStepId,
		refreshProjects,
		selectProject,
		selectRecording,
		configureResolvedRecording,
		initializeLoadedRecording,
		resetReplayPreparation,
		requestPause,
		load,
		runStep,
		run,
		setControlsOpen,
		setLoadedRecordingOpen,
		setEditingStepId,
		updateTypeValue,
		resetTypeValue,
	};
}

export type PlaybackController = ReturnType<typeof usePlaybackController>;
