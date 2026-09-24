import { type FC, memo, Suspense, useEffect } from "react";
import { Skeleton } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfigAny,
	WorkbenchPanelId,
	WorkbenchPanelRecord,
} from "../../types";
import { WorkbenchPanelError } from "./workbench-panel-error";
import { WorkbenchPanelErrorBoundary } from "./workbench-panel-error-boundary";

/**
 * A lazy body suspends until its import resolves; this fires once it has,
 * which is how a header learns its panel went from "pending" to "ready".
 */
const WorkbenchReadyPing: FC<{ onReady: () => void }> = ({ onReady }) => {
	useEffect(() => {
		onReady();
	}, [onReady]);
	return null;
};

const WorkbenchPanelSkeleton: FC = () => (
	<div className="space-y-2 p-4">
		<Skeleton className="h-3 w-4/5" />
		<Skeleton className="h-3 w-1/2" />
		<Skeleton className="h-3 w-2/3" />
	</div>
);

interface WorkbenchPanelBodyProps {
	/** The instance record, absent for an empty dock placeholder. */
	record: WorkbenchPanelRecord | undefined;
	/** The instance's blueprint, absent for unregistered types. */
	component: WorkbenchPanelConfigAny | undefined;
	/** The instance the body is drawn for — all the content is handed. */
	pid: WorkbenchPanelId;
	/** Reported once the body has resolved and rendered. */
	onReady: () => void;
	/** Reported when the body throws. */
	onError: () => void;
}

/**
 * One panel body: placeholders, error boundary, suspense, and content.
 *
 * Memoized because its parent host re-renders whenever its measured slot rect
 * changes — every frame of a splitter or border drag, and for every panel at
 * once on a window resize. Only the host's wrapper `<div>` needs that; without
 * this, each of those frames re-rendered the host-supplied `content`, which is
 * an editor, a terminal or a viewer and is not memoized itself. Every prop
 * here is already identity-stable (store objects, a constant pid, and two
 * `useCallback`s).
 */
export const WorkbenchPanelBody: FC<WorkbenchPanelBodyProps> = memo(
	({ record, component, pid, onReady, onError }) => {
		if (!record) {
			return (
				<div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground text-sm">
					No panel here.
				</div>
			);
		}

		const Content = component?.content;
		if (!Content) {
			// A misconfiguration, not an empty state — surfaced like a thrown body
			// so the two failure modes read the same.
			return (
				<WorkbenchPanelError
					message={`No component registered for “${record.type}”.`}
					testId="workbench-panel-unregistered-message"
				/>
			);
		}

		return (
			<WorkbenchPanelErrorBoundary onError={onError}>
				<Suspense fallback={<WorkbenchPanelSkeleton />}>
					<Content id={pid} />
					<WorkbenchReadyPing onReady={onReady} />
				</Suspense>
			</WorkbenchPanelErrorBoundary>
		);
	},
);

WorkbenchPanelBody.displayName = "WorkbenchPanelBody";
