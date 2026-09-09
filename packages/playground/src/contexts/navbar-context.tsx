import type { ReactNode } from "react";
import { createContext } from "react";

interface NavbarContextType {
	actions: ReactNode | null;
	setActions: (actions: ReactNode | null) => void;
}

export const NavbarContext = createContext<NavbarContextType | undefined>(
	undefined,
);
