import { Navigate, useLocation, useParams } from "react-router";
import { topicPath } from "@/lib/workspace-paths";

/** Keeps saved Work and Brain topic links on the shared topic workspace. */
export function LegacyTopicPage() {
	const { topicId } = useParams();
	const { search, hash } = useLocation();
	return (
		<Navigate
			to={{ pathname: topicPath(topicId ?? ""), search, hash }}
			replace
		/>
	);
}
