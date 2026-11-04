import { usePixel } from "@semoss/sdk/react";
import { pixel } from "@/lib/pixel";
import {
	type TopicFile,
	type TopicLink,
	topicFilesPageSchema,
} from "../api/topic-files";

interface TopicFilesResult {
	files: TopicFile[];
	links: TopicLink[];
	total: number;
	maxBytes: number | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}
/** Read and validate a single bounded page; usePixel cancels stale reads on scope changes. */
export function useTopicFiles(
	scope: { topicId?: string; roomId?: string },
	offset: number,
	isEnabled = true,
): TopicFilesResult {
	const query = usePixel<unknown>(
		isEnabled
			? pixel("BrainListTopicFiles", { ...scope, limit: 50, offset })
			: "",
	);
	const parsed =
		query.status === "SUCCESS"
			? topicFilesPageSchema.safeParse(query.data)
			: null;
	return {
		files: parsed?.success ? parsed.data.files : [],
		links: parsed?.success ? parsed.data.links : [],
		total: parsed?.success ? parsed.data.total : 0,
		maxBytes: parsed?.success ? parsed.data.maxBytes : null,
		isLoading:
			isEnabled &&
			(query.status === "INITIAL" || query.status === "LOADING"),
		error:
			query.status === "ERROR"
				? (query.error?.message ?? "Could not load topic files.")
				: parsed && !parsed.success
					? "SEMOSS returned an invalid file list."
					: null,
		refresh: query.refresh,
	};
}
