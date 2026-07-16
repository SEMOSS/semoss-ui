import { ChevronRight, Pencil, SquareArrowOutUpRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
	Link,
	matchPath,
	Navigate,
	Outlet,
	useLocation,
	useParams,
	useResolvedPath,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Project, ProjectDependency, Role } from "@semoss/shared";
import { AppCatalogAvatar, EntityHeader } from "@semoss/shared";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import {
	EditProjectDetailDialog,
	ProjectAccessRequestButton,
	ProjectExportButton,
} from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { ShareOverlay } from "@/components/ui";
import { ProjectContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { getTagBadgeStyle, normalizeTagArray } from "@/utility";
import { formatDateToLocal } from "@/utility/date";

const DETAIL_CONFIG = {
	CODE: {
		name: "App",
		basePath: "/app",
	},
	SKILL: {
		name: "Skill",
		basePath: "/skill",
	},
	WORKSPACE: {
		name: "Agent",
		basePath: "/agent",
	},
} as const;

interface ProjectDetailLayoutProps {
	/** Type of the route */
	type: Project["project_type"];

	/** Tabs to show */
	tabs: {
		name: string;
		path: string;
		restrict?: Role[];
	}[];
}

export const ProjectDetailLayout = ({
	type,
	tabs,
}: ProjectDetailLayoutProps) => {
	const config = DETAIL_CONFIG[type as keyof typeof DETAIL_CONFIG];
	const { appId } = useParams();

	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const resolvedPath = useResolvedPath("");

	const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
	const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);

	// get a user's permission
	const getUserEnginePermission = useAPI(
		appId ? ["getUserProjectPermission", appId] : null,
		{
			data: undefined,
		},
	);

	// get dependencies for the project
	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[];
	}>(appId ? `GetProjectDependencies(project=["${appId}"]);` : "");

	// get the metadata for the project
	const getMetadata = usePixel<Project>(
		appId
			? `GetProjectMetadata(project=["${appId}"], metaKeys=${JSON.stringify(
					configStore.store.config.projectMetaKeys
						.filter((k) => {
							return (
								k.metakey !== "description" &&
								k.metakey !== "markdown" &&
								k.metakey !== "tag" &&
								k.metakey !== "tags"
							);
						})
						.map((k) => {
							return k.metakey;
						}),
				)});`
			: "",
	);

	/**
	 * Refresh the project data
	 */
	const refresh = useCallback(async () => {
		getDependencies.refresh();
		getUserEnginePermission.refresh();
		getMetadata.refresh();
	}, [
		getDependencies.refresh,
		getUserEnginePermission.refresh,
		getMetadata.refresh,
	]);

	const tags = useMemo(
		() => normalizeTagArray(getMetadata.data?.tag),
		[getMetadata.data?.tag],
	);

	// see all the visible tabs
	const visibleTabs = useMemo(() => {
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!getUserEnginePermission.data) {
				return false;
			}
			return tab.restrict.includes(getUserEnginePermission.data);
		});
	}, [tabs, getUserEnginePermission.data]);

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

	if (
		getUserEnginePermission.status === "ERROR" ||
		getDependencies.status === "ERROR" ||
		getMetadata.status === "ERROR"
	) {
		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<ResourceNotFound path="/app" />
			</>
		);
	}

	if (
		getUserEnginePermission.status !== "SUCCESS" ||
		!getUserEnginePermission.data ||
		getDependencies.status !== "SUCCESS" ||
		getMetadata.status !== "SUCCESS"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// if there is no appId in the URL params, redirect to the parent route
	if (!appId) {
		return <Navigate to=".." replace />;
	}

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;

	return (
		<ProjectContext.Provider
			value={{
				appId: getMetadata.data.project_id || "",
				project: getMetadata.data,
				permission: getUserEnginePermission.data,
				dependencies: getDependencies.data?.engines || [],
				tags,
				refresh,
			}}
		>
			<div className="w-full">
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<div className="flex h-full w-full flex-col justify-center gap-4">
					<div
						className={`mx-auto flex h-full w-full flex-col gap-3`}
					>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link
											to={`${config.basePath}`}
											className="inline-flex items-center text-inherit leading-none"
										>
											{config.name} Catalog
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="inline-flex items-center [&>svg]:translate-y-[0.5px]">
									<ChevronRight />
								</BreadcrumbSeparator>
								<BreadcrumbItem>
									<BreadcrumbPage className="inline-flex items-center leading-none">
										<span
											title={
												getMetadata.data
													?.project_display_name ||
												getMetadata.data?.project_name
											}
											className="inline-block max-w-[40ch] truncate text-ellipsis leading-none"
										>
											{getMetadata.data
												?.project_display_name ||
												getMetadata.data?.project_name}
										</span>
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
						<EntityHeader
							icon={
								<AppCatalogAvatar
									name={
										getMetadata.data
											?.project_display_name ||
										getMetadata.data?.project_name ||
										""
									}
									className="h-full w-full rounded-lg text-xl"
								/>
							}
							name={
								getMetadata.data?.project_display_name ||
								getMetadata.data?.project_name ||
								""
							}
							id={appId}
							copyLabel="Copy App ID"
							idTestId="appDetail-id"
							actions={
								<>
									{getUserEnginePermission.data ===
									"OWNER" ? (
										<ProjectExportButton
											project={getMetadata.data}
										/>
									) : (
										<ProjectAccessRequestButton
											project={getMetadata.data}
											permission={
												getUserEnginePermission.data
											}
											onSuccess={() => {
												refresh();
											}}
										/>
									)}
									{getUserEnginePermission.data !==
										"DISCOVERABLE" &&
										getUserEnginePermission.data !==
											"READ_ONLY" && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														aria-label="Edit"
														onClick={() => {
															setIsEditDetailsModalOpen(
																true,
															);
														}}
														data-testid="appDetail-edit-btn"
													>
														<Pencil className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Edit
												</TooltipContent>
											</Tooltip>
										)}
									{getUserEnginePermission.data !==
										"DISCOVERABLE" && (
										<Button
											asChild
											variant="default"
											className="gap-2"
											data-testid="appDetail-open-btn"
										>
											<Link
												to={`${config.basePath}/${appId}/view`}
											>
												<SquareArrowOutUpRight className="size-4" />
												Open {config.name}
											</Link>
										</Button>
									)}
								</>
							}
						/>

						<div className="mt-4 flex w-full flex-col gap-4 md:flex-row md:justify-between">
							<div className="flex flex-1 flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									{getMetadata.data?.description ||
										"No description available"}
								</p>
								{tags?.length ? (
									<div className="flex flex-row flex-wrap gap-2 pb-2">
										{tags.map((tag) => {
											if (!tag) return null;
											return (
												<Badge
													key={`tag-${tag}-${tag}`}
													variant="outline"
													style={getTagBadgeStyle(
														tag,
													)}
												>
													{tag}
												</Badge>
											);
										})}
									</div>
								) : null}
							</div>
							<div className="flex flex-col items-start gap-1 text-left text-muted-foreground text-sm md:items-end md:text-right">
								<span>
									Published by:{" "}
									{getMetadata.data?.project_created_by ||
										"Unknown"}
								</span>
								<span>
									Updated{" "}
									{getMetadata.data?.project_date_created
										? formatDateToLocal(
												getMetadata.data
													?.project_date_created,
											)
										: "N/A"}
								</span>
							</div>
						</div>
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
														tab.path
															? tab.path
															: ".",
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
							appId={appId || ""}
							diffs={false}
							onClose={() => setIsShareOverlayOpen(false)}
						/>
					</DialogContent>
				</Dialog>

				<EditProjectDetailDialog
					open={isEditDetailsModalOpen}
					project={getMetadata.data}
					onClose={(success) => {
						if (success) {
							refresh();
						}

						setIsEditDetailsModalOpen(false);
					}}
				/>
			</div>
		</ProjectContext.Provider>
	);
};
