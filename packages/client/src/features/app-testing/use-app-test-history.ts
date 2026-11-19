import { useEffect } from "react";
import { useSessionPixel } from "@semoss/sdk/react";
import { parseAppTestRunHistoryPage } from "@/api/app-testing";
import type { AppTestRunHistoryPage } from "./app-test.types";

interface AppTestHistoryState {
	page: AppTestRunHistoryPage | null;
	isLoading: boolean;
	error: string;
	refresh: () => void;
}

/** Read compact history and follow active runs without loading test definitions. */
export const useAppTestHistory = (
	appId: string,
	options: { recordingId?: string; offset?: number; runKey?: string } = {},
): AppTestHistoryState => {
	const { recordingId, offset = 0, runKey } = options;
	const filter = recordingId
		? `, recordingId=${JSON.stringify([recordingId])}`
		: "";
	const query = useSessionPixel<unknown>(
		`META | ListAppTestRuns(project=${JSON.stringify([appId])}${filter}, offset=[${offset}], limit=[20]);`,
	);
	let page: AppTestRunHistoryPage | null = null;
	let error = query.error?.message ?? "";
	if (query.status === "SUCCESS") {
		try {
			page = parseAppTestRunHistoryPage(appId, query.data, recordingId);
		} catch {
			error = "The test run history could not be read.";
		}
	}
	const { refresh } = query;
	useEffect(() => {
		if (runKey) refresh();
	}, [runKey, refresh]);
	useEffect(() => {
		window.addEventListener("focus", refresh);
		return () => window.removeEventListener("focus", refresh);
	}, [refresh]);
	const hasActiveRun =
		page?.latest.some((test) =>
			["QUEUED", "RUNNING"].includes(test.status),
		) ?? false;
	useEffect(() => {
		if (query.status !== "SUCCESS") return;
		const timer = window.setInterval(
			() => {
				if (document.visibilityState === "visible") refresh();
			},
			hasActiveRun ? 2000 : 10000,
		);
		return () => window.clearInterval(timer);
	}, [hasActiveRun, refresh, query.status]);
	return {
		page,
		error,
		refresh,
		isLoading: query.status === "INITIAL" || query.status === "LOADING",
	};
};
