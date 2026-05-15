import { useCallback, useState } from "react";
import {
	buildTokenLimitPayload,
	EMPTY_TOKEN_LIMIT_STATE,
	type TokenLimitServerValues,
	type TokenLimitState,
	tokenLimitStateFromServer,
} from "./token-limit-utils";

export interface UseTokenLimitFieldsReturn {
	state: TokenLimitState;
	setField: (field: keyof TokenLimitState, value: string) => void;
	reset: () => void;
	loadFromServer: (user: TokenLimitServerValues) => void;
	buildPayload: (type: string) => Record<string, unknown>;
	hasAnyLimit: boolean;
}

export function useTokenLimitFields(): UseTokenLimitFieldsReturn {
	const [state, setState] = useState<TokenLimitState>(
		EMPTY_TOKEN_LIMIT_STATE,
	);

	const setField = useCallback(
		(field: keyof TokenLimitState, value: string) =>
			setState((prev) => ({ ...prev, [field]: value })),
		[],
	);

	const reset = useCallback(() => setState(EMPTY_TOKEN_LIMIT_STATE), []);

	const loadFromServer = useCallback(
		(user: TokenLimitServerValues) =>
			setState(tokenLimitStateFromServer(user)),
		[],
	);

	const buildPayload = useCallback(
		(type: string) => buildTokenLimitPayload(type, state),
		[state],
	);

	const hasAnyLimit = !!(
		state.maxTokens ||
		state.maxInputTokens ||
		state.maxOutputTokens ||
		state.maxResponseTime
	);

	return {
		state,
		setField,
		reset,
		loadFromServer,
		buildPayload,
		hasAnyLimit,
	};
}
