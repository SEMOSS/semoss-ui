import { useContext } from "react";
import { AppContext } from "@/contexts";

export const useApp = () => {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error("useApp must be used within AppContext.Provider");
	}

	return context;
};
