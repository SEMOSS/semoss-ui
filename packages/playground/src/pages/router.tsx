import { lazy, Suspense, useEffect } from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "./error-page";
import { InitializedLayout } from "./initialized-layout";
import { MainLayout } from "./main-layout";

// Lazy-loaded page chunks
const WorkspacePage = lazy(() =>
	import("./workspace-page").then((m) => ({ default: m.WorkspacePage })),
);
const WorkspaceDetailPage = lazy(() =>
	import("./workspace-detail-page").then((m) => ({
		default: m.WorkspaceDetailPage,
	})),
);
const NewWorkspacePage = lazy(() =>
	import("./new-workspace-page").then((m) => ({
		default: m.NewWorkspacePage,
	})),
);
const EditWorkspacePage = lazy(() =>
	import("./edit-workspace-page").then((m) => ({
		default: m.EditWorkspacePage,
	})),
);
const EmbedPage = lazy(() =>
	import("./embed-page").then((m) => ({ default: m.EmbedPage })),
);
const DocumentLibrary = lazy(() =>
	import("./knowledge-page").then((m) => ({ default: m.DocumentLibrary })),
);
const KnowledgeDetailPage = lazy(() =>
	import("./knowledge-detail-page").then((m) => ({
		default: m.KnowledgeDetailPage,
	})),
);

// Prefetch all route chunks in the background after the app loads
const prefetchRoutes = () => {
	import("./workspace-page");
	import("./workspace-detail-page");
	import("./new-workspace-page");
	import("./edit-workspace-page");
	import("./embed-page");
	import("./knowledge-page");
	import("./knowledge-detail-page");
};

const router = createHashRouter([
	{
		element: <InitializedLayout />,
		errorElement: <ErrorPage />,
		children: [
			{
				element: <MainLayout />,
				children: [
					{
						errorElement: <ErrorPage isInnerComponent />,
						children: [
							{
								path: "embed/:path",
								element: (
									<Suspense fallback={<Spinner />}>
										<EmbedPage />
									</Suspense>
								),
							},
							{
								path: "agent",
								element: (
									<Suspense fallback={<Spinner />}>
										<WorkspacePage />
									</Suspense>
								),
							},
							{
								path: "agent/new",
								element: (
									<Suspense fallback={<Spinner />}>
										<NewWorkspacePage />
									</Suspense>
								),
							},
							{
								path: "agent/:workspaceId",
								element: (
									<Suspense fallback={<Spinner />}>
										<WorkspaceDetailPage />
									</Suspense>
								),
							},
							{
								path: "agent/:workspaceId/edit",
								element: (
									<Suspense fallback={<Spinner />}>
										<EditWorkspacePage />
									</Suspense>
								),
							},
							{
								path: "knowledge",
								element: (
									<Suspense fallback={<Spinner />}>
										<DocumentLibrary />
									</Suspense>
								),
							},
							{
								path: "knowledge/:knowledgeId",
								element: (
									<Suspense fallback={<Spinner />}>
										<KnowledgeDetailPage />
									</Suspense>
								),
							},
						],
					},
				],
			},
		],
	},
]);

export const Router = () => {
	useEffect(() => {
		prefetchRoutes();
	}, []);

	return <RouterProvider router={router} />;
};
