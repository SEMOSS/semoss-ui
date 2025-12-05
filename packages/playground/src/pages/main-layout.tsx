import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { GlobalNav } from "@/components/global-nav";
import { Footer } from "@/components/layout/Footer";
import { PlaygroundModal } from "@/components/layout/PlaygroundModal";
import { ChatContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { ChatStore } from "@/stores";

// Styled component replaced with Tailwind classes inline

export const MainLayout = observer(() => {
	const { actions } = useInsight();
	const { root } = useRoot();
	const navigate = useNavigate();
	const location = useLocation();

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		false,
		`sidebar--isOpen`,
	);

	// Get breadcrumb information from current route
	const breadcrumbs = useMemo(() => {
		const path = location.pathname;
		const segments = path.split("/").filter(Boolean);

		// Define route titles
		const routeTitles: Record<string, string> = {
			new: "New Room",
			workspace: "Workspaces",
			room: "Room",
			app: "App",
		};

		const crumbs: Array<{ title: string; path: string }> = [];

		// Build breadcrumbs from path segments
		let currentPath = "";
		segments.forEach((segment) => {
			currentPath += `/${segment}`;

			// Use predefined title or capitalize the segment
			const title =
				routeTitles[segment] ||
				segment.charAt(0).toUpperCase() + segment.slice(1);

			crumbs.push({
				title,
				path: currentPath,
			});
		});

		// If no segments, return Home
		if (crumbs.length === 0) {
			return [{ title: "Home", path: "/" }];
		}

		return crumbs;
	}, [location.pathname]);

	// set up the store
	const chatStore = useMemo(() => {
		const store = new ChatStore(actions);

		// initialize it
		store.initialize();

		return store;
	}, [actions]);

	// listen to navigation from child apps
	useEffect(() => {
		const handleMessage = (event) => {
			const data = event.data;
			if (data?.type === "NAVIGATE_PLAYGROUND" && data?.path) {
				navigate(data?.path, { state: data?.rest });
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [navigate]);

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
					<PlaygroundModal />

					<div
						data-testid="main-layout"
						className="flex h-screen w-full flex-col overflow-hidden"
						style={{
							background:
								"linear-gradient(180deg, #FCFCFC 58.78%, #F6F7FF 81.97%, #F1F8FF 94.04%), var(--base-secondary-background, #FFF)",
							...root.theme.overrides["main-layout"],
						}}
					>
						<div className="flex h-12.5 w-full flex-row items-center px-4">
							<div className="flex flex-row items-center justify-center gap-1.5">
								<SidebarTrigger />
								<Separator
									orientation="vertical"
									style={{ height: "17px" }}
								/>
								<Breadcrumb>
									<BreadcrumbList>
										{breadcrumbs.map((crumb, index) => (
											<>
												{index > 0 && (
													<BreadcrumbSeparator />
												)}
												<BreadcrumbItem
													key={crumb.path}
												>
													<BreadcrumbLink asChild>
														<Link
															to={`${crumb.path}`}
														>
															{crumb.title}
														</Link>
													</BreadcrumbLink>
												</BreadcrumbItem>
											</>
										))}
									</BreadcrumbList>
								</Breadcrumb>
							</div>
							<div className="flex-1" />
						</div>
						<Separator />

						<Outlet />

						<Footer />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ChatContext.Provider>
	);
});
