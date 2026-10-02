import { useCallback, useEffect, useRef, useState } from "react";
import type { BrowserDownload, DownloadError } from "../types/browserEvents";

interface SaveDownloadsResponse {
	downloads?: BrowserDownload[];
	downloadErrors?: DownloadError[];
}

interface UseDownloadsOptions {
	insightId: string;
	/** Shared with App: the recording save flow rebinds it before the final drain. */
	insightIdRef: React.MutableRefObject<string>;
	listDownloads: () => Promise<BrowserDownload[]>;
	saveDownloadsToInsight: (
		insightId: string,
		downloadIds: string[],
	) => Promise<SaveDownloadsResponse | null>;
}

export function useDownloads({
	insightId,
	insightIdRef,
	listDownloads,
	saveDownloadsToInsight,
}: UseDownloadsOptions) {
	const [downloads, setDownloads] = useState<BrowserDownload[]>([]);
	const [downloadErrors, setDownloadErrors] = useState<DownloadError[]>([]);
	const [downloadsOpen, setDownloadsOpen] = useState(false);
	const downloadsRef = useRef<BrowserDownload[]>([]);
	const downloadErrorsRef = useRef<DownloadError[]>([]);
	const pendingDownloadIdsRef = useRef<Set<string>>(new Set());
	const downloadSaveInFlightRef = useRef<Promise<void> | null>(null);

	const mergeDownloads = useCallback((incoming: BrowserDownload[]) => {
		if (!incoming.length) return;
		const byId = new Map(
			downloadsRef.current.map((download) => [
				download.downloadId,
				download,
			]),
		);
		incoming.forEach((download) => {
			if (download?.downloadId) byId.set(download.downloadId, download);
		});
		const next = Array.from(byId.values()).sort(
			(left, right) => left.order - right.order,
		);
		downloadsRef.current = next;
		setDownloads(next);
	}, []);

	const applyDownloadSaveResponse = useCallback(
		(response: SaveDownloadsResponse) => {
			mergeDownloads(response.downloads ?? []);
			const errors = response.downloadErrors ?? [];
			downloadErrorsRef.current = errors;
			setDownloadErrors(errors);
			if (errors.length) {
				const byId = new Map(
					downloadsRef.current.map((download) => [
						download.downloadId,
						download,
					]),
				);
				errors.forEach((error) => {
					if (!error.downloadId) return;
					const current = byId.get(error.downloadId);
					if (current) {
						byId.set(error.downloadId, {
							...current,
							status: "save-failed",
							error: error.error,
						});
					}
				});
				const next = Array.from(byId.values()).sort(
					(left, right) => left.order - right.order,
				);
				downloadsRef.current = next;
				setDownloads(next);
			}
		},
		[mergeDownloads],
	);

	const queueDownloadSave = useCallback(
		(downloadIds: string[] = []): Promise<void> => {
			downloadIds.forEach((id) => {
				pendingDownloadIdsRef.current.add(id);
			});
			if (downloadSaveInFlightRef.current) {
				return downloadSaveInFlightRef.current;
			}
			const work = (async () => {
				while (pendingDownloadIdsRef.current.size > 0) {
					const targetInsightId = insightIdRef.current;
					if (!targetInsightId) return;
					const ids = Array.from(pendingDownloadIdsRef.current);
					pendingDownloadIdsRef.current.clear();
					const response = await saveDownloadsToInsight(
						targetInsightId,
						ids,
					);
					if (!response) {
						const errors = ids.map((downloadId) => ({
							downloadId,
							error: "Could not save browser download to the current insight",
						}));
						downloadErrorsRef.current = errors;
						setDownloadErrors(errors);
						return;
					}
					applyDownloadSaveResponse(response);
				}
			})();
			let tracked: Promise<void>;
			tracked = work.finally(() => {
				if (downloadSaveInFlightRef.current === tracked) {
					downloadSaveInFlightRef.current = null;
				}
			});
			downloadSaveInFlightRef.current = tracked;
			return tracked;
		},
		[applyDownloadSaveResponse, insightIdRef, saveDownloadsToInsight],
	);

	const flushDownloads = useCallback(
		async (waitForExpectedDownload = false) => {
			const deadline =
				Date.now() + (waitForExpectedDownload ? 15_000 : 1_500);
			let listed = await listDownloads();
			while (true) {
				mergeDownloads(listed);
				const readyIds = listed
					.filter(
						(download) =>
							download.status === "ready" ||
							download.status === "save-failed",
					)
					.map((download) => download.downloadId);
				if (readyIds.length) {
					await queueDownloadSave(readyIds);
					listed = await listDownloads();
					mergeDownloads(listed);
				}

				const hasDownloading = listed.some(
					(download) => download.status === "downloading",
				);
				const hasUnpersistedReady = listed.some(
					(download) =>
						download.status === "ready" ||
						download.status === "save-failed",
				);
				const hasObservedDownload = listed.length > 0;
				if (
					!hasDownloading &&
					!hasUnpersistedReady &&
					(!waitForExpectedDownload || hasObservedDownload)
				) {
					break;
				}
				if (Date.now() >= deadline) break;
				await new Promise((resolve) => window.setTimeout(resolve, 250));
				listed = await listDownloads();
			}
			mergeDownloads(listed);
		},
		[listDownloads, mergeDownloads, queueDownloadSave],
	);

	const downloadMcpPayload = useCallback(() => {
		const saved = downloadsRef.current.filter(
			(download) => download.status === "saved" && !!download.insightPath,
		);
		const errors = [...downloadErrorsRef.current];
		const errorDownloadIds = new Set(
			errors
				.filter((error) => !!error.downloadId)
				.map((error) => error.downloadId as string),
		);
		downloadsRef.current
			.filter(
				(download) =>
					(download.status === "failed" ||
						download.status === "save-failed") &&
					!!download.error,
			)
			.forEach((download) => {
				if (!errorDownloadIds.has(download.downloadId)) {
					errors.push({
						downloadId: download.downloadId,
						runId: download.runId,
						fileName: download.fileName,
						status: download.status,
						error: download.error || "Browser download failed",
					});
					errorDownloadIds.add(download.downloadId);
				}
			});
		const runId = saved[0]?.runId || downloadsRef.current[0]?.runId || "";
		return {
			downloadSummary: saved.length
				? `Downloaded ${saved.length} file${saved.length === 1 ? "" : "s"} and saved them to the current insight under /browser-downloads/${runId}/`
				: "No browser downloads were saved to the current insight",
			downloadCount: saved.length,
			downloads: saved,
			downloadErrors: errors,
		};
	}, []);

	const resetDownloads = useCallback(() => {
		downloadsRef.current = [];
		downloadErrorsRef.current = [];
		pendingDownloadIdsRef.current.clear();
		setDownloads([]);
		setDownloadErrors([]);
		setDownloadsOpen(false);
	}, []);

	const handleDownload = useCallback(
		(download: BrowserDownload) => {
			mergeDownloads([download]);
			if (download.status === "ready") {
				void queueDownloadSave([download.downloadId]);
			}
		},
		[mergeDownloads, queueDownloadSave],
	);

	useEffect(() => {
		if (insightId) {
			void queueDownloadSave();
		}
	}, [insightId, queueDownloadSave]);

	return {
		downloads,
		downloadErrors,
		downloadsOpen,
		setDownloadsOpen,
		applyDownloadSaveResponse,
		queueDownloadSave,
		flushDownloads,
		downloadMcpPayload,
		resetDownloads,
		handleDownload,
	};
}
