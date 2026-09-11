import { type FC, Suspense, useEffect } from "react";
import { Skeleton } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfigAny,
	WorkbenchPanelProps,
	WorkbenchPanelRecord,
} from "@/stores/workbench";
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

export interface WorkbenchPanelBodyProps {
	/** The instance record, absent for an empty dock placeholder. */
	record: WorkbenchPanelRecord | undefined;
	/** The instance's blueprint, absent for unregistered types. */
	component: WorkbenchPanelConfigAny | undefined;
	/** The props handed to the blueprint's content. */
	panel: WorkbenchPanelProps;
	/** Reported once the body has resolved and rendered. */
	onReady: () => void;
	/** Reported when the body throws. */
	onError: () => void;
}

/** One panel body: placeholders, error boundary, suspense, and content. */
export const WorkbenchPanelBody: FC<WorkbenchPanelBodyProps> = ({
	record,
	component,
	panel,
	onReady,
	onError,
}) => {
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
				<Content {...panel} />
				<WorkbenchReadyPing onReady={onReady} />
			</Suspense>
		</WorkbenchPanelErrorBoundary>
	);
};
