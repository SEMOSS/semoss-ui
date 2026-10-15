import { runPixel } from "@semoss/sdk";

/**
 * Restore a commit snapshot. Project restores also await the backend's rebuild
 * and publish when client source is present. A warning means the source was
 * restored but the rebuilt app could not be published.
 */
export const restoreGitCommit = async (
	insightId: string,
	type: "ENGINE" | "PROJECT",
	id: string,
	commitId: string,
): Promise<{ warning?: string }> => {
	const prefix = type === "ENGINE" ? "Engine" : "Project";
	const resource = type === "ENGINE" ? "engine" : "project";
	const { errors, pixelReturn } = await runPixel<[boolean | string]>(
		`${prefix}CommitRestore(${resource}=[${JSON.stringify(id)}], commitId=[${JSON.stringify(commitId)}]);`,
		insightId,
	);
	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	const result = pixelReturn[0];
	if (!result) {
		throw new Error("No response when restoring this commit");
	}
	if (result.operationType.includes("WARNING")) {
		return { warning: String(result.output) };
	}
	if (result.output !== true) {
		throw new Error("Failed to restore this commit");
	}
	return {};
};
