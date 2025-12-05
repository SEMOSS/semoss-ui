import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Separator,
	SidebarTrigger,
} from "@semoss/ui/next";

interface WrappedLayoutProps {
	/** Room to load */
	crumbs: { title: string; path: string }[];
}

export const WrappedLayout: React.FC<WrappedLayoutProps> = observer(
	({ crumbs = [] }) => {
		const navigate = useNavigate();
		const location = useLocation();

		// Get breadcrumb information from current route
		const breadcrumbs = useMemo(() => {
			const path = location.pathname;
			const segments = path.split("/").filter(Boolean);

			if (crumbs.length > 0) {
				return crumbs;
			}

			// Define route titles
			const routeTitles: Record<string, string> = {
				new: "New Room",
				workspace: "Workspaces",
				room: "Room",
				app: "App",
			};

			const defaultCrumbs: Array<{ title: string; path: string }> = [];

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
			if (defaultCrumbs.length === 0) {
				return [{ title: "Home", path: "/" }];
			}

			return defaultCrumbs;
		}, [location.pathname, crumbs]);

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
			<>
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
										{index > 0 && <BreadcrumbSeparator />}
										<BreadcrumbItem key={crumb.path}>
											<BreadcrumbLink asChild>
												<Link to={`${crumb.path}`}>
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
			</>
		);
	},
);
