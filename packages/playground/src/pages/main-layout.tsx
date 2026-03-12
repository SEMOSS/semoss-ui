import { observer } from "mobx-react-lite";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Separator,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useCacheState,
} from "@semoss/ui/next";
import { ChatContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { ChatStore } from "@/stores";

export const MainLayout = observer(() => {
	const { actions, system } = useInsight();
	const { root } = useRoot();
	const theme = root.theme;
	const [navbarActions, setNavbarActions] = useState<ReactNode | null>(null);

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		false,
		`sidebar--isOpen`,
	);

	// set up the store
	const chatStore = useMemo(() => {
		const store = new ChatStore(
			root.theme,
			actions,
			Object.values(system.config.loginDetails ?? {})?.[0],
		);

		// initialize it
		store.initialize();

		return store;
	}, [root.theme, actions, system.config.loginDetails]);

	return (
		<ChatContext.Provider
			value={{
				chat: chatStore,
			}}
		>
				<MainLayoutContent
					isSidebarOpen={isSidebarOpen}
					setIsSidebarOpen={setIsSidebarOpen}
				/>
		</ChatContext.Provider>
	);
});

const MainLayoutContent = observer(
	({
		isSidebarOpen,
		setIsSidebarOpen,
	}: {
		isSidebarOpen: boolean;
		setIsSidebarOpen: (open: boolean) => void;
	}) => {
		const { root } = useRoot();

		return (
						<div className="w-full flex-1 overflow-hidden">
							<Outlet />
						</div>

		);
	},
);
