import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionPixel } from "@semoss/sdk/react";
import {
	getAppTestRun,
	parseAppTestRecordings,
	runAppTests,
	saveAppTestRecording,
} from "@/api/app-testing";
import type {
	AppTestRecording,
	AppTestRun,
	AppTestStep,
} from "./app-test.types";
import type { IframeRecorder } from "./iframe-recorder";
import { appendRecordedStep, attachIframeRecorder } from "./iframe-recorder";

interface AppTestingState {
	steps: AppTestStep[];
	isRecording: boolean;
	isPickingCheck: boolean;
	isSaving: boolean;
	isRunning: boolean;
	isAccessible: boolean;
	selectedId: string;
	setSelectedId: (id: string) => void;
	run: AppTestRun | null;
	notice: string;
	error: string;
	recordings: AppTestRecording[];
	isLoading: boolean;
	refreshRecordings: () => void;
	startRecording: () => void;
	stopRecording: () => void;
	addCheck: () => void;
	save: (name: string) => Promise<void>;
	startRun: () => Promise<void>;
	refreshRun: () => Promise<void>;
	discard: () => void;
}

/** Own recording listeners, draft lifetime, saves and bounded result polling. */
export const useAppTesting = (
	appId: string,
	frameRef: RefObject<HTMLIFrameElement | null>,
): AppTestingState => {
	const query = useSessionPixel<unknown>(
		`META | ListAppTestRecordings(project=${JSON.stringify([appId])});`,
	);
	const parsed = useMemo(() => {
		if (query.status !== "SUCCESS") return { recordings: [], error: "" };
		try {
			return {
				recordings: parseAppTestRecordings(appId, query.data),
				error: "",
			};
		} catch {
			return {
				recordings: [],
				error: "The saved recordings could not be read.",
			};
		}
	}, [appId, query.data, query.status]);
	const [steps, setSteps] = useState<AppTestStep[]>([]);
	const [startPath, setStartPath] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [isPickingCheck, setIsPickingCheck] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isStartingRun, setIsStartingRun] = useState(false);
	const [isAccessible, setIsAccessible] = useState(false);
	const [selectedId, setSelectedId] = useState("__platform_smoke__");
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [run, setRun] = useState<AppTestRun | null>(null);
	const recorder = useRef<IframeRecorder | null>(null);
	const lifetime = useRef<AbortController | null>(null);
	const runStartedAt = useRef(0);

	useEffect(() => {
		const controller = new AbortController();
		lifetime.current = controller;
		const frame = frameRef.current;
		const checkAccess = (): void => {
			try {
				const url = frame?.contentDocument?.URL;
				const expected = frame
					? new URL(frame.src, window.location.href)
					: null;
				const actual =
					url && url !== "about:blank" ? new URL(url) : null;
				setIsAccessible(
					Boolean(
						actual &&
							expected &&
							actual.origin === expected.origin &&
							actual.pathname.startsWith(expected.pathname),
					),
				);
			} catch {
				setIsAccessible(false);
			}
		};
		frame?.addEventListener("load", checkAccess);
		checkAccess();
		return () => {
			controller.abort();
			recorder.current?.stop();
			recorder.current = null;
			frame?.removeEventListener("load", checkAccess);
		};
	}, [frameRef]);

	const isRunning =
		isStartingRun || run?.status === "RUNNING" || run?.status === "QUEUED";
	useEffect(() => {
		if (!run || !["RUNNING", "QUEUED"].includes(run.status)) return;
		let isCancelled = false;
		const timer = window.setTimeout(async () => {
			try {
				if (Date.now() - runStartedAt.current > 180_000) {
					throw new Error(
						"The run is taking longer than expected. Refresh its result to check again.",
					);
				}
				const result = await getAppTestRun(appId, run.runId);
				if (!isCancelled) setRun(result);
			} catch (failure: unknown) {
				if (!isCancelled) {
					setError(
						failure instanceof Error
							? failure.message
							: "Could not read the run result",
					);
					setRun({ ...run, status: "UNKNOWN" });
				}
			}
		}, 1_000);
		return () => {
			isCancelled = true;
			window.clearTimeout(timer);
		};
	}, [appId, run]);

	const stopRecording = (): void => {
		recorder.current?.stop();
		recorder.current = null;
		setIsRecording(false);
		setIsPickingCheck(false);
	};

	const startRecording = (): void => {
		const frame = frameRef.current;
		if (!frame || !isAccessible) return;
		try {
			const actual = new URL(frame.contentDocument?.URL ?? "");
			const base = new URL(frame.src, window.location.href);
			setStartPath(
				actual.pathname.slice(base.pathname.length) +
					actual.search +
					actual.hash,
			);
		} catch {
			setError(
				"The app document cannot be recorded. Reload it and try again.",
			);
			return;
		}
		setError("");
		setNotice("");
		setSteps([]);
		setRun(null);
		setIsRecording(true);
		recorder.current = attachIframeRecorder(
			frame,
			(step) => {
				setSteps((current) => {
					if (current.length >= 300) return current;
					return appendRecordedStep(current, step);
				});
			},
			setNotice,
			setIsPickingCheck,
		);
	};

	// Stop rather than silently dropping actions after the supported recording size.
	useEffect(() => {
		if (steps.length < 300 || !isRecording) return;
		recorder.current?.stop();
		recorder.current = null;
		setIsRecording(false);
		setIsPickingCheck(false);
		setNotice(
			"Recording stopped at 300 steps. Save this recording before starting another.",
		);
	}, [isRecording, steps.length]);

	const addCheck = (): void => {
		recorder.current?.addCheck();
	};

	const save = async (name: string): Promise<void> => {
		const signal = lifetime.current?.signal;
		setIsSaving(true);
		setError("");
		try {
			const result = await saveAppTestRecording(appId, {
				name,
				startPath,
				steps,
			});
			if (signal?.aborted) return;
			setSelectedId(result.id);
			setSteps([]);
			query.refresh();
		} catch (failure: unknown) {
			if (!signal?.aborted)
				setError(
					failure instanceof Error
						? failure.message
						: "Could not save the recording",
				);
			throw failure;
		} finally {
			if (!signal?.aborted) setIsSaving(false);
		}
	};

	const startRun = async (): Promise<void> => {
		if (!selectedId || isRunning) return;
		const signal = lifetime.current?.signal;
		setIsStartingRun(true);
		setError("");
		setRun(null);
		runStartedAt.current = Date.now();
		try {
			const result = await runAppTests(appId, selectedId);
			if (!signal?.aborted) setRun(result);
		} catch (failure: unknown) {
			if (!signal?.aborted)
				setError(
					failure instanceof Error
						? failure.message
						: "Could not start the test run",
				);
		} finally {
			if (!signal?.aborted) setIsStartingRun(false);
		}
	};

	const refreshRun = async (): Promise<void> => {
		if (!run) return;
		const signal = lifetime.current?.signal;
		try {
			const result = await getAppTestRun(appId, run.runId);
			if (!signal?.aborted) {
				setError("");
				setRun(result);
			}
		} catch (failure: unknown) {
			if (!signal?.aborted)
				setError(
					failure instanceof Error
						? failure.message
						: "Could not refresh the result",
				);
		}
	};

	return {
		steps,
		isRecording,
		isPickingCheck,
		isSaving,
		isRunning,
		isAccessible,
		selectedId,
		setSelectedId,
		run,
		notice,
		error: error || parsed.error || query.error?.message || "",
		recordings: parsed.recordings,
		isLoading: query.status === "INITIAL" || query.status === "LOADING",
		refreshRecordings: query.refresh,
		startRecording,
		stopRecording,
		addCheck,
		save,
		startRun,
		refreshRun,
		discard: () => {
			setSteps([]);
			setNotice("");
		},
	};
};
