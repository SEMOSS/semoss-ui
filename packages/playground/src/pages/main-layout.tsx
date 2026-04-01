import { observer } from "mobx-react-lite";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useNavigate,
} from "react-router-dom";
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
import { ChatContext, EmbedPreloadContext, NavbarContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { useNavbar } from "@/hooks/use-navbar";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { ChatStore } from "@/stores";
import { setFavicon } from "@/utility/utils";

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
				<MainLayoutContent
					isSidebarOpen={isSidebarOpen}
					setIsSidebarOpen={setIsSidebarOpen}
				/>
			</NavbarContext.Provider>
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
		const { actions } = useNavbar();
		const navigate = useNavigate();
		const { pathname } = useLocation();

		// Collect sidebar items that should be embedded as iframes
		const embedItems = useMemo(
			() =>
				[
					...(root.theme.sidebar.headerItems ?? []),
					...(root.theme.sidebar.footerItems ?? []),
				].filter((item) => item.embed && item.url),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[root.theme.sidebar.headerItems, root.theme.sidebar.footerItems],
		);

		// Map of path → src; derived immediately so iframes start loading right away.
		const preloadedSrcs = useMemo(
			() =>
				Object.fromEntries(
					embedItems.map((item) => [item.path, item.url]),
				),
			[embedItems],
		);

		useEffect(() => {
			const handleMessage = (event: MessageEvent) => {
				if (event.data?.type === "SMSS_NEW_CHAT") {
					const { workspaceId, knowledgeId } =
						event.data.payload ?? {};
					if (workspaceId) {
						navigate(`/new?workspaceId=${workspaceId}`);
					} else if (knowledgeId) {
						navigate(`/new?knowledgeId=${knowledgeId}`);
					} else {
						navigate(`/new`);
					}
				} else if (event.data?.type === "SMSS_OPEN_ROOM") {
					const { roomId, jobId, prompt } = event.data.payload ?? {};
					if (roomId) {
						const params = new URLSearchParams();
						if (jobId) params.set("jobId", jobId);
						if (prompt) params.set("prompt", prompt);
						const qs = params.toString();
						navigate(
							qs ? `/room/${roomId}?${qs}` : `/room/${roomId}`,
						);
					}
				}
			};
			window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, [navigate]);

		// The set of paths that have been pre-loaded; shared with EmbedPage so
		// it can skip rendering its own duplicate iframe.
		const preloadedPaths = useMemo(
			() => new Set(Object.keys(preloadedSrcs)),
			[preloadedSrcs],
		);

		return (
			<EmbedPreloadContext.Provider value={preloadedPaths}>
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
									{actions ?? null}
								</div>
							</div>
							<Separator />
							<div className="relative w-full flex-1 overflow-hidden">
								<Outlet />
								{embedItems.map((item) => {
									const isActive = !!matchPath(
										`/embed/${item.path}`,
										pathname,
									);
									return (
										<iframe
											key={item.path}
											src={
												preloadedSrcs[item.path] ??
												undefined
											}
											title={item.name}
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
								})}
							</div>
							<GlobalFooter />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</EmbedPreloadContext.Provider>
		);
	},
);
