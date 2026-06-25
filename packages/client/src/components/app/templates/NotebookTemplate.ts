import { STATE_VERSION } from "@semoss/renderer/version";
import CHATAI from "@/assets/img/DragDrop.png";
import type { Template } from "./templates.types";

/**
 * Tag applied to apps created from the Notebook template. Used to identify
 * notebook-only apps so the workspace renders a restricted set of panels
 * (Notebooks, Files, Settings) without Blocks, Variables, or Layers.
 */
export const NOTEBOOK_APP_TAG = "Notebook";

/**
 * Id of the default notebook seeded into a Notebook app. The workspace opens
 * this notebook automatically so the app starts on a usable notebook tab
 * (mirroring how block templates open with a default page).
 */
export const DEFAULT_NOTEBOOK_ID = "notebook 1";

export const NotebookTemplate: Template = {
	name: "Notebook",
	description: "Write and run notebooks with code cells",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [NOTEBOOK_APP_TAG],
	state: {
		version: STATE_VERSION,
		queries: {
			[DEFAULT_NOTEBOOK_ID]: {
				id: DEFAULT_NOTEBOOK_ID,
				cells: [
					{
						id: "1",
						widget: "code",
						parameters: {
							code: "",
							type: "py",
						},
					},
				],
			},
		},
		blocks: {},
		variables: {},
		executionOrder: [],
	},
};
