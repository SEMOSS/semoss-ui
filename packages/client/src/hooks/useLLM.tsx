import { useContext } from "react";
import { LLMContext, type LLMContextType } from "@/contexts";

/**
 * Access the current LLM Context
 * @returns the LLM Context
 */
export function useLLM(): LLMContextType {
	const context = useContext(LLMContext);
	if (context === undefined) {
		throw new Error("useLLM must be used within LLMProvider");
	}

	return context;
}
