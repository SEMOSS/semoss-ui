import type {
	AutomationNode,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../../domain/automation.types";
import { AutomationHistoryPanel } from "../automation-history-panel";

/** Props for the history dock tab. */
interface HistoryTabProps {
	steps: AutomationNode[];
	runs: AutomationRunSummary[];
	loading: boolean;
	lastRefreshed: Date | null;
	expandedRunId: string | null;
	expandedRun: AutomationRunDetail | null;
	detailLoading: boolean;
	expandedNodes: Set<string>;
	showExecutedDefinition: boolean;
	onRefresh: () => void;
	onSelectRun: (runId: string) => void;
	onToggleNode: (nodeId: string) => void;
	onToggleExecutedDefinition: () => void;
}

export function HistoryTab(props: HistoryTabProps) {
	return <AutomationHistoryPanel {...props} />;
}
