import { createContext, useContext } from "react";
import type { AppDetailsFormTypes, modelledDependency } from "@/components/app";

export type AppDetailPermission = AppDetailsFormTypes["permission"];

export type AppDetailContextType = {
	appId: string;
	appInfo: AppDetailsFormTypes["appInfo"];
	permission: AppDetailPermission;
	dependencies: modelledDependency[];
	tags: string[];
	showNav: boolean;
	fetchUserSpecificData: () => Promise<void> | void;
	openEditDependenciesModal: () => void;
};

export const AppDetailContext = createContext<AppDetailContextType | undefined>(
	undefined,
);

export const useAppDetail = (): AppDetailContextType => {
	const value = useContext(AppDetailContext);
	if (!value) {
		throw new Error(
			"useAppDetail must be used within an AppDetailContext.Provider",
		);
	}
	return value;
};
