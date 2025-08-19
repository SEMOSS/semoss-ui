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
		[ActionMessages.SET_DATA_VARIABLE]: {
			message: ActionMessages.SET_DATA_VARIABLE,
			payload: { id: ""},
		},
	};

	return formConfigs[message] || formConfigs[ActionMessages.RUN_QUERY];
};

export const validateForm = (
	message: ActionMessages,
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
		case ActionMessages.DISPATCH_OUTPUTS_EVENT:
			return true;
		case ActionMessages.SET_DATA_VARIABLE:
			return !!payload.id;
		default:
			return false;
	}
};
