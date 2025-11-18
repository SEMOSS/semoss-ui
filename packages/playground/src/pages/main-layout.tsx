import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
import { GlobalNav } from "@/components/global-nav";
import { GlobalTrigger } from "@/components/global-trigger";
import { ChatContext } from "@/contexts";
import { useCacheState } from "@/hooks";
import { ChatStore } from "@/stores";

// Styled component replaced with Tailwind classes inline

export const MainLayout = () => {
	const { actions } = useInsight();

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		false,
		`sidebar--isOpen`,
	);

	// set up the store
	const chatStore = useMemo(() => {
		const store = new ChatStore(actions);

		// initialize it
		store.initialize();

		return store;
	}, [actions]);

	return (
		<ChatContext.Provider
			value={{
				chat: chatStore,
			}}
		>
			<SidebarProvider
				open={isSidebarOpen}
				onOpenChange={setIsSidebarOpen}
				style={
					{
						"--sidebar-width": "19rem",
						"--sidebar-width-mobile": "19rem",
					} as React.CSSProperties
				}
			>
				<GlobalNav />
				<SidebarInset>
					<GlobalTrigger />
					<div className="h-[calc(100vh-theme(space.2))] w-full overflow-hidden">
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ChatContext.Provider>
	);
};
