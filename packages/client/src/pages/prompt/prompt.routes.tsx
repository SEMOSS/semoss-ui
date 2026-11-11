import { lazy } from "react";
import type { RouteObject } from "react-router";

const PromptPage = lazy(() =>
	import("./prompt.page").then((m) => ({ default: m.PromptPage })),
);
const PromptDetailPage = lazy(() =>
	import("./prompt-detail.page").then((m) => ({
		default: m.PromptDetailPage,
	})),
);

/** The prompt catalog and a prompt's page. */
export const PROMPT_ROUTE: RouteObject = {
	path: "prompt",
	children: [
		{ index: true, element: <PromptPage /> },
		{ path: ":promptId", element: <PromptDetailPage /> },
	],
};
