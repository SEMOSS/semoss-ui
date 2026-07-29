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

export type PlaybackProject = {
	label: string;
	value: string;
	source?: PlaybackRecordingSource;
};
export type PlaybackRecordingSource = "project" | "room";
export type PlaybackRecordingCatalogItem = {
	key: string;
	fileName: string;
	normalizedFileName: string;
	source: PlaybackRecordingSource;
	project: PlaybackProject;
};
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
	roomId?: string;
	listRoomRecordingFiles?: (
		insightId: string,
		roomId: string,
	) => Promise<string[]>;
	loadRoomRecording?: (
		insightId: string,
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

	/**
	 * Null for room recordings. Those live in the room's own asset folder and are
	 * loaded and replayed without any project, so there may not be one to name.
	 */
	project: PlaybackProject | null;
	fileName: string;
	startUrl: string;
	recording?: LoadedRecording;
	parameterValues?: Record<string, string>;
}

function sanitizeMcpParameterName(
	value: string,
	fallbackPrefix = "field_",
): string {
	const sanitized = value
		.replace(/[^a-zA-Z0-9\s]/g, "")
		.trim()
		.replace(/\s+/g, "_")
		.toLowerCase();
	return !sanitized || !/^[a-zA-Z]/.test(sanitized)
		? `${fallbackPrefix}${sanitized}`
		: sanitized;
}

function getMcpStepParameterValue(
	step: LoadedRecordingStep,
	parameterValues: Record<string, string>,
): string | undefined {
	if (typeof step.id !== "number") return undefined;
	const stepLabel = typeof step.label === "string" ? step.label : "";
	return (
		parameterValues[`step_${step.id}`] ??
		parameterValues[String(step.id)] ??
		(stepLabel
			? (parameterValues[stepLabel] ??
				parameterValues[sanitizeMcpParameterName(stepLabel)] ??
				parameterValues[sanitizeMcpParameterName(stepLabel, "tool_")])
			: undefined)
	);
}

function normalizeRecordingFileName(fileName: string): string {
	return (
		fileName.split(/[\\/]/).filter(Boolean).pop()?.trim().toLowerCase() ??
		""
	);
}

function getRecordingCatalogKey(
	source: PlaybackRecordingSource,
	projectValue: string,
	fileName: string,
): string {
	return `${source}:${projectValue}:${normalizeRecordingFileName(fileName)}`;
}

export function usePlaybackController({
	insightId,
	session,
	isMcpPlaybackMode,
	listRecordingProjects,
	listRecordingFiles,
	loadRecording,
	roomId = "",
	listRoomRecordingFiles,
	loadRoomRecording,
	replaySingleStep,
	sendReplayEvent,
	sendTabControlEvent,
	onError,
	onMessage,
}: UsePlaybackControllerOptions) {
	const [projects, setProjects] = useState<PlaybackProject[]>([]);
	const [project, setProject] = useState<PlaybackProject | null>(null);
	const [recordingCatalog, setRecordingCatalog] = useState<
		PlaybackRecordingCatalogItem[]
	>([]);
	const [files, setFiles] = useState<string[]>([]);
	const [selectedRecording, setSelectedRecording] = useState<string | null>(
		null,
	);
	const [selectedCatalogKey, setSelectedCatalogKey] = useState("");
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
	const [filesReady, setFilesReady] = useState(false);
	const [isLoadingRecording, setIsLoadingRecording] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [controlsOpen, setControlsOpen] = useState(false);
	const [loadedRecordingOpen, setLoadedRecordingOpen] = useState(false);
	const [editingStepId, setEditingStepId] = useState<number | null>(null);
	const [valueRequiredStepId, setValueRequiredStepId] = useState<
		number | null
	>(null);
	const pauseRequestedRef = useRef(false);
	const replayPreparedRef = useRef(false);
	const resolvedParameterValuesRef = useRef<Record<string, string>>({});
	const typeValuesRef = useRef<Record<number, string>>({});
	const recordingCacheRef = useRef<Map<string, LoadedRecording>>(new Map());
	const runInFlightRef = useRef<Promise<PlaybackRunResult | null> | null>(
		null,
	);
	const [savedRecordingSelection, setSavedRecordingSelection] = useState<{
		projectValue: string;
		fileName: string;
	} | null>(null);

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
		(
			recording: LoadedRecording,
			label: string,
			parameterValues: Record<string, string> = {},
		) => {
			setLoadedRecording(recording);
			setExecutedStepIds(new Set());
			setRunningStepId(null);
			setIsPaused(false);
			setValueRequiredStepId(null);
			setEditingStepId(null);
			pauseRequestedRef.current = false;
			replayPreparedRef.current = false;
			const initialValues: Record<number, string> = {};
			let appliedOverrideCount = 0;
			Object.values(recording.steps).forEach((tabSteps) => {
				const nested = tabSteps as Array<
					LoadedRecordingStep | LoadedRecordingStep[]
				>;
				nested
					.flatMap((item) => (Array.isArray(item) ? item : [item]))
					.forEach((step) => {
						if (
							step.type === "TYPE" &&
							typeof step.id === "number"
						) {
							const suppliedValue = getMcpStepParameterValue(
								step,
								parameterValues,
							);
							if (suppliedValue !== undefined) {
								appliedOverrideCount += 1;
							}
							initialValues[step.id] =
								suppliedValue ??
								(typeof step.text === "string"
									? step.text
									: "");
						}
					});
			});
			typeValuesRef.current = initialValues;
			setEditedTypeValues(initialValues);
			setLoadedRecordingOpen(true);
			onMessage(
				appliedOverrideCount
					? `Loaded ${label} with ${appliedOverrideCount} input override${appliedOverrideCount === 1 ? "" : "s"}`
					: `Loaded ${label}`,
			);
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
			const projectOptions = (await listRecordingProjects(insightId))
				.map((item) => ({
					label: item.label || item.project_name || item.value,
					value: item.value || item.project_id || "",
					source: "project" as const,
				}))
				.filter((item) => item.value);
			const options: PlaybackProject[] = roomId
				? [
						{
							label: "Playground recordings",
							value: roomId,
							source: "room",
						},
						...projectOptions,
					]
				: projectOptions;
			setProjects(options);
			setProject((current) => current ?? options[0] ?? null);
		} finally {
			setIsLoadingProjects(false);
		}
	}, [insightId, listRecordingProjects, roomId]);

	useEffect(() => {
		void refreshProjects();
	}, [refreshProjects]);

	useEffect(() => {
		let cancelled = false;
		setFilesReady(false);
		if (!insightId || projects.length === 0) {
			setRecordingCatalog([]);
			setFiles([]);
			setFilesReady(true);
			setIsLoadingFiles(false);
			return;
		}

		setIsLoadingFiles(true);
		const requests = projects.map(async (catalogProject) => {
			const recordingFiles =
				catalogProject.source === "room"
					? roomId && listRoomRecordingFiles
						? await listRoomRecordingFiles(insightId, roomId)
						: []
					: await listRecordingFiles(insightId, catalogProject.value);
			return recordingFiles.map(
				(fileName): PlaybackRecordingCatalogItem => ({
					key: getRecordingCatalogKey(
						catalogProject.source ?? "project",
						catalogProject.value,
						fileName,
					),
					fileName,
					normalizedFileName: normalizeRecordingFileName(fileName),
					source: catalogProject.source ?? "project",
					project: catalogProject,
				}),
			);
		});

		Promise.allSettled(requests)
			.then((results) => {
				if (cancelled) return;
				const failures = results.filter(
					(result) => result.status === "rejected",
				);
				if (failures.length === results.length) {
					const firstFailure = failures[0] as PromiseRejectedResult;
					throw firstFailure.reason;
				}

				// Room entries are processed first and retain ownership of a
				// filename when the app contains a recording with the same name.
				const grouped = new Map<
					string,
					PlaybackRecordingCatalogItem[]
				>();
				results.forEach((result) => {
					if (result.status !== "fulfilled") return;
					result.value.forEach((item) => {
						const existing =
							grouped.get(item.normalizedFileName) ?? [];
						if (item.source === "room") {
							grouped.set(item.normalizedFileName, [item]);
						} else if (
							!existing.some(
								(candidate) => candidate.source === "room",
							) &&
							!existing.some(
								(candidate) => candidate.key === item.key,
							)
						) {
							grouped.set(item.normalizedFileName, [
								...existing,
								item,
							]);
						}
					});
				});
				const catalog = Array.from(grouped.values())
					.flat()
					.sort(
						(left, right) =>
							left.fileName.localeCompare(right.fileName) ||
							left.project.label.localeCompare(
								right.project.label,
							),
					);
				setRecordingCatalog(catalog);
				setFiles(
					Array.from(new Set(catalog.map((item) => item.fileName))),
				);
				setFilesReady(true);
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				setRecordingCatalog([]);
				setFiles([]);
				setFilesReady(true);
				onError(
					error instanceof Error
						? error.message
						: "Failed to build the recording catalog",
				);
			})
			.finally(() => {
				if (!cancelled) setIsLoadingFiles(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		insightId,
		listRecordingFiles,
		listRoomRecordingFiles,
		onError,
		projects,
		roomId,
	]);

	useEffect(() => {
		if (recordingCatalog.length === 0) return;
		const selectedByKey = recordingCatalog.find(
			(item) => item.key === selectedCatalogKey,
		);
		const selectedByFile = selectedRecording
			? recordingCatalog.find(
					(item) =>
						item.normalizedFileName ===
						normalizeRecordingFileName(selectedRecording),
				)
			: undefined;
		const preferred = savedRecordingSelection
			? recordingCatalog.find(
					(item) =>
						item.normalizedFileName ===
							normalizeRecordingFileName(
								savedRecordingSelection.fileName,
							) &&
						item.project.value ===
							savedRecordingSelection.projectValue,
				)
			: undefined;
		const selected =
			selectedByKey ??
			selectedByFile ??
			preferred ??
			(!isMcpPlaybackMode ? recordingCatalog[0] : undefined);
		if (!selected) return;

		setSelectedCatalogKey(selected.key);
		setSelectedRecording(selected.fileName);
		setProject(selected.project);
		setSource(selected.source);
	}, [
		isMcpPlaybackMode,
		recordingCatalog,
		savedRecordingSelection,
		selectedCatalogKey,
		selectedRecording,
	]);

	const selectProject = useCallback((next: PlaybackProject | null) => {
		resolvedParameterValuesRef.current = {};
		typeValuesRef.current = {};
		setSource(next?.source ?? "project");
		setSavedRecordingSelection(null);
		setProject(next);
	}, []);

	const selectRecording = useCallback(
		(recordingKeyOrFileName: string | null) => {
			resolvedParameterValuesRef.current = {};
			typeValuesRef.current = {};
			const selected =
				recordingCatalog.find(
					(item) => item.key === recordingKeyOrFileName,
				) ??
				recordingCatalog.find(
					(item) =>
						item.normalizedFileName ===
						normalizeRecordingFileName(
							recordingKeyOrFileName ?? "",
						),
				);
			if (selected) {
				setSource(selected.source);
				setProject(selected.project);
			}
			setSelectedCatalogKey(selected?.key ?? "");
			setSelectedRecording(selected?.fileName ?? recordingKeyOrFileName);
			setLoadedRecording(null);
			setLoadedRecordingOpen(false);
			setEditingStepId(null);
		},
		[recordingCatalog],
	);

	const selectSavedRecording = useCallback(
		(nextProject: PlaybackProject, fileName: string) => {
			resolvedParameterValuesRef.current = {};
			typeValuesRef.current = {};
			setSavedRecordingSelection({
				projectValue: nextProject.value,
				fileName,
			});
			setSource("project");
			setProject(nextProject);
			setSelectedCatalogKey(
				getRecordingCatalogKey("project", nextProject.value, fileName),
			);
			setSelectedRecording(fileName);
			setLoadedRecording(null);
			setLoadedRecordingOpen(false);
			setEditingStepId(null);
		},
		[],
	);

	const configureResolvedRecording = useCallback(
		(selection: ResolvedRecordingSelection) => {
			const matchingCatalogItems = recordingCatalog.filter(
				(item) =>
					item.normalizedFileName ===
					normalizeRecordingFileName(selection.fileName),
			);
			const catalogItem =
				matchingCatalogItems.find((item) => item.source === "room") ??
				matchingCatalogItems.find(
					(item) => item.project.value === selection.project?.value,
				) ??
				matchingCatalogItems[0];
			const selectedSource = catalogItem?.source ?? selection.source;
			const selectedProject = catalogItem?.project ?? selection.project;
			resolvedParameterValuesRef.current =
				selection.parameterValues ?? {};
			setStartUrl(normalizeBrowserUrl(selection.startUrl));
			setSource(selectedSource);
			setProject(
				selectedSource === "room"
					? (projects.find((item) => item.source === "room") ?? {
							label: "Playground recordings",
							value: "__playground_room__",
							source: "room",
						})
					: selectedProject,
			);
			setSelectedCatalogKey(catalogItem?.key ?? "");
			setSelectedRecording(catalogItem?.fileName ?? selection.fileName);
			if (selection.recording) {
				const cacheKey =
					catalogItem?.key ??
					getRecordingCatalogKey(
						selectedSource,
						selectedProject?.value ?? roomId,
						selection.fileName,
					);
				recordingCacheRef.current.set(cacheKey, selection.recording);
				initializeLoadedRecording(
					selection.recording,
					catalogItem?.fileName ?? selection.fileName,
					resolvedParameterValuesRef.current,
				);
			}
		},
		[initializeLoadedRecording, projects, recordingCatalog, roomId],
	);

	const resetReplayPreparation = useCallback(() => {
		replayPreparedRef.current = false;
	}, []);

	const resetExecution = useCallback(() => {
		pauseRequestedRef.current = false;
		replayPreparedRef.current = false;
		resolvedParameterValuesRef.current = {};
		typeValuesRef.current = {};
		setSavedRecordingSelection(null);
		setStartUrl("");
		setSource("project");
		setSelectedCatalogKey("");
		setSelectedRecording(null);
		setLoadedRecording(null);
		setRunningStepId(null);
		setExecutedStepIds(new Set());
		setEditedTypeValues({});
		setIsRunning(false);
		setIsPaused(false);
		setLoadedRecordingOpen(false);
		setEditingStepId(null);
		setValueRequiredStepId(null);
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
								? (typeValuesRef.current[step.id] ??
									getMcpStepParameterValue(
										step,
										resolvedParameterValuesRef.current,
									) ??
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
		[onError, sendReplayEvent],
	);

	const load = useCallback(async () => {
		const catalogItem =
			recordingCatalog.find((item) => item.key === selectedCatalogKey) ??
			recordingCatalog.find(
				(item) =>
					item.normalizedFileName ===
					normalizeRecordingFileName(selectedRecording ?? ""),
			);
		const selectedSource = catalogItem?.source ?? source;
		const selectedProject = catalogItem?.project ?? project;
		const selectedFileName = catalogItem?.fileName ?? selectedRecording;
		const cacheKey =
			catalogItem?.key ??
			(selectedProject && selectedFileName
				? getRecordingCatalogKey(
						selectedSource,
						selectedProject.value,
						selectedFileName,
					)
				: "");
		const cachedRecording = cacheKey
			? recordingCacheRef.current.get(cacheKey)
			: undefined;
		if (cachedRecording && selectedFileName) {
			initializeLoadedRecording(
				cachedRecording,
				selectedFileName,
				resolvedParameterValuesRef.current,
			);
			return;
		}
		if (
			selectedSource === "room" &&
			insightId &&
			selectedFileName &&
			loadRoomRecording
		) {
			setIsLoadingRecording(true);
			try {
				const recording = await loadRoomRecording(
					insightId,
					selectedFileName,
				);
				if (recording) {
					if (cacheKey) {
						recordingCacheRef.current.set(cacheKey, recording);
					}
					initializeLoadedRecording(
						recording,
						selectedFileName,
						resolvedParameterValuesRef.current,
					);
				} else {
					onError(
						`Could not load Playground recording ${selectedFileName}`,
					);
				}
			} finally {
				setIsLoadingRecording(false);
			}
			return;
		}
		if (!insightId || !selectedProject || !selectedFileName) {
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
				selectedProject.value,
				selectedFileName,
			);
			if (recording) {
				if (cacheKey) {
					recordingCacheRef.current.set(cacheKey, recording);
				}
				initializeLoadedRecording(
					recording,
					selectedFileName,
					resolvedParameterValuesRef.current,
				);
			}
		} finally {
			setIsLoadingRecording(false);
		}
	}, [
		initializeLoadedRecording,
		insightId,
		loadRecording,
		loadRoomRecording,
		onError,
		project,
		recordingCatalog,
		selectedCatalogKey,
		selectedRecording,
		session,
		source,
	]);

	const runStep = useCallback(
		async (tabId: string, step: LoadedRecordingStep) => {
			// Room recordings replay through replayRoomStep below, which never
			// touches project, so only project-sourced recordings require one.
			if (
				!insightId ||
				(source !== "room" && !project) ||
				!selectedRecording ||
				typeof step.id !== "number"
			) {
				onError("Cannot run this step");
				return false;
			}
			if (step.type === "TYPE") {
				const value =
					typeValuesRef.current[step.id] ??
					getMcpStepParameterValue(
						step,
						resolvedParameterValuesRef.current,
					) ??
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

			if (!project) {
				setRunningStepId(null);
				onError("Cannot run this step");
				return false;
			}

			const typeValue =
				step.type === "TYPE"
					? (typeValuesRef.current[step.id] ??
						getMcpStepParameterValue(
							step,
							resolvedParameterValuesRef.current,
						) ??
						(typeof step.text === "string" ? step.text : ""))
					: undefined;
			const paramValues =
				typeValue !== undefined
					? {
							...(typeof step.label === "string"
								? {
										[step.label]: typeValue,
										[sanitizeMcpParameterName(step.label)]:
											typeValue,
										[sanitizeMcpParameterName(
											step.label,
											"tool_",
										)]: typeValue,
									}
								: {}),
							[`step_${step.id}`]: typeValue,
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

	const run = useCallback((): Promise<PlaybackRunResult | null> => {
		if (runInFlightRef.current) {
			return runInFlightRef.current;
		}

		if (
			!insightId ||
			(source !== "room" && !project) ||
			!selectedRecording ||
			!loadedRecording
		) {
			onError("Load a recording before running it");
			return Promise.resolve(null);
		}

		const execution = (async (): Promise<PlaybackRunResult | null> => {
			setIsRunning(true);
			setIsPaused(false);
			setValueRequiredStepId(null);
			pauseRequestedRef.current = false;
			const completedStepIds = new Set(executedStepIds);
			let stepsRun = 0;
			try {
				for (const { tabId, step } of flattenedSteps) {
					if (
						step.shouldRun === false ||
						typeof step.id !== "number" ||
						completedStepIds.has(step.id)
					) {
						continue;
					}
					const shouldContinue = await runStep(tabId, step);
					if (shouldContinue) {
						completedStepIds.add(step.id);
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
				onMessage(`Finished playback: ${selectedRecording}`);
				setIsPaused(false);
				return { completed: true, stepsRun };
			} finally {
				setIsRunning(false);
			}
		})();

		runInFlightRef.current = execution;
		const clearExecution = () => {
			if (runInFlightRef.current === execution) {
				runInFlightRef.current = null;
			}
		};
		void execution.then(clearExecution, clearExecution);
		return execution;
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
		source,
	]);

	const updateTypeValue = useCallback((stepId: number, value: string) => {
		typeValuesRef.current = {
			...typeValuesRef.current,
			[stepId]: value,
		};
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
		typeValuesRef.current = {
			...typeValuesRef.current,
			[stepId]: value,
		};
		setEditedTypeValues((current) => ({ ...current, [stepId]: value }));
		setEditingStepId(null);
	}, []);

	return {
		hasSession: session !== null,
		projects,
		project,
		recordingCatalog,
		files,
		selectedRecording,
		selectedCatalogKey,
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
		filesReady,
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
		selectSavedRecording,
		configureResolvedRecording,
		initializeLoadedRecording,
		resetReplayPreparation,
		resetExecution,
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
