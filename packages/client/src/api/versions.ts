import { runPixel } from "@semoss/sdk/react";
import type { CommitVersion } from "@/types/types";

/**
 * Check if a pixel response contains errors
 * @param response - The pixel response object
 * @returns boolean indicating if there are errors
 */
const hasPixelError = (response: {
	pixelReturn: Array<{ operationType: string[] }>;
}): boolean => {
	const { operationType } = response.pixelReturn[0];
	return operationType.some((type: string) => type.includes("ERROR"));
};

/**
 * Execute a pixel with error handling
 * @param pixel - The pixel command to execute
 * @param insightId - Insight ID for the operation
 * @returns Promise with response and error status
 */
const executePixelWithErrorHandling = async (
	pixel: string,
	insightId: string,
) => {
	const response = await runPixel(pixel, insightId);
	const hasError = hasPixelError(response);

	return {
		response,
		hasError,
	};
};

/**
 * Add a tag to a specific commit in a Git project
 * @param projectId - ID of the project
 * @param commitId - ID of the commit to tag
 * @param tagName - Name of the tag to add
 * @param insightId - Insight ID for the operation
 * @returns Promise with the pixel response
 */
export const addGitTag = async (
	projectId: string,
	commitId: string,
	tagName: string,
	insightId: string,
) => {
	const pixel = `GitAddTag(project='${projectId}', commitId='${commitId}', tags='${tagName}')`;

	const { response, hasError } = await executePixelWithErrorHandling(
		pixel,
		insightId,
	);

	return {
		...response,
		hasError,
	};
};

/**
 * Fetch project commit details with pagination
 * @param projectId - ID of the project
 * @param offset - Offset for pagination (1-based)
 * @param limit - Number of records to fetch
 * @param insightId - Insight ID for the operation
 * @returns Promise with the commit versions
 */
export const fetchProjectCommitDetails = async (
	projectId: string,
	offset: number,
	limit: number,
	insightId: string,
): Promise<{
	data: CommitVersion[];
	hasError: boolean;
	errorMessage?: string;
}> => {
	try {
		const pixel = `ProjectCommitDetails(project="${projectId}", offset="${offset}", limit="${limit}");`;

		const { response, hasError } = await executePixelWithErrorHandling(
			pixel,
			insightId,
		);

		if (hasError) {
			return {
				data: [],
				hasError: true,
				errorMessage: "Failed to fetch commit details",
			};
		}

		const { output } = response.pixelReturn[0];

		// Transform API response to CommitVersion format
		const transformedVersions: CommitVersion[] =
			(output as CommitVersion[]) || [];

		return {
			data: transformedVersions,
			hasError: false,
		};
	} catch (error) {
		console.error("Error fetching project commit details:", error);
		return {
			data: [],
			hasError: true,
			errorMessage: "Failed to fetch commit details",
		};
	}
};

/**
 * Restore a project to a specific commit
 * @param projectId - ID of the project
 * @param commitId - ID of the commit to restore to
 * @param insightId - Insight ID for the operation
 * @returns Promise with the restore result
 */
export const restoreProjectCommit = async (
	projectId: string,
	commitId: string,
	insightId: string,
): Promise<{
	success: boolean;
	hasError: boolean;
	errorMessage?: string;
}> => {
	try {
		const pixel = `ProjectCommitRestore(project="${projectId}", commitId="${commitId}")`;

		const { hasError } = await executePixelWithErrorHandling(
			pixel,
			insightId,
		);

		if (hasError) {
			return {
				success: false,
				hasError: true,
				errorMessage: `Failed to restore to commit ${commitId}`,
			};
		}

		return {
			success: true,
			hasError: false,
		};
	} catch (error) {
		console.error("Error restoring project commit:", error);
		return {
			success: false,
			hasError: true,
			errorMessage: `Failed to restore to commit ${commitId}`,
		};
	}
};
