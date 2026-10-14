import { InsightProvider } from "@semoss/sdk/react";
import {
	MY_FILES_WORKBENCH_COMPONENTS,
	MyFilesWorkbench,
} from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";

/**
 * Browse and edit the current user's asset space, as a workbench dock.
 *
 * The height is viewport-derived rather than `h-full`: the workbench shell is
 * `absolute inset-0`, so it needs an ancestor that is both positioned and
 * definitely sized, and the settings layout gives its outlet neither. The
 * subtracted 240px is the settings chrome above it — breadcrumb, title, and
 * description — which the dock's maximize toggle escapes when it is not enough.
 */
export const MyFilesPage = () => (
	<div className="h-[calc(100dvh-240px)] min-h-[480px] w-full overflow-hidden">
		<InsightProvider>
			<WorkbenchProvider components={MY_FILES_WORKBENCH_COMPONENTS}>
				<MyFilesWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	</div>
);
