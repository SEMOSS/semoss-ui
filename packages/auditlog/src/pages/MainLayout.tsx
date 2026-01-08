import { useMemo } from "react";
import { Outlet } from "react-router-dom";
// import { useInsight } from "@semoss/sdk/react";
// import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
// import { GlobalNav } from "@/components/global-nav";
// import { GlobalTrigger } from "@/components/global-trigger";
import { DashboardContext } from "@/contexts";
import { DashboardStore } from "@/stores";

// Styled component replaced with Tailwind classes inline

export const MainLayout = () => {
	// const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
	// 	false,
	// 	`sidebar--isOpen`,
	// );

	// set up the store
	const dashboardStore = useMemo(() => {
		const store = new DashboardStore();

		// initialize it
		store.initialize({});

		return store;
	}, []);

	return (
		<DashboardContext.Provider
			value={{
				dashboard: dashboardStore,
			}}
		>
			<Outlet />
		</DashboardContext.Provider>
	);
};
