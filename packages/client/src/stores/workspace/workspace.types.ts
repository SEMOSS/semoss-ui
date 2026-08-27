import type { FlexLayout } from "@semoss/shared";

export interface WorkspaceOptions {
	/** Legacy layout schema marker retained for the automation compatibility surface. */
	version?: string;
	layout: FlexLayout.IJsonModel;
}
