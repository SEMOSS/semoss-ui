import { observer } from "mobx-react-lite";
import { lazy, Suspense } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { SkillPublicFiles } from "@/components/skill";
import { NotebookViewWorkbench } from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";
import { useProject } from "@/hooks";

const Renderer = lazy(() =>
	import("@semoss/renderer").then((m) => ({ default: m.Renderer })),
);
const CodeRenderer = lazy(() =>
	import("@/components/project").then((m) => ({
		default: m.CodeRenderer,
	})),
);

interface ProjectViewProps {
	/** Insight the read-only project view runs its pixels against */
	insightId: string;
}

/**
 * Render the read-only view body for a loaded project, dispatching on its type.
 *
 * Intended for navbar-free surfaces (e.g. the share page): it renders only the
 * project content and never the `Navbar*`/`usePage` chrome the full view pages use.
 */
export const ProjectView = observer(({ insightId }: ProjectViewProps) => {
	const { project, type } = useProject();

	const loadingFallback = (
		<div className="absolute inset-0 z-1501 flex items-center justify-center bg-background/50">
			<Spinner className="size-4" />
		</div>
	);

	switch (type) {
		case "CODE":
			return (
				<div className="absolute inset-0">
					<Suspense fallback={loadingFallback}>
						<CodeRenderer appId={project.project_id} />
					</Suspense>
				</div>
			);
		case "BLOCKS":
			return (
				<div className="absolute inset-0">
					<Suspense fallback={loadingFallback}>
						<Renderer
							appId={project.project_id}
							insightId={insightId}
						/>
					</Suspense>
				</div>
			);
		case "SKILL":
			return (
				<div className="h-full w-full overflow-auto p-2">
					<InsightProvider
						options={{ insightId }}
						destroyOnUnmount={false}
					>
						<SkillPublicFiles
							projectId={project.project_id}
							insightId={insightId}
						/>
					</InsightProvider>
				</div>
			);
		case "NOTEBOOK":
			return (
				<InsightProvider
					options={{ insightId }}
					destroyOnUnmount={false}
				>
					<WorkbenchProvider id={`${project.project_id}-share`}>
						<NotebookViewWorkbench />
					</WorkbenchProvider>
				</InsightProvider>
			);
		default:
			return null;
	}
});
