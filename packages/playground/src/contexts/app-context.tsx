import { createContext } from "react";
import type { AppStore } from "@/stores";

type AppContextProps = {
	app: AppStore;
};

export const AppContext = createContext<AppContextProps | undefined>(undefined);
