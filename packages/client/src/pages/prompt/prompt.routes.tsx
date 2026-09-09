import { lazy } from "react";
import type { RouteObject } from "react-router";

const PromptPage = lazy(() =>
	import("./PromptPage").then((m) => ({ default: m.PromptPage })),
);
const PromptDetailPage = lazy(() =>
	import("./PromptDetailPage").then((m) => ({ default: m.PromptDetailPage })),
);

export const PROMPT_ROUTE: RouteObject = {
	path: "prompt",
	children: [
		{ index: true, element: <PromptPage /> },
		{ path: ":promptId", element: <PromptDetailPage /> },
	],
};
