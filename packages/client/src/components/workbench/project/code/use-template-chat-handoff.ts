import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { useWorkbench } from "@/hooks";
import { isTemplateChatHandoffState } from "@/types/template-chat.types";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";

/**
 * Consume a template catalog handoff and submit its prompt exactly once.
 * The router state is removed before asynchronous work starts so refreshing
 * or remounting the destination cannot replay the prompt.
 */
export const useTemplateChatHandoff = (): void => {
	const insight = useInsight();
	const location = useLocation();
	const navigate = useNavigate();
	const handledRef = useRef(false);
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const initialize = useWorkbench((state) => state.assistant.initialize);
	const setAgent = useWorkbench((state) => state.assistant.setAgent);
	const setDraft = useWorkbench((state) => state.assistant.setDraft);
	const submit = useWorkbench((state) => state.assistant.submit);

	useEffect(() => {
		if (
			!insight.isReady ||
			!insight.insightId ||
			!isTemplateChatHandoffState(location.state)
		) {
			return;
		}

		const handoff = location.state;
		let disposed = false;
		const runHandoff = async () => {
			await Promise.resolve();
			if (disposed || handledRef.current) {
				return;
			}

			handledRef.current = true;
			setDraft(handoff.prompt);
			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.ASSISTANT,
				{},
				{ target: { kind: "border", side: "right" } },
			);
			navigate(`${location.pathname}${location.search}${location.hash}`, {
				replace: true,
				state: null,
			});

			await initialize(insight.insightId);
			setAgent(handoff.agent);
			const submitted = await submit(handoff.prompt);
			if (submitted) {
				setDraft("");
			}
		};

		void runHandoff();
		return () => {
			disposed = true;
		};
	}, [
		initialize,
		insight.insightId,
		insight.isReady,
		layoutActions,
		location.hash,
		location.pathname,
		location.search,
		location.state,
		navigate,
		setAgent,
		setDraft,
		submit,
	]);
};
