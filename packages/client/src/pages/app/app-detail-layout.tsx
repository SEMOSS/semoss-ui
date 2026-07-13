import {
	ChevronRight,
	Download,
	LockKeyhole,
	Pencil,
	RefreshCcw,
	SquareArrowOutUpRight,
} from "lucide-react";
import {
	createElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useParams,
	useResolvedPath,
	useSearchParams,
} from "react-router-dom";
import {
	AppCatalogAvatar,
	EntityHeader,
	getUserProjectPermission,
} from "@semoss/shared";
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
	toast,
} from "@semoss/ui/next";
import { uploadImage } from "@/api";
import {
	type appDependency,
	ChangeAccessModal,
	type DetailsForm,
	determineUserPermission,
	EditDependenciesModal,
	EditDetailsModal,
	fetchAppInfo,
	fetchDependencies,
	fetchMainUses,
	type modelledDependency,
} from "@/components/app";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { ShareOverlay } from "@/components/ui";
import { AppDetailContext, type AppDetailContextType } from "@/contexts";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import type { Role } from "@/types";
import { getTagBadgeStyle } from "@/utility";
import { AppAccessControlPage } from "./app-access-control-page";
import { AppActivityPage } from "./app-activity-page";
import { AppCommitsPage } from "./app-commits-page";
import { AppDependenciesPage } from "./app-dependencies-page";
import { AppFilesPage } from "./app-files-page";
import { AppGithubPage } from "./app-github-page";
import { AppMcpUsagePage } from "./app-mcp-usage-page";
import { AppOverviewPage } from "./app-overview-page";
import { AppSettingsPage } from "./app-settings-page";
import { AppSmssPage } from "./app-smss-page";

const DEFAULT_DETAILS_FORM: DetailsForm = {
	markdown: "",
	tag: [],
	appImage: "",
};

type ProjectInfo = {
	project_display_name?: string;
	project_name?: string;
	description?: string;
	project_created_by?: string;
	project_date_created?: string;
	[key: string]: unknown;
};

const EMBEDDED_TAB_COMPONENTS: Record<string, React.FunctionComponent> = {
	"": AppOverviewPage,
	dependencies: AppDependenciesPage,
	"mcp-usage": AppMcpUsagePage,
	activity: AppActivityPage,
	commits: AppCommitsPage,
	github: AppGithubPage,
	settings: AppSettingsPage,
	"access-control": AppAccessControlPage,
	files: AppFilesPage,
	smss: AppSmssPage,
};

const modelDependencies = (
	dependencies: appDependency[],
): modelledDependency[] => {
	return dependencies.map((dep: appDependency) => ({
		name: dep.engine_name ? dep.engine_name.replace(/_/g, " ") : "",
		id: dep.engine_id,
		type: dep.engine_type,
		subtype: dep.engine_subtype,
		userPermission: dep.permission_name as Role,
		isPublic: !!dep.engine_global,
		isDiscoverable: !!dep.engine_discoverable,
		description: dep.description || "",
		access_permission: dep.access_permission || 0,
		can_view_dependencies: dep.can_view_dependencies,
	}));
};

interface ProjectDetailLayoutProps {
	tabs: {
		name: string;
		path: string;
		restrict?: Role[];
	}[];
	embedded?: boolean;
	showNav?: boolean;
}

export const ProjectDetailLayout = ({
	tabs,
	embedded = false,
	showNav = true,
}: ProjectDetailLayoutProps) => {
	const [appInfo, setAppInfo] = useState<ProjectInfo | null>(null);
	const [userRole, setUserRole] = useState<Role | "">("");
	const [permission, setPermission] = useState<
		"author" | "editor" | "readOnly" | "discoverable" | ""
	>("");
	const [requestedPermission, setRequestedPermission] = useState<
		"OWNER" | "EDIT" | "READ_ONLY" | ""
	>("");
	const [roleChangeComment, setRoleChangeComment] = useState("");
	const [dependencies, setDependencies] = useState<modelledDependency[]>([]);
	const [detailsForm, setDetailsForm] =
		useState<DetailsForm>(DEFAULT_DETAILS_FORM);
	const [savedDetailsForm, setSavedDetailsForm] =
		useState<DetailsForm>(DEFAULT_DETAILS_FORM);

	const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
	const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
		useState(false);
	const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
	const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
		useState(false);
	const [responseStatus, setResponseStatus] = useState(false);
	const [pendingRequest, setPendingRequest] = useState(false);
	const [permissionError, setPermissionError] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [selectedTabName, setSelectedTabName] = useState("Overview");

	const tags = useMemo(() => {
		if (Array.isArray(detailsForm.tag)) {
			return detailsForm.tag;
		}
		if (typeof detailsForm.tag === "string" && detailsForm.tag) {
			return [detailsForm.tag];
		}
		return [];
	}, [detailsForm.tag]);

	const { monolithStore, configStore } = useRootStore();
	const { appId } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const tabQueryParam = searchParams.get("tab");
	const { pathname } = useLocation();
	const resolvedPath = useResolvedPath("");

	const emitMessage = useCallback((isError: boolean, message: string) => {
		if (isError) toast.error(message);
		else toast.success(message);
	}, []);

	const mapRequestedPermission = useCallback(
		(nextPermission: "author" | "editor" | "readOnly" | "discoverable") => {
			if (nextPermission === "author") return "OWNER";
			if (nextPermission === "editor") return "EDIT";
			return "READ_ONLY";
		},
		[],
	);

	const getPermission = useCallback(async () => {
		try {
			if (!appId) return null;
			const role = await getUserProjectPermission(appId);
			setUserRole(role);
			const nextPermission = determineUserPermission(role);
			setPermission(nextPermission);
			if (nextPermission) {
				setRequestedPermission(mapRequestedPermission(nextPermission));
			}
			return nextPermission;
		} catch {
			setPermissionError(true);
			return null;
		}
	}, [appId, mapRequestedPermission]);

	const fetchUserSpecificData = useCallback(async () => {
		await getPermission();
	}, [getPermission]);

	const fetchAppData = useCallback(
		async (id: string) => {
			const currentPermission = await getPermission();
			const promises = [
				fetchAppInfo(
					monolithStore,
					id,
					configStore.store.config.projectMetaKeys.map(
						(a) => a.metakey,
					),
				),
				fetchMainUses(monolithStore, id),
			];

			if (currentPermission !== "discoverable") {
				promises.push(fetchDependencies(configStore, id));
			}

			const results = await Promise.allSettled(promises);
			results.forEach((res, idx) => {
				if (res.status === "rejected") {
					emitMessage(true, res.reason);
					return;
				}

				if (idx === 0) {
					if (res.value.type === "error") {
						emitMessage(true, res.value.output);
						return;
					}

					setAppInfo(res.value.output as ProjectInfo);
					const output = res.value.output;
					const projectMetaKeys =
						configStore.store.config.projectMetaKeys;
					const parsedMeta = projectMetaKeys
						.map((k) => k.metakey)
						.reduce((prev, curr) => {
							const found = projectMetaKeys.find(
								(obj) => obj.metakey === curr,
							);
							if (!found) return prev;

							if (curr === "tag") {
								if (typeof output[curr] === "string") {
									prev[curr] = [output[curr]];
								} else {
									prev[curr] = output[curr];
								}
							} else if (
								found.display_options === "single-typeahead" ||
								found.display_options === "select-box" ||
								found.display_options === "multi-typeahead"
							) {
								if (typeof output[curr] === "string") {
									prev[curr] = [output[curr]];
								} else {
									prev[curr] = output[curr];
								}
							} else {
								prev[curr] = output[curr];
							}

							return prev;
						}, {} as DetailsForm);

					const nextDetails = {
						...parsedMeta,
						markdown: parsedMeta.markdown || "",
					};
					setDetailsForm(nextDetails);
					setSavedDetailsForm(nextDetails);
					return;
				}

				if (idx === 1) {
					if (res.value.type === "error") {
						emitMessage(true, res.value.output);
						return;
					}
					if (res.value.output !== null) {
						setDetailsForm((prev) => ({
							...prev,
							markdown: res.value.output || "",
						}));
						setSavedDetailsForm((prev) => ({
							...prev,
							markdown: res.value.output || "",
						}));
					}
					return;
				}

				if (idx === 2) {
					if (res.value.type === "error") {
						emitMessage(true, res.value.output);
						return;
					}
					setDependencies(modelDependencies(res.value.output));
				}
			});
		},
		[configStore, emitMessage, getPermission, monolithStore],
	);

	useEffect(() => {
		setSelectedTabName("Overview");
		setPermissionError(false);
		fetchUserSpecificData();
		if (appId) {
			fetchAppData(appId);
		}
	}, [appId, fetchAppData, fetchUserSpecificData]);

	useEffect(() => {
		if (!appId) return;
		const requested = `GetProjectUserAccessRequest(project='${appId}', isSpecificUser=true)`;
		monolithStore
			.runQuery(requested)
			.then((response) => {
				const output = response?.pixelReturn?.[0]?.output;
				if (Array.isArray(output) && output.length > 0) {
					setPendingRequest(true);
				} else {
					setPendingRequest(false);
				}
			})
			.catch(() => {
				setPendingRequest(false);
			});
	}, [appId, monolithStore]);

	useEffect(() => {
		if (tabQueryParam !== "accesscontrol") return;
		if (embedded) {
			setSelectedTabName("Access Control");
		} else if (appId) {
			navigate(`/app/${appId}/access-control`, { replace: true });
		}
	}, [tabQueryParam, embedded, appId, navigate]);

	const handleCloseChangeAccessModal = (refresh?: boolean) => {
		if (refresh) {
			getPermission();
		} else if (permission) {
			setRequestedPermission(mapRequestedPermission(permission));
		}
		setIsChangeAccessModalOpen(false);
	};

	const handleCloseEditDetailsModal = (isReset?: boolean) => {
		if (isReset) {
			setDetailsForm(savedDetailsForm);
		}
		setIsEditDetailsModalOpen(false);
	};

	const exportApp = () => {
		setExportLoading(true);
		const pixel = `ExportProjectApp(project=["${appId}"]);`;
		monolithStore
			.runQuery(pixel)
			.then((response) => {
				const output = response.pixelReturn[0].output;
				const insightId = response.insightId;
				monolithStore.download(insightId, output as string);
			})
			.finally(() => {
				setExportLoading(false);
			});
	};

	const handleCloseDependenciesModal = async (refreshData: boolean) => {
		if (refreshData && appId) {
			const res = await fetchDependencies(configStore, appId);
			if (res.type === "success") {
				setDependencies(modelDependencies(res.output));
			} else {
				toast.error(res.output);
			}
		}
		setIsEditDependenciesModalOpen(false);
	};

	const onSubmit = () => {
		const meta = {} as DetailsForm;
		let imageMeta: File | File[] | undefined;

		for (const key in detailsForm) {
			if (detailsForm[key] !== undefined && key !== "appImage") {
				meta[key] = detailsForm[key];
			}
			if (key === "appImage") {
				imageMeta = detailsForm[key] as File | File[];
			}
		}

		if (Object.keys(meta).length === 0) {
			toast.info("Nothing to Save");
			return;
		}

		monolithStore
			.runQuery(
				`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
					meta,
				)}])`,
			)
			.then(async (response) => {
				const { output, additionalOutput, operationType } =
					response.pixelReturn[0];

				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output as string);
					return;
				}

				const filesToUpload = Array.isArray(imageMeta)
					? imageMeta
					: imageMeta instanceof File
						? [imageMeta]
						: [];

				if (filesToUpload.length > 0 && appId) {
					await uploadImage(
						filesToUpload,
						appId,
						configStore.store.insightID,
					);
				}

				toast.success(additionalOutput[0].output);
				if (appId) {
					fetchAppData(appId);
				}
				handleCloseEditDetailsModal();
			})
			.catch((error) => {
				toast.error(error.message);
			});
	};

	const handleAccessRequested = () => {
		setResponseStatus(true);
	};

	const visibleTabs = useMemo(() => {
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!userRole) {
				return false;
			}
			return tab.restrict.includes(userRole);
		});
	}, [tabs, userRole]);

	const activeTabIdx = useMemo(() => {
		if (embedded) {
			const idx = visibleTabs.findIndex(
				(t) => t.name === selectedTabName,
			);
			return idx >= 0 ? idx : 0;
		}
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
	}, [embedded, selectedTabName, visibleTabs, resolvedPath, pathname]);

	const contextValue: AppDetailContextType = useMemo(
		() => ({
			appId: appId || "",
			appInfo,
			permission,
			dependencies,
			tags,
			showNav,
			fetchUserSpecificData,
			openEditDependenciesModal: () =>
				setIsEditDependenciesModalOpen(true),
		}),
		[
			appId,
			appInfo,
			permission,
			dependencies,
			tags,
			showNav,
			fetchUserSpecificData,
		],
	);

	if (permissionError) {
		return (
			<>
				{showNav && (
					<NavbarLeft>
						<NavbarHeader />
					</NavbarLeft>
				)}
				<ResourceNotFound path="/app" />
			</>
		);
	}

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;
	const embeddedComponent = activeTab
		? EMBEDDED_TAB_COMPONENTS[activeTab.path]
		: undefined;

	return (
		<AppDetailContext.Provider value={contextValue}>
			<div className="w-full">
				{showNav && (
					<NavbarLeft>
						<NavbarHeader />
					</NavbarLeft>
				)}
				<div
					className={`h-full w-full ${
						showNav
							? "flex flex-col justify-center gap-4"
							: "m-2 p-5"
					}`}
				>
					<div
						className={`flex h-full w-full flex-col gap-3 ${
							showNav ? "mx-auto w-full" : ""
						}`}
					>
						{showNav && (
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbLink asChild>
											<Link
												to={"/app"}
												className="inline-flex items-center text-inherit leading-none"
											>
												App Catalog
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
													appInfo?.project_display_name ||
													appInfo?.project_name
												}
												className="inline-block max-w-[40ch] truncate text-ellipsis leading-none"
											>
												{appInfo?.project_display_name ||
													appInfo?.project_name}
											</span>
										</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						)}

						<EntityHeader
							icon={
								<AppCatalogAvatar
									name={
										appInfo?.project_display_name ||
										appInfo?.project_name ||
										"App"
									}
									className="h-full w-full rounded-lg text-xl"
								/>
							}
							name={
								appInfo?.project_display_name ||
								appInfo?.project_name ||
								""
							}
							id={appId}
							copyLabel="Copy App ID"
							idTestId="appDetail-id"
							actions={
								<>
									{permission === "author" ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													disabled={exportLoading}
													variant="outline"
													size="icon"
													aria-label="Export"
													onClick={() => exportApp()}
													data-testid={
														"appDetail-export-btn"
													}
												>
													{exportLoading ? (
														<Spinner className="size-4" />
													) : (
														<Download className="size-4" />
													)}
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Export
											</TooltipContent>
										</Tooltip>
									) : (
										<Button
											disabled={
												responseStatus || pendingRequest
											}
											variant={
												responseStatus
													? "outline"
													: permission ===
															"discoverable"
														? "default"
														: "outline"
											}
											className="gap-2"
											onClick={() => {
												const appName =
													appInfo?.project_display_name ||
													appInfo?.project_name ||
													"this app";
												setRequestedPermission(
													"READ_ONLY",
												);
												setRoleChangeComment(
													`I am requesting access to ${appName} for [please provide a reason]`,
												);
												setIsChangeAccessModalOpen(
													true,
												);
											}}
											data-testid={"appDetail-access-btn"}
										>
											{responseStatus ? (
												<RefreshCcw className="size-4" />
											) : permission ===
												"discoverable" ? (
												<LockKeyhole className="size-4" />
											) : null}
											{responseStatus || pendingRequest
												? "Pending Access"
												: permission === "discoverable"
													? "Request Access"
													: "Change Access"}
										</Button>
									)}
									{permission !== "discoverable" &&
										permission !== "readOnly" && (
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
									{permission !== "discoverable" &&
										showNav && (
											<Button
												asChild
												variant="default"
												className="gap-2"
												data-testid="appDetail-open-btn"
											>
												<Link to={`/app/${appId}/view`}>
													<SquareArrowOutUpRight className="size-4" />
													Open App
												</Link>
											</Button>
										)}
								</>
							}
						/>

						<div className="mt-4 flex w-full flex-col gap-4 md:flex-row md:justify-between">
							<div className="flex flex-1 flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									{appInfo?.description ||
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
									{appInfo?.project_created_by || "Unknown"}
								</span>
								<span>
									Updated{" "}
									{appInfo?.project_date_created
										? new Date(
												appInfo?.project_date_created,
											).toLocaleString("en-US", {
												month: "long",
												day: "2-digit",
												year: "numeric",
												hour: "numeric",
												minute: "2-digit",
												hour12: true,
											})
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
													if (embedded) {
														setSelectedTabName(
															tab.name,
														);
														return;
													}
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
							{embedded ? (
								embeddedComponent ? (
									createElement(embeddedComponent, {})
								) : null
							) : (
								<Outlet />
							)}
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

				<ChangeAccessModal
					open={isChangeAccessModalOpen}
					onClose={handleCloseChangeAccessModal}
					appId={appId || ""}
					requestedPermission={requestedPermission}
					roleChangeComment={roleChangeComment}
					onRequestedPermissionChange={setRequestedPermission}
					onRoleChangeCommentChange={setRoleChangeComment}
					dependencies={dependencies}
					onSuccess={handleAccessRequested}
					permission={permission}
				/>

				<EditDetailsModal
					isOpen={isEditDetailsModalOpen}
					onClose={handleCloseEditDetailsModal}
					detailsForm={detailsForm}
					onDetailsFormChange={(updater) => {
						setDetailsForm((prev) => updater(prev));
					}}
					onSubmit={onSubmit}
				/>

				<EditDependenciesModal
					currentDependencies={dependencies}
					isOpen={isEditDependenciesModalOpen}
					onClose={handleCloseDependenciesModal}
					appId={appId || ""}
				/>
			</div>
		</AppDetailContext.Provider>
	);
};
