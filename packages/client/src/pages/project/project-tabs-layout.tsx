import { ChevronRight, SquareArrowOutUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useResolvedPath,
} from "react-router-dom";
import type { Role } from "@semoss/shared";
import { AppCatalogAvatar, EntityHeader } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { ProjectAccessRequestButton } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { ShareOverlay } from "@/components/ui";
import { useProject } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface ProjectTabsLayoutProps {
	/** Tabs to show */
	tabs: {
		name: string;
		path: string;
		restrict?: Role[];
	}[];
}

/**
 * Wrap the project routes and render the catalog header + tab navigation
 */
export const ProjectTabsLayout = ({ tabs }: ProjectTabsLayoutProps) => {
	const { catalog, project, permission, refresh } = useProject();

	const navigate = useNavigate();
	const { pathname } = useLocation();
	const resolvedPath = useResolvedPath("");

	const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);

	// see all the visible tabs
	const visibleTabs = useMemo(() => {
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!permission) {
				return false;
			}
			return tab.restrict.includes(permission);
		});
	}, [tabs, permission]);

	// the current active tab index based on the current pathname
	const activeTabIdx = useMemo(() => {
		for (let i = 0; i < visibleTabs.length; i++) {
			const tab = visibleTabs[i];
			const fullPath = tab.path
				? `${resolvedPath.pathname}/${tab.path}`
				: resolvedPath.pathname;
			if (matchPath({ path: fullPath, end: true }, pathname)) {
				return i;
			}
		}
		return -1;
	}, [visibleTabs, resolvedPath, pathname]);

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;

	return (
		<div className="w-full">
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex h-full w-full flex-col justify-center gap-4">
				<div className={`mx-auto flex h-full w-full flex-col gap-3`}>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to={`${catalog.path}`}>
										{catalog.name} Catalog
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<ChevronRight />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage
									title={
										project.project_display_name ||
										project.project_name
									}
								>
									{project.project_display_name ||
										project.project_name}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<EntityHeader
						icon={
							<AppCatalogAvatar
								name={
									project.project_display_name ||
									project.project_name ||
									""
								}
								className="h-full w-full rounded-lg text-xl"
							/>
						}
						name={
							project.project_display_name ||
							project.project_name ||
							""
						}
						id={project.project_id}
						copyLabel="Copy ID"
						idTestId="appDetail-id"
						actions={
							<>
								{permission !== "OWNER" && (
									<ProjectAccessRequestButton
										project={project}
										permission={permission}
										onSuccess={() => {
											refresh();
										}}
									/>
								)}
								{permission !== "DISCOVERABLE" && (
									<Button
										asChild
										variant="default"
										className="gap-2"
										data-testid="appDetail-open-btn"
									>
										<Link
											to={`${catalog.path}/${project.project_id}/view`}
										>
											<SquareArrowOutUpRight className="size-4" />
											Open {catalog.name}
										</Link>
									</Button>
								)}
							</>
						}
					/>
				</div>

				<div className="flex flex-col rounded-lg bg-muted">
					{visibleTabs.length > 0 && (
						<Tabs
							value={activeTab?.path ?? ""}
							className="gap-0 bg-transparent"
						>
							<div className="w-full overflow-x-auto">
								<TabsList className="w-max flex-nowrap gap-2">
									{visibleTabs.map((tab) => (
										<TabsTrigger
											key={tab.name}
											value={tab.path}
											onClick={() => {
												navigate(
													tab.path ? tab.path : ".",
												);
											}}
											data-testid={`appDetail-${tab.name}-tab`}
										>
											{tab.name}
										</TabsTrigger>
									))}
								</TabsList>
							</div>
						</Tabs>
					)}
					<div className="w-full bg-card p-3 md:p-4">
						<Outlet />
					</div>
				</div>
			</div>

			<Dialog
				open={isShareOverlayOpen}
				onOpenChange={(o) => !o && setIsShareOverlayOpen(false)}
			>
				<DialogContent className="max-w-lg p-0">
					<ShareOverlay
						appId={project.project_id}
						diffs={false}
						onClose={() => setIsShareOverlayOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
};
