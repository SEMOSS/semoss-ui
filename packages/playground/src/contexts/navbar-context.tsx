import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

interface NavbarContextType {
	actions: ReactNode | null;
	setActions: (actions: ReactNode | null) => void;
}

export const NavbarContext = createContext<NavbarContextType | undefined>(
	undefined,
);

export const NavbarProvider = ({ children }: { children: ReactNode }) => {
	const [actions, setActions] = useState<ReactNode | null>(null);

	return (
		<NavbarContext.Provider value={{ actions, setActions }}>
			{children}
		</NavbarContext.Provider>
	);
};

export const useNavbar = (): NavbarContextType => {
	const context = useContext(NavbarContext);
	if (!context) {
		throw new Error("useNavbar must be used within NavbarProvider");
	}
	return context;
};
