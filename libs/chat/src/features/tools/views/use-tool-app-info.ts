import { useEffect, useState } from "react";
import { getEngineInfo, getProjectInfo } from "@semoss/sdk";

/** What {@link useToolAppInfo} returns. */
export interface ToolAppInfo {
	/** `INITIAL` while there is nothing to read, then how the read went. */
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	/** What the app is built with; empty for an engine or a plain project. */
	projectType: string;
}

/** What {@link useToolAppInfo} keeps. */
interface ToolAppInfoState extends ToolAppInfo {
	/** What the state was read for. */
	source: string;
}

/**
 * The details of the app behind a tool call, read in the room's insight with
 * `ProjectInfo` for a project or `EngineInfo` for any other engine. A read
 * that lands after the app changed is dropped.
 *
 * @param app - The project or engine, or null when there is nothing to read.
 * @param isProject - Whether it is a project.
 * @param insightId - The room's insight.
 * @returns How the read went, and the project's type.
 */
export const useToolAppInfo = (
	app: string | null,
	isProject: boolean,
	insightId: string,
): ToolAppInfo => {
	const source = app ? `${isProject ? "PROJECT" : "ENGINE"}:${app}` : "";
	const [state, setState] = useState<ToolAppInfoState>({
		source: "",
		status: "INITIAL",
		projectType: "",
	});

	useEffect(() => {
		if (!app) {
			return;
		}
		let isCurrent = true;
		const read = isProject
			? getProjectInfo(insightId, app)
			: getEngineInfo(insightId, app);
		read.then(
			(info) => {
				if (isCurrent) {
					setState({
						source,
						status: "SUCCESS",
						projectType:
							typeof info.project_type === "string"
								? info.project_type
								: "",
					});
				}
			},
			() => {
				if (isCurrent) {
					setState({
						source,
						status: "ERROR",
						projectType: "",
					});
				}
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [app, isProject, insightId, source]);

	if (!source) {
		return { status: "INITIAL", projectType: "" };
	}
	// nothing has been read for this app yet
	if (state.source !== source) {
		return { status: "LOADING", projectType: "" };
	}
	return { status: state.status, projectType: state.projectType };
};
