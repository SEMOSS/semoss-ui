import { type ReactNode, useContext } from "react";
import { NavbarContext } from "@/contexts";

interface NavbarContextType {
	actions: ReactNode | null;
	setActions: (actions: ReactNode | null) => void;
}
export const useNavbar = (): NavbarContextType => {
	const context = useContext(NavbarContext) as NavbarContextType | undefined;
	if (!context) {
		throw new Error("useNavbar must be used within NavbarProvider");
	}
	return context;
};
