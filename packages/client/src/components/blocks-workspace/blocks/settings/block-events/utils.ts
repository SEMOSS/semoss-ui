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
		[ActionMessages.DISPATCH_OPEN_EVENT]: {
			message: ActionMessages.DISPATCH_OPEN_EVENT,
			payload: { destinationType: "", destination: "" },
		},
		[ActionMessages.MODIFY_VARIABLE]: {
			message: ActionMessages.DISPATCH_OPEN_EVENT,
			payload: { blockId: "", variable: "", value: "" },
		},
	};

	return formConfigs[message] || formConfigs[ActionMessages.RUN_QUERY];
};

export const validateForm = (
	message: ActionMessages,
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Fix
	payload: any,
): boolean => {
	switch (message) {
		case ActionMessages.RUN_QUERY:
			return !!payload.queryId;
		case ActionMessages.RUN_CELL:
			return !!payload.queryId && !!payload.cellId;
		case ActionMessages.DISPATCH_EVENT:
			return !!payload.name;
		case ActionMessages.DISPATCH_OPEN_EVENT:
			return !!payload.destinationType && !!payload.destination;
		case ActionMessages.MODIFY_VARIABLE:
			return !!payload.variable && !!payload.value;
		default:
			return false;
	}
};
