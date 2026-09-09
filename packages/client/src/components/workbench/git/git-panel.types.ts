type GitPanelScope = "ENGINE" | "PROJECT";

/** Resource identity and access state carried by each Git panel config. */
export interface GitPanelScopeParams {
	type: GitPanelScope;
	id: string;
}
