import { useCallback, useEffect, useState } from "react";
import { useNotification } from "@semoss/ui";
import type { CommitVersion } from "@/types/types";
import { useRootStore } from "./useRootStore";

// Hook for managing versions table state and operations

export function useVersionsTable(id: string) {
	const { monolithStore } = useRootStore();
	const notification = useNotification();

	// Loading and error states
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [restoreLoading, setRestoreLoading] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Cached data - fetch 100 records at a time from backend
	const [allVersions, setAllVersions] = useState<CommitVersion[]>([]);
	const [hasMoreData, setHasMoreData] = useState(true);
	const [currentBatch, setCurrentBatch] = useState(0); // Which 100-record batch we're on

	// Frontend pagination state - show data in smaller chunks
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);

	// Constants
	const BACKEND_FETCH_SIZE = 100; // Always fetch 100 from backend

	// Get all existing tags for the project (for uniqueness validation)
	const getAllTags = useCallback((): string[] => {
		const tagSet = new Set<string>();
		allVersions.forEach((version) => {
			version.tags?.forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet);
	}, [allVersions]);

	// Add a tag to a specific version
	const addTagToVersion = useCallback((commitId: string, newTag: string) => {
		setAllVersions((prevVersions) =>
			prevVersions.map((version) =>
				version.commitId === commitId
					? {
							...version,
							tags: version.tags
								? [...version.tags, newTag]
								: [newTag],
						}
					: version,
			),
		);
	}, []);

	// Fetch a batch of 100 records from backend
	const fetchBatchFromBackend = useCallback(
		async (batchNumber: number) => {
			try {
				setError(null);

				// Calculate offset for backend (1-based, fetch 100 records)
				const offset = batchNumber * BACKEND_FETCH_SIZE + 1;
				const limit = BACKEND_FETCH_SIZE;

				const response = await monolithStore.runQuery(
					`ProjectCommitDetails(project="${id}", offset="${offset}", limit="${limit}");`,
				);

				const { output, operationType } = response.pixelReturn[0];

				if (
					operationType.some((type: string) => type.includes("ERROR"))
				) {
					setError("Failed to fetch commit details");
					return [];
				}

				// Transform API response to CommitVersion format
				const transformedVersions: CommitVersion[] = output || [];

				// Update hasMoreData based on response
				if (transformedVersions.length < BACKEND_FETCH_SIZE) {
					setHasMoreData(false);
				}

				return transformedVersions;
			} catch (err) {
				console.error("Error fetching versions:", err);
				setError("Failed to fetch commit details");
				return [];
			}
		},
		[id, monolithStore],
	);

	// Load initial data or refresh
	const loadData = useCallback(
		async (shouldSetLoading: boolean = true) => {
			try {
				if (shouldSetLoading) {
					setLoading(true);
					setRefreshing(true);
				}

				// Reset state
				setAllVersions([]);
				setHasMoreData(true);
				setCurrentBatch(0);
				setPage(0);

				// Fetch first batch
				const firstBatch = await fetchBatchFromBackend(0);
				setAllVersions(firstBatch);
				setCurrentBatch(0);
			} catch (err) {
				console.error("Error loading data:", err);
				setError("Failed to load commit details");
			} finally {
				if (shouldSetLoading) {
					setLoading(false);
					setRefreshing(false);
				}
			}
		},
		[fetchBatchFromBackend],
	);

	// Load more data when needed
	const loadMoreData = useCallback(async () => {
		if (!hasMoreData) return;

		const nextBatch = currentBatch + 1;
		const newData = await fetchBatchFromBackend(nextBatch);

		if (newData.length > 0) {
			setAllVersions((prev) => [...prev, ...newData]);
			setCurrentBatch(nextBatch);
		}
	}, [currentBatch, hasMoreData, fetchBatchFromBackend]);

	// Initialize data on id change
	useEffect(() => {
		if (!id) return;
		loadData(true);
	}, [id, loadData]);

	// Get currently visible versions for the current page
	const getCurrentPageVersions = useCallback(() => {
		const startIndex = page * rowsPerPage;
		const endIndex = startIndex + rowsPerPage;
		return allVersions.slice(startIndex, endIndex);
	}, [allVersions, page, rowsPerPage]);

	// Check if we need to load more data when user navigates
	const checkAndLoadMoreData = useCallback(
		async (newPage: number) => {
			const requiredDataLength = (newPage + 1) * rowsPerPage;
			const currentDataLength = allVersions.length;

			// If we need more data and there's potentially more available
			if (requiredDataLength > currentDataLength && hasMoreData) {
				await loadMoreData();
			}
		},
		[allVersions.length, hasMoreData, loadMoreData, rowsPerPage],
	);

	// Handle page change
	const handlePageChange = useCallback(
		async (
			_event: React.MouseEvent<HTMLButtonElement> | null,
			newPage: number,
		) => {
			// Check if we need to load more data first
			await checkAndLoadMoreData(newPage);
			setPage(newPage);
		},
		[checkAndLoadMoreData],
	);

	// Handle rows per page change
	const handleRowsPerPageChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const newRowsPerPage = parseInt(event.target.value, 10);
			setRowsPerPage(newRowsPerPage);
			setPage(0); // Reset to first page when changing page size
		},
		[],
	);

	// Handle refresh with current pagination settings
	const handleRefresh = useCallback(() => {
		loadData(true);
	}, [loadData]);

	// Calculate total count for pagination
	const getTotalCount = useCallback(() => {
		if (hasMoreData) {
			return -1; // Unknown total, more data available
		} else {
			return allVersions.length; // We have all data
		}
	}, [allVersions.length, hasMoreData]);

	// Handle restore action for a specific commit version
	const handleRestore = useCallback(
		async (version: CommitVersion) => {
			try {
				setRestoreLoading(version.commitId);

				const response = await monolithStore.runQuery(
					`ProjectCommitRestore(project="${id}", commitId="${version.commitId}")`,
				);

				const { operationType } = response.pixelReturn[0];

				if (
					operationType.some((type: string) => type.includes("ERROR"))
				) {
					notification.add({
						color: "error",
						message: `Failed to restore to commit ${version.commitId}`,
					});
				} else {
					notification.add({
						color: "success",
						message: `Successfully restored to commit ${version.commitId}`,
					});
					window.location.reload();
				}
			} catch (error) {
				console.error("Error restoring commit:", error);
				notification.add({
					color: "error",
					message: `Failed to restore to commit ${version.commitId}`,
				});
			} finally {
				setRestoreLoading(null);
			}
		},
		[id, monolithStore, notification],
	);

	return {
		// State
		loading,
		error,
		restoreLoading,
		refreshing,
		allVersions,
		page,
		rowsPerPage,

		// Computed values
		currentVersions: getCurrentPageVersions(),
		totalCount: getTotalCount(),

		// Handlers
		handlePageChange,
		handleRowsPerPageChange,
		handleRefresh,
		handleRestore,

		// Tag-related functions
		getAllTags,
		addTagToVersion,
	};
}
