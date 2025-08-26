import { ActionMessages, type ListenerActions } from "@semoss/renderer";

export const getDefaultFormValues = (
	message: ActionMessages,
): ListenerActions => {
	const formConfigs = {
		[ActionMessages.RUN_QUERY]: {
			message: ActionMessages.RUN_QUERY,
			payload: { queryId: "" },
		},
		[ActionMessages.RUN_CELL]: {
			message: ActionMessages.RUN_CELL,
			payload: { queryId: "", cellId: "" },
		},
		[ActionMessages.DISPATCH_EVENT]: {
			message: ActionMessages.DISPATCH_EVENT,
			payload: { name: "", detail: {} },
		},
		[ActionMessages.DISPATCH_OUTPUTS_EVENT]: {
			message: ActionMessages.DISPATCH_OUTPUTS_EVENT,
			payload: {},
		},
		[ActionMessages.DISPATCH_OPEN_EVENT]: {
			message: ActionMessages.DISPATCH_OPEN_EVENT,
			payload: { destinationType: "", destination: "" },
		},
		[ActionMessages.COPY_TO_CLIPBOARD]: {
			message: ActionMessages.COPY_TO_CLIPBOARD,
			payload: { text: "" },
		},
	};

	return formConfigs[message] || formConfigs[ActionMessages.RUN_QUERY];
};

export const validateForm = (
	message: ActionMessages,
	payload: Record<string, any>,
): boolean => {
	switch (message) {
		case ActionMessages.RUN_QUERY:
			return !!(payload as { queryId: string }).queryId;
		case ActionMessages.RUN_CELL:
			return (
				!!(payload as { queryId: string; cellId: string }).queryId &&
				!!(payload as { queryId: string; cellId: string }).cellId
			);
		case ActionMessages.DISPATCH_EVENT:
			return !!(payload as { name: string }).name;
		case ActionMessages.DISPATCH_OPEN_EVENT:
			return (
				!!(payload as { destinationType: string; destination: string })
					.destinationType &&
				!!(payload as { destinationType: string; destination: string })
					.destination
			);
		case ActionMessages.COPY_TO_CLIPBOARD:
			return !!(payload as { text: string }).text;
		case ActionMessages.DISPATCH_OUTPUTS_EVENT:
			return true;
		default:
			return false;
	}
};
