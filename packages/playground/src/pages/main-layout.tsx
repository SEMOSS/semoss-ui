import { observer } from "mobx-react-lite";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
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
import { GlobalFooter, GlobalNav } from "@/components";
import { GlobalDialog } from "@/components/common/global-dialog";
import { ChatContext, NavbarContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { ChatStore } from "@/stores";
import { setFavicon } from "@/utility/utils";

export const MainLayout = observer(() => {
	const { actions, system } = useInsight();
	const { root } = useRoot();
	const theme = root.theme;
	const [navbarActions, setNavbarActions] = useState<ReactNode | null>(null);
	const { pathname } = useLocation();

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		theme.sidebar.expandedByDefault,
		`sidebar--isOpen`,
	);

	// set up the chat store
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

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	return (
		<ChatContext.Provider
			value={{
				chat: chatStore,
			}}
		>
			<NavbarContext.Provider
				value={{ actions: navbarActions, setActions: setNavbarActions }}
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
					<SidebarInset className="m-0! shadow-none">
						<GlobalDialog />
						<div
							data-testid="main-layout"
							className="flex h-screen w-full flex-col overflow-hidden"
							style={{
								background:
									"linear-gradient(180deg, #FCFCFC 58.78%, #F6F7FF 81.97%, #F1F8FF 94.04%), var(--base-secondary-background, #FFF)",
								...root.theme.overrides["main-layout"],
							}}
						>
							<div className="flex h-12.5 w-full shrink-0 flex-row items-center px-4">
								<div className="flex flex-row items-center justify-center gap-1.5">
									<SidebarTrigger />
									<Separator
										orientation="vertical"
										style={{ height: "17px" }}
									/>
									<Breadcrumb>
										<BreadcrumbList>
											{root.breadcrumbs.map(
												(crumb, index) => {
													const isLast =
														index ===
														root.breadcrumbs
															.length -
															1;

													return (
														<React.Fragment
															key={crumb.path}
														>
															<BreadcrumbItem>
																<BreadcrumbLink
																	className={
																		isLast
																			? "text-foreground"
																			: ""
																	}
																	asChild
																>
																	<Link
																		to={`${crumb.path}`}
																	>
																		{
																			crumb.name
																		}
																	</Link>
																</BreadcrumbLink>
															</BreadcrumbItem>
															{!isLast && (
																<BreadcrumbSeparator />
															)}
														</React.Fragment>
													);
												},
											)}
										</BreadcrumbList>
									</Breadcrumb>
								</div>
								<div className="flex-1" />
								<div className="flex items-center gap-2">
									{navbarActions ?? null}
								</div>
							</div>
							<Separator />
							<div className="relative w-full flex-1 overflow-hidden">
								<Outlet />
								{Object.values(chatStore.embeddedPageMap).map(
									(item) => {
										const isActive = matchPath(
											`/embed/${item.path}`,
											pathname,
										);
										return (
											<iframe
												key={item.path}
												src={item.url}
												title={item.path}
												className="absolute inset-0 h-full w-full border-none"
												// @ts-expect-error fetchpriority is not yet in React's typings
												fetchpriority="high"
												style={{
													opacity: isActive ? 1 : 0,
													pointerEvents: isActive
														? "auto"
														: "none",
												}}
											/>
										);
									},
								)}
							</div>
							<GlobalFooter />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</NavbarContext.Provider>
		</ChatContext.Provider>
	);
});
