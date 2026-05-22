import { createContext, useContext } from "react";

export type GuardrailSelectorControlsContextType = {
	hasMoreGuardrails: boolean;
	isLoadingMoreGuardrails: boolean;
	onLoadMoreGuardrails: () => void;
	searchGuardrailsByTerm: (searchTerm: string) => Promise<unknown[]>;
};

export const GuardrailSelectorControlsContext =
	createContext<GuardrailSelectorControlsContextType | undefined>(undefined);

export const useGuardrailSelectorControls = () => {
	const context = useContext(GuardrailSelectorControlsContext);
	if (context === undefined) {
		throw new Error(
			"useGuardrailSelectorControls must be used within GuardrailSelectorControlsContext.Provider",
		);
	}

	return context;
};
