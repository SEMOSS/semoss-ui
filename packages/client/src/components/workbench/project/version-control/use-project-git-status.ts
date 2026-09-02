import { useEffect } from "react";
import { usePixel } from "@semoss/sdk/react";
import { useProject, useWorkbench } from "@/hooks";
import type { ProjectGitStatus } from "./version-control.types";

/** Read project Git status and refresh when another Git operation completes. */
export const useProjectGitStatus = () => {
	const { project } = useProject();
	const events = useWorkbench((state) => state.events.actions);
	const status = usePixel<ProjectGitStatus>(
		`ProjectGitStatus(project=[${JSON.stringify(project.project_id)}]);`,
	);

	useEffect(() => {
		const unsubscribeStatus = events.subscribe(
			"git:status-changed",
			status.refresh,
		);
		const unsubscribeBranch = events.subscribe(
			"git:branch-changed",
			status.refresh,
		);
		return () => {
			unsubscribeStatus();
			unsubscribeBranch();
		};
	}, [events, status.refresh]);

	return status;
};
