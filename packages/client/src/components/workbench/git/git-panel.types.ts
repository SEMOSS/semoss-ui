import { getFilePanelScope } from "@semoss/panels";

type GitPanelScope = "ENGINE" | "PROJECT";

/** Resource identity and access state carried by each Git panel config. */
export interface GitPanelScopeParams {
	type: GitPanelScope;
	id: string;
}

/**
 * The file-event scope for a Git resource.
 *
 * Git names a project `PROJECT`, the file panels name the same thing `APP`.
 * One translation, here, so a `FILES_CHANGED` a Git panel emits reaches the
 * explorer and the editors that are showing those files.
 *
 * @param params - The Git panel's resource.
 * @return The scope key the file panels subscribe on.
 */
export const gitFileScope = ({ type, id }: GitPanelScopeParams): string =>
	getFilePanelScope(
		type === "ENGINE"
			? { type: "ENGINE", engine: id }
			: { type: "APP", app: id },
	);
