import { MessageSquareIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { useWorkbench, type WorkbenchPanelConfig } from "@semoss/workbench";
import { useAssistant } from "@/hooks/use-assistant";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import {
	ASSISTANT_HANDOFF_PARAM,
	takeAssistantHandoff,
} from "@/utility/assistant-handoff";
import { AssistantPanel } from "./assistant-panel";

/**
 * Renders the workbench ASSISTANT panel. Waits until the insight is ready,
 * initializes the assistant store for that insight ID, and disposes it
 * (dropping run watchers) when the panel unmounts or the insight changes.
 *
 * `dispose()`, not `destroy()`: the store outlives any one insight. Its
 * lifetime belongs to `useAssistantStore`, which owns the teardown.
 *
 * It also adopts a run started on another page — the template catalog's prompt
 * box starts one before navigating here — switching to that run's room and
 * reattaching to its live stream. This lives here because it is the one
 * component that knows the panel has mounted, and every workbench shares it.
 *
 * @name AssistantView
 * @return The assistant panel wired to the current insight.
 */
const AssistantView = () => {
	const insight = useInsight();
	const initialize = useAssistant((state) => state.initialize);
	const dispose = useAssistant((state) => state.dispose);

	const [searchParams, setSearchParams] = useSearchParams();
	const handoffId = searchParams.get(ASSISTANT_HANDOFF_PARAM);

	const adoptRun = useAssistant((state) => state.adoptRun);
	const isInitializing = useAssistant((state) => state.isInitializing);
	const roomId = useAssistant((state) => state.roomId);

	const layoutActions = useWorkbench((state) => state.layout.actions);

	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}
		void initialize(insight.insightId);
		return () => dispose();
	}, [insight.isReady, insight.insightId, initialize, dispose]);

	// Claim the handoff and scrub its id from the URL, so a reload lands on a
	// plain workbench rather than a reference to a record that is already gone.
	// Held until initialize() has produced a room, because adoptRun switches
	// away from it and needs the insight bound first.
	const claimedRef = useRef(false);
	useEffect(() => {
		if (!handoffId || claimedRef.current || isInitializing || !roomId) {
			return;
		}
		claimedRef.current = true;

		const handoff = takeAssistantHandoff(handoffId);

		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				next.delete(ASSISTANT_HANDOFF_PARAM);
				return next;
			},
			{ replace: true },
		);

		if (!handoff) {
			return;
		}

		// Most workbenches leave this border collapsed (`activeId: null`), and
		// even the ones that don't can have it closed in a cached layout — so
		// without this the run the user asked for would continue out of sight.
		layoutActions.selectPanel(WORKBENCH_COMPONENTS.ASSISTANT);

		void adoptRun(handoff.roomId, handoff.runId, handoff.prompt);
	}, [
		handoffId,
		isInitializing,
		roomId,
		setSearchParams,
		adoptRun,
		layoutActions,
	]);

	return <AssistantPanel />;
};

/**
 * Shared blueprint every workbench registers for the ASSISTANT panel. Mounts
 * eagerly so the assistant initializes (and can surface notifications) while
 * its border is still collapsed.
 *
 * @name ASSISTANT_PANEL
 */
export const ASSISTANT_PANEL: WorkbenchPanelConfig = {
	name: "Assistant",
	helpText: "Assistant",
	icon: ({ className }) => <MessageSquareIcon className={className} />,
	canClose: false,
	canRename: false,
	// the panel draws its own heading — room title, history, settings, and new
	// conversation — so the shell's border header would stack on top of it
	enableBorderHeader: false,
	mount: "eager",
	content: () => <AssistantView />,
};
