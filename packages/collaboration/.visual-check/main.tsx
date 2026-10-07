import { createRoot } from "react-dom/client";
import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ThemeProvider, Toaster, TooltipProvider } from "@semoss/ui/next";
import { CollaborationLayout } from "../src/features/collaboration/components/collaboration-layout";
import { BrainPage } from "../src/pages/brain.page";
import { WorkPage } from "../src/pages/work.page";
import { WorkThreadPage } from "../src/pages/work-thread.page";
import "../src/index.css";

const router = createHashRouter([
	{
		Component: CollaborationLayout,
		children: [
			{ index: true, element: <Navigate to="/work" replace /> },
			...["work", "work/waiting", "work/done", "work/topic/:topicId"].map(
				(path) => ({ path, Component: WorkPage }),
			),
			{ path: "work/thread/:threadId", Component: WorkThreadPage },
			...[
				"brain",
				"brain/sources",
				"brain/profile",
				"brain/people",
				"brain/people/:personId",
				"brain/threads",
				"brain/threads/:threadId",
				"brain/topics/:topicId",
			].map((path) => ({ path, Component: BrainPage })),
		],
	},
]);
const root = document.getElementById("root");
if (!root) throw new Error("Fixture root is missing");
createRoot(root).render(
	<ThemeProvider
		defaultTheme="light"
		storageKey="collaboration-isolated-visual-fixture-theme"
	>
		<TooltipProvider>
			<div className="h-dvh p-4">
				<RouterProvider router={router} />
			</div>
			<div className="pointer-events-none fixed right-2 bottom-2 z-50 rounded border bg-background px-2 py-1 text-muted-foreground text-xs">
				Isolated fixture · backend unavailable
			</div>
			<Toaster />
		</TooltipProvider>
	</ThemeProvider>,
);
