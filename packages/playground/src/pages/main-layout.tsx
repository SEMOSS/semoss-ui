import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
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
import { GlobalFooter, GlobalNav } from "@/components";
import { GlobalDialog } from "@/components/common/global-dialog";
import { ChatContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { ChatStore } from "@/stores";

export const MainLayout = observer(() => {
	const { actions } = useInsight();
	const { root } = useRoot();

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
													root.breadcrumbs.length - 1;

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
																	{crumb.name}
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
						</div>
						<Separator />
						<div className="w-full flex-1 overflow-hidden">
							<Outlet />
						</div>
						<GlobalFooter />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ChatContext.Provider>
	);
});
