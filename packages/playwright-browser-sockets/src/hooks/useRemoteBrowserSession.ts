import { useCallback, useRef, useState } from "react";
import {
	assertPixelSuccess,
	fetchWithCsrf,
	getModulePath,
	runPixel,
} from "../semoss/pixel";
import type {
	LoadedRecording,
	RecordingProjectOption,
	RemoteBrowserRecordedStep,
	RemoteBrowserSessionInfo,
	ReplayStepResult,
	RoomRecordingSaveResponse,
	SaveRecordingRequest,
	SaveRecordingResponse,
	StepsEnvelope,
} from "../types/browserEvents";

const getApiBase = () => `${getModulePath()}/api/browser-sessions`;

interface UseRemoteBrowserSessionReturn {
	session: RemoteBrowserSessionInfo | null;
	error: string | null;
	isCreating: boolean;
	isSaving: boolean;
	isLoadingProjects: boolean;
	createSession: (
		url?: string,
		width?: number,
		height?: number,
		preserveExisting?: boolean,
	) => Promise<RemoteBrowserSessionInfo | null>;
	closeSession: () => Promise<void>;
	saveRecording: (
		payload: SaveRecordingRequest,
	) => Promise<SaveRecordingResponse | null>;
	getRecordingEnvelope: () => Promise<StepsEnvelope | null>;
	saveRoomRecording: (
		insightId: string,
		fileName: string,
		envelope: StepsEnvelope,
	) => Promise<RoomRecordingSaveResponse | null>;
	listRecordingProjects: (
		insightId: string,
	) => Promise<RecordingProjectOption[]>;
	listMcpProjects: (insightId: string) => Promise<RecordingProjectOption[]>;
	listRecordingFiles: (
		insightId: string,
		projectId: string,
	) => Promise<string[]>;
	getRoomRecordingEnvelope: (
		insightId: string,
		roomPath: string,
	) => Promise<LoadedRecording | null>;
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
	getRecordedSteps: () => Promise<RemoteBrowserRecordedStep[]>;
	/** Calls MakeRoomPlaywrightMCP() to regenerate mcp/pixel_mcp.json from all room recordings. */
	saveRoomMcpEntry: (
		insightId: string,
		fileName: string,
		envelope: StepsEnvelope,
		roomId?: string,
		projectId?: string,
	) => Promise<void>;
}

const escapePixelString = (value: string): string =>
	value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

export function useRemoteBrowserSession(): UseRemoteBrowserSessionReturn {
	const [session, setSession] = useState<RemoteBrowserSessionInfo | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingProjects, setIsLoadingProjects] = useState(false);
	const sessionRef = useRef<RemoteBrowserSessionInfo | null>(null);

	const createSession = useCallback(
		async (
			url = "",
			width = 1365,
			height = 768,
			preserveExisting = false,
		): Promise<RemoteBrowserSessionInfo | null> => {
			setIsCreating(true);
			setError(null);
			try {
				const res = await fetchWithCsrf(getApiBase(), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						url,
						viewportWidth: width,
						viewportHeight: height,
						preserveExisting,
					}),
				});

				if (!res.ok) {
					const errBody = await res
						.json()
						.catch(() => ({ error: res.statusText }));
					throw new Error(errBody.error || `HTTP ${res.status}`);
				}

				const info: RemoteBrowserSessionInfo = await res.json();
				setSession(info);
				sessionRef.current = info;
				return info;
			} catch (e: unknown) {
				const msg =
					e instanceof Error ? e.message : "Failed to create session";
				setError(msg);
				return null;
			} finally {
				setIsCreating(false);
			}
		},
		[],
	);

	const closeSession = useCallback(async () => {
		const s = sessionRef.current;
		if (!s) return;
		try {
			await fetchWithCsrf(`${getApiBase()}/${s.sessionId}`, {
				method: "DELETE",
			});
		} catch {
			// Best-effort close
		}
		setSession(null);
		sessionRef.current = null;
	}, []);

	const saveRecording = useCallback(
		async (
			payload: SaveRecordingRequest,
		): Promise<SaveRecordingResponse | null> => {
			const s = sessionRef.current;
			if (!s) {
				setError("No active recording session to save");
				return null;
			}

			setIsSaving(true);
			setError(null);
			try {
				const res = await fetchWithCsrf(
					`${getApiBase()}/${s.sessionId}/recording/save`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					},
				);

				if (!res.ok) {
					const errBody = await res
						.json()
						.catch(() => ({ error: res.statusText }));
					throw new Error(errBody.error || `HTTP ${res.status}`);
				}

				return (await res.json()) as SaveRecordingResponse;
			} catch (e: unknown) {
				const msg =
					e instanceof Error ? e.message : "Failed to save recording";
				setError(msg);
				return null;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	const getRecordingEnvelope =
		useCallback(async (): Promise<StepsEnvelope | null> => {
			const s = sessionRef.current;
			if (!s) {
				setError("No active recording session");
				return null;
			}

			setError(null);
			try {
				const res = await fetch(
					`${getApiBase()}/${s.sessionId}/recording`,
					{
						method: "GET",
						credentials: "include",
					},
				);

				if (!res.ok) {
					const errBody = await res
						.json()
						.catch(() => ({ error: res.statusText }));
					throw new Error(errBody.error || `HTTP ${res.status}`);
				}

				const output = await res.json();
				if (
					output &&
					typeof output === "object" &&
					!Array.isArray(output) &&
					"steps" in output
				) {
					return output as StepsEnvelope;
				}

				throw new Error(
					"Unexpected response while loading recording envelope",
				);
			} catch (e: unknown) {
				const msg =
					e instanceof Error
						? e.message
						: "Failed to load recording envelope";
				setError(msg);
				return null;
			}
		}, []);

	const saveRoomRecording = useCallback(
		async (
			insightId: string,
			fileName: string,
			envelope: StepsEnvelope,
		): Promise<RoomRecordingSaveResponse | null> => {
			if (!insightId) {
				setError("Insight ID is required to save room recording");
				return null;
			}

			const normalizedName = fileName.endsWith(".json")
				? fileName
				: `${fileName}.json`;
			const relativePath = `playwright/${normalizedName}`;
			const content = JSON.stringify(envelope, null, 2);

			setIsSaving(true);
			setError(null);
			try {
				const pixel = `SaveInsightAssets(filePath=[${JSON.stringify(relativePath)}], content=[${JSON.stringify(content)}]);`;
				const res = await runPixel(pixel, insightId);
				const errors = res.pixelReturn
					?.filter((item) =>
						String(item.operationType || "").includes("ERROR"),
					)
					.map((item) =>
						typeof item.output === "string"
							? item.output
							: JSON.stringify(item.output),
					);
				if (errors?.length) {
					throw new Error(errors.join("\n"));
				}

				return {
					saved: true,
					fileName: normalizedName,
					roomPath: `/${relativePath}`,
				};
			} catch (e: unknown) {
				const msg =
					e instanceof Error
						? e.message
						: "Failed to save recording to room";
				setError(msg);
				return null;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	const listRecordingProjects = useCallback(
		async (insightId: string): Promise<RecordingProjectOption[]> => {
			if (!insightId) {
				setError("Insight ID is required to list recording projects");
				return [];
			}

			setIsLoadingProjects(true);
			setError(null);
			try {
				const pixel = `MyProjects(metaFilters=[{"tag":["PLAYWRIGHT"]}], filterWord=[""], onlyPortals=[true]);`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output;
				if (!Array.isArray(output)) {
					return [];
				}

				return output
					.map(
						(project: {
							project_display_name?: string;
							project_name?: string;
							project_id?: string;
						}): RecordingProjectOption | null => {
							const value = project.project_id;
							if (!value) {
								return null;
							}
							return {
								label:
									project.project_display_name ||
									project.project_name ||
									value,
								value,
								project_id: value,
								project_name: project.project_name,
							};
						},
					)
					.filter(
						(project): project is RecordingProjectOption =>
							project !== null,
					);
			} catch (e: unknown) {
				const msg =
					e instanceof Error
						? e.message
						: "Failed to list recording projects";
				setError(msg);
				return [];
			} finally {
				setIsLoadingProjects(false);
			}
		},
		[],
	);

	const listMcpProjects = useCallback(
		async (insightId: string): Promise<RecordingProjectOption[]> => {
			if (!insightId) {
				setError("Insight ID is required to list MCP projects");
				return [];
			}

			setError(null);
			try {
				const pixel = `META | MyProjects(metaKeys=["tag", "description"], metaFilters=[{"tag":["MCP"]}], filterWord=[""]);`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output;
				if (!Array.isArray(output)) return [];

				return output
					.map(
						(project: {
							project_display_name?: string;
							project_name?: string;
							project_id?: string;
						}): RecordingProjectOption | null => {
							const value = project.project_id;
							if (!value) return null;
							return {
								label:
									project.project_display_name ||
									project.project_name ||
									value,
								value,
								project_id: value,
								project_name: project.project_name,
							};
						},
					)
					.filter(
						(option): option is RecordingProjectOption => !!option,
					);
			} catch (e: unknown) {
				setError(
					e instanceof Error
						? e.message
						: "Failed to list MCP projects",
				);
				return [];
			}
		},
		[],
	);

	const listRecordingFiles = useCallback(
		async (insightId: string, projectId: string): Promise<string[]> => {
			if (!insightId || !projectId) {
				return [];
			}

			setError(null);
			try {
				const pixel = `ListPlaywrightScripts(project="${escapePixelString(projectId)}");`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output;
				return Array.isArray(output)
					? output.filter(
							(item): item is string => typeof item === "string",
						)
					: [];
			} catch (e: unknown) {
				const msg =
					e instanceof Error
						? e.message
						: "Failed to list recordings";
				setError(msg);
				return [];
			}
		},
		[],
	);

	const getRoomRecordingEnvelope = useCallback(
		async (
			insightId: string,
			roomPath: string,
		): Promise<LoadedRecording | null> => {
			if (!insightId || !roomPath) {
				return null;
			}

			setError(null);
			try {
				const pixel = `GetInsightAssets(filePath=[${JSON.stringify(roomPath)}]);`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output;
				if (typeof output !== "string") {
					return null;
				}
				const parsed = JSON.parse(output);
				if (
					parsed &&
					typeof parsed === "object" &&
					!Array.isArray(parsed) &&
					"steps" in parsed
				) {
					return parsed as LoadedRecording;
				}
				return null;
			} catch {
				return null;
			}
		},
		[],
	);

	const loadRecording = useCallback(
		async (
			insightId: string,
			projectId: string,
			fileName: string,
		): Promise<LoadedRecording | null> => {
			const s = sessionRef.current;
			if (!s) {
				setError(
					"Start a remote browser session before loading a recording",
				);
				return null;
			}
			if (!insightId || !projectId || !fileName) {
				setError("Project and recording are required");
				return null;
			}

			setError(null);
			try {
				const pixel = `GetAllSteps(sessionId="${escapePixelString(s.sessionId)}", fileName="${escapePixelString(fileName)}", project="${escapePixelString(projectId)}");`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output;
				if (
					output &&
					typeof output === "object" &&
					!Array.isArray(output) &&
					"steps" in output
				) {
					return output as LoadedRecording;
				}
				throw new Error("Unexpected response while loading recording");
			} catch (e: unknown) {
				const msg =
					e instanceof Error ? e.message : "Failed to load recording";
				setError(msg);
				return null;
			}
		},
		[],
	);

	const replaySingleStep = useCallback(
		async (
			insightId: string,
			projectId: string,
			fileName: string,
			stepId: number,
			tabId: string,
			paramValues?: Record<string, string>,
		): Promise<ReplayStepResult> => {
			const s = sessionRef.current;
			if (!s) {
				return {
					success: false,
					error: "Start a remote browser session before running a recording",
				};
			}

			try {
				const paramValuesPixel =
					paramValues && Object.keys(paramValues).length > 0
						? `, paramValues=[${JSON.stringify(paramValues)}]`
						: "";
				const pixel = `ReplaySingleStep(sessionId="${escapePixelString(s.sessionId)}", fileName="${escapePixelString(fileName)}", stepId=${stepId}, tabId="${escapePixelString(tabId)}"${paramValuesPixel}, project="${escapePixelString(projectId)}");`;
				const res = await runPixel(pixel, insightId);
				const output = res.pixelReturn?.[0]?.output as
					| {
							status?: string;
							error?: string;
							shouldStop?: boolean;
							isNewTab?: boolean;
							newTabId?: string;
							tabTitle?: string;
					  }
					| undefined;

				if (!output) {
					return {
						success: false,
						error: "Replay did not return a result",
					};
				}
				if (output.status === "failed" || output.error) {
					return {
						success: false,
						error: output.error || "Step execution failed",
					};
				}
				return {
					success: true,
					shouldStop: output.shouldStop,
					isNewTab: output.isNewTab,
					newTabId: output.newTabId,
					tabTitle: output.tabTitle,
				};
			} catch (e: unknown) {
				return {
					success: false,
					error:
						e instanceof Error
							? e.message
							: "Failed to replay step",
				};
			}
		},
		[],
	);

	const getRecordedSteps = useCallback(async (): Promise<
		RemoteBrowserRecordedStep[]
	> => {
		const s = sessionRef.current;
		if (!s) return [];
		try {
			const res = await fetch(`${getApiBase()}/${s.sessionId}/steps`, {
				method: "GET",
				credentials: "include",
			});
			if (!res.ok) return [];
			const output = await res.json();
			return Array.isArray(output)
				? (output as RemoteBrowserRecordedStep[])
				: [];
		} catch {
			return [];
		}
	}, []);

	/**
	 * Reads the room's `mcp/pixel_mcp.json` insight asset (if present), merges a
	 * playback tool entry for the given recording file, then saves it back.  The
	 * saved format matches the project-level `pixel_mcp.json` read by InternalMCP.
	 */
	const saveRoomMcpEntry = useCallback(
		async (
			insightId: string,
			_fileName: string,
			_envelope: StepsEnvelope,
			roomId?: string,
			projectId?: string,
		): Promise<void> => {
			if (!insightId) return;
			const args = [
				roomId ? `roomId=${JSON.stringify(roomId)}` : "",
				projectId ? `projectId=${JSON.stringify(projectId)}` : "",
			].filter(Boolean);
			const response = await runPixel(
				`MakeRoomPlaywrightMCP(${args.join(", ")});`,
				insightId,
			);
			assertPixelSuccess(response, "Room MCP generation");
		},
		[],
	);

	return {
		session,
		error,
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
	};
}
