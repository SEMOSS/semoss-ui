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
import { useForm } from "react-hook-form";
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
	type AppDetailsFormTypes,
	AppDetailsFormValues,
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
import { APP_DETAIL_TABS } from "./app-detail.constants";

const modelDependencies = (
	dependencies: appDependency[],
): modelledDependency[] => {
	return dependencies.map((dep: appDependency) => ({
		name: dep.engine_name ? dep.engine_name.replace(/_/g, " ") : "",
		id: dep.engine_id,
		type: dep.engine_type,
		userPermission: dep.permission_name as Role,
		isPublic: !!dep.engine_global,
		isDiscoverable: !!dep.engine_discoverable,
		description: dep.description,
		access_permission: dep.access_permission,
		can_view_dependencies: dep.can_view_dependencies,
	}));
};

interface AppDetailLayoutProps {
	/** When true, render tabs via local state (no URL changes, no Outlet). Used for editor workspace embeds. */
	embedded?: boolean;
	/** Whether to render the navbar chrome and breadcrumb. Hidden when embedded inside the workspace editor. */
	showNav?: boolean;
	/** Tab path segments to hide (e.g. ["dependencies", "mcp-usage"]). */
	excludeTabs?: string[];
}

export const AppDetailLayout = ({
	embedded = false,
	showNav = true,
	excludeTabs = [],
}: AppDetailLayoutProps) => {
	const { control, setValue, getValues, watch, handleSubmit } =
		useForm<AppDetailsFormTypes>({ defaultValues: AppDetailsFormValues });

	const tags = watch("tag");
	const appInfo = watch("appInfo");
	const permission = watch("permission");
	const dependencies = watch("dependencies");

	const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
	const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
		useState(false);
	const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
	const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
		useState(false);
	const [responseStatus, setResponseStatus] = useState(false);
	const [values, setValues] = useState<DetailsForm>(
		AppDetailsFormValues.detailsForm,
	);
	const [pendingRequest, setPendingRequest] = useState(false);
	const [permissionError, setPermissionError] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [selectedTabName, setSelectedTabName] = useState("Overview");

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

	const getPermission = useCallback(async () => {
		try {
			const role = await getUserProjectPermission(appId);

			setValue("userRole", role);
			const nextPermission = determineUserPermission(role);
			setValue("permission", nextPermission);

			if (nextPermission === "author")
				setValue("requestedPermission", "OWNER");
			if (nextPermission === "editor")
				setValue("requestedPermission", "EDIT");
			if (
				nextPermission === "readOnly" ||
				nextPermission === "discoverable"
			)
				setValue("requestedPermission", "READ_ONLY");
		} catch {
			setPermissionError(true);
		}
	}, [appId, setValue]);

	const fetchSimilarApps = useCallback(() => {
		// TODO
	}, []);

	const fetchUserSpecificData = useCallback(async () => {
		const currPermission = getValues("permission");
		await getPermission();
		const newPermission = getValues("permission");

		if (newPermission !== currPermission && newPermission === "readOnly") {
			fetchSimilarApps();
		}
	}, [fetchSimilarApps, getPermission, getValues]);

	const fetchAppData = useCallback(
		async (id: string) => {
			await getPermission();
			const currentPermission = getValues("permission");
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
				} else {
					if (idx === 0) {
						if (res.value.type === "error") {
							emitMessage(true, res.value.output);
						} else {
							setValue("appInfo", res.value.output);
							const output = res.value.output;

							const projectMetaKeys =
								configStore.store.config.projectMetaKeys;
							const parsedMeta = projectMetaKeys
								.map((k) => k.metakey)
								.reduce((prev, curr) => {
									const found = projectMetaKeys.find(
										(obj) => obj.metakey === curr,
									);

									if (curr === "tag") {
										if (typeof output[curr] === "string") {
											prev[curr] = [output[curr]];
										} else {
											prev[curr] = output[curr];
										}
									} else if (
										found.display_options ===
											"single-typeahead" ||
										found.display_options ===
											"select-box" ||
										found.display_options ===
											"multi-typeahead"
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
								}, {}) as AppDetailsFormTypes["detailsForm"];

							setValue("detailsForm", parsedMeta);
							setValue("tag", parsedMeta.tag);
							setValue("markdown", parsedMeta.markdown);
							setValue(
								"detailsForm.markdown",
								parsedMeta.markdown,
							);
							setValues((prev) => ({
								...prev,
								markdown: parsedMeta.markdown || "",
							}));
							setValues((prev) => ({ ...prev, ...parsedMeta }));
						}
					} else if (idx === 1) {
						if (res.value.type === "error") {
							emitMessage(true, res.value.output);
						} else {
							if (res.value.output !== null) {
								setValue("markdown", res.value.output);
								setValue(
									"detailsForm.markdown",
									res.value.output,
								);
								setValues((prev) => ({
									...prev,
									markdown: res.value.output || "",
								}));
							}
						}
					} else if (idx === 2) {
						if (res.value.type === "error") {
							emitMessage(true, res.value.output);
						} else {
							const modelled = modelDependencies(
								res.value.output,
							);
							setValue("dependencies", modelled);
						}
					}
				}
			});
		},
		[
			configStore,
			emitMessage,
			getPermission,
			getValues,
			monolithStore,
			setValue,
		],
	);

	useEffect(() => {
		setSelectedTabName("Overview");
		setPermissionError(false);
		setValue("appId", appId);
		fetchUserSpecificData();
		if (appId) {
			fetchAppData(appId);
		}
	}, [appId, fetchAppData, fetchUserSpecificData, setValue]);

	useEffect(() => {
		if (appId) {
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
		}
	}, [appId, monolithStore]);

	// Backward compat: ?tab=accesscontrol → /app/:appId/access-control (or set state in embedded mode)
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
		} else {
			if (permission === "author")
				setValue("requestedPermission", "OWNER");
			if (permission === "editor")
				setValue("requestedPermission", "EDIT");
			if (permission === "readOnly")
				setValue("requestedPermission", "READ_ONLY");
		}
		setIsChangeAccessModalOpen(false);
	};

	const handleCloseEditDetailsModal = (isReset?: boolean) => {
		if (isReset) {
			setValue("detailsForm", values);
		}
		setIsEditDetailsModalOpen(false);
	};

	const exportApp = () => {
		setExportLoading(true);
		const pixel = `ExportProjectApp(project=["${appId}"]);`;

		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0].output,
				insightId = response.insightId;

			monolithStore.download(insightId, output as string);
		});
		setExportLoading(false);
	};

	const handleCloseDependenciesModal = async (refreshData: boolean) => {
		if (refreshData) {
			const currentAppId = getValues("appId");
			const res = await fetchDependencies(configStore, currentAppId);
			if (res.type === "success") {
				const modelled = modelDependencies(res.output);
				setValue("dependencies", modelled);
			} else {
				toast.error(res.output);
			}
		}
		setIsEditDependenciesModalOpen(false);
	};

	const onSubmit = handleSubmit((data: AppDetailsFormTypes) => {
		const meta = {} as AppDetailsFormTypes["detailsForm"];
		let imageMeta = [] as File[];
		if (data?.detailsForm) {
			for (const key in data?.detailsForm) {
				if (
					data?.detailsForm[key] !== undefined &&
					key !== "appImage"
				) {
					meta[key] = data?.detailsForm[key];
				}
				if (key === "appImage") {
					imageMeta = data?.detailsForm[key] as File[];
				}
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
				if (
					((Array.isArray(imageMeta) &&
						imageMeta[0] instanceof File) ||
						imageMeta instanceof File) &&
					appId
				) {
					const filesToUpload = Array.isArray(imageMeta)
						? imageMeta
						: [imageMeta];
					await uploadImage(
						filesToUpload,
						appId,
						configStore.store.insightID,
					);
				}

				toast.success(additionalOutput[0].output);
				fetchAppData(appId);
				handleCloseEditDetailsModal();
			})
			.catch((error) => {
				toast.error(error.message);
			});
	});

	const handleAccessRequested = () => {
		setResponseStatus(true);
	};

	// Filter tabs by permission + chrome requirements
	const visibleTabs = useMemo(() => {
		return APP_DETAIL_TABS.filter((tab) => {
			if (tab.requiresNav && !showNav) return false;
			if (excludeTabs.includes(tab.path)) return false;
			if (!tab.restrict) return true;
			if (!permission) return false;
			return tab.restrict.includes(
				permission as Exclude<typeof permission, "">,
			);
		});
	}, [permission, showNav, excludeTabs]);

	// Determine active tab. In route mode, derive from URL via matchPath.
	// In embedded mode, derive from selectedTabName local state.
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
			tags: tags || [],
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
				<ResourceNotFound
					catalogPath="/app"
					catalogLabel="App Catalog"
				/>
			</>
		);
	}

	const handleTabClick = (tab: (typeof visibleTabs)[number]) => {
		if (embedded) {
			setSelectedTabName(tab.name);
			return;
		}
		// In route mode, navigate to the tab's sub-path. Empty path = index (Overview).
		navigate(tab.path ? tab.path : ".");
	};

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;

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
												setValue(
													"requestedPermission",
													"READ_ONLY",
												);
												setValue(
													"roleChangeComment",
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
												onClick={() =>
													handleTabClick(tab)
												}
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
								activeTab &&
								createElement(activeTab.component, {})
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
							appId={appId}
							diffs={false}
							onClose={() => setIsShareOverlayOpen(false)}
						/>
					</DialogContent>
				</Dialog>

				<ChangeAccessModal
					open={isChangeAccessModalOpen}
					onClose={handleCloseChangeAccessModal}
					control={control}
					getValues={getValues}
					dependencies={dependencies}
					onSuccess={handleAccessRequested}
					permission={permission}
				/>

				<EditDetailsModal
					isOpen={isEditDetailsModalOpen}
					onClose={handleCloseEditDetailsModal}
					control={control}
					onSubmit={onSubmit}
				/>

				<EditDependenciesModal
					currentDependencies={dependencies}
					isOpen={isEditDependenciesModalOpen}
					onClose={handleCloseDependenciesModal}
					appId={appId}
				/>
			</div>
		</AppDetailContext.Provider>
	);
};
