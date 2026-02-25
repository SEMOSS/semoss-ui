import {
	Download,
	Edit,
	Info,
	LockKeyhole,
	PencilLine,
	RefreshCw,
	SquareArrowOutUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
import { getUserProjectPermission } from "@semoss/shared";
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
	H2,
	Spinner,
	Tabs,
	TabsContent,
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
import { UpdateSMSS } from "@/components/settings";
import { McpUsage } from "@/components/shared/mcp-usage";
import { ShareOverlay } from "@/components/ui";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import type { Role } from "@/types";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { AccessControl } from "./AppDetailTabs/access-control";
import { Dependencies } from "./AppDetailTabs/dependencies-tab";
import { Overview } from "./AppDetailTabs/overview-tab";
import { SettingsTab } from "./AppDetailTabs/settings-tab";
import { AppFileManagerPage } from "./app-file-manager-page";

interface AppDetailsProps {
	showNav?: boolean;
}

export const AppDetailPage = (props: AppDetailsProps) => {
	const { showNav = true } = props;
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
	const [responseStatus, setResponseStatus] = useState(false);
	const [values, setValues] = useState<DetailsForm>(
		AppDetailsFormValues.detailsForm,
	);
	const [pendingRequest, setPendingRequest] = useState(false);
	const { monolithStore, configStore } = useRootStore();
	const { appId } = useParams();
	const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
		useState(false);
	useEffect(() => {
		setSelectedTab("Overview");
		setValue("appId", appId);
		fetchUserSpecificData();
		fetchAppData(appId);
	}, [appId]);
	const navigate = useNavigate();
	const fetchUserSpecificData = async () => {
		const currPermission = getValues("permission");
		await getPermission();
		const newPermission = getValues("permission");

		if (newPermission !== currPermission && newPermission === "readOnly") {
			fetchSimilarApps();
		}
	};
	// This runs ONLY when `appId` changes — not when dependencies change
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
				.catch((_error) => {
					setPendingRequest(false); // fallback in case of error
				});
		}
	}, [appId]);

	async function getPermission() {
		const role = await getUserProjectPermission(appId);

		setValue("userRole", role);
		const permission = determineUserPermission(role);
		setValue("permission", permission);

		if (permission === "author") setValue("requestedPermission", "OWNER");
		if (permission === "editor") setValue("requestedPermission", "EDIT");
		if (permission === "readOnly" || permission === "discoverable")
			setValue("requestedPermission", "READ_ONLY");
	}

	const fetchAppData = async (id: string) => {
		await getPermission();
		const permission = getValues("permission");
		const promises = [
			fetchAppInfo(
				monolithStore,
				id,
				configStore.store.config.projectMetaKeys.map((a) => a.metakey),
			),
			fetchMainUses(monolithStore, id),
		];
		if (permission !== "discoverable") {
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
						// Keep only relevant project keys defined for app details
						const parsedMeta = projectMetaKeys
							.map((k) => k.metakey)
							.reduce((prev, curr) => {
								// tag, domain, and etc either come in as a string or a string[], format it to correct type
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
							}, {}) as AppDetailsFormTypes["detailsForm"];
						setValue("detailsForm", parsedMeta);
						setValue("tag", parsedMeta.tag);
						setValue("markdown", parsedMeta.markdown);
						setValue("detailsForm.markdown", parsedMeta.markdown);
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
							setValue("detailsForm.markdown", res.value.output);
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
						const modelled = modelDependencies(res.value.output);
						setValue("dependencies", modelled);
					}
				}
			}
		});
	};

	const fetchSimilarApps = () => {
		// TODO
	};

	const modelDependencies = (
		dependencies: appDependency[],
	): modelledDependency[] => {
		return dependencies.map((dep: appDependency) => ({
			name: dep.engine_name ? dep.engine_name.replace(/_/g, " ") : "",
			id: dep.engine_id,
			type: dep.engine_type,
			userPermission: dep.permission_name as Role, // TODO: no value currently available in the payload
			isPublic: !!dep.engine_global,
			isDiscoverable: !!dep.engine_discoverable,
			description: dep.description,
			access_permission: dep.access_permission,
		}));
	};
	const emitMessage = (isError: boolean, message: string) => {
		toast(message);
	};

	const handleCloseChangeAccessModal = (refresh?: boolean) => {
		if (refresh) {
			// fetch updated permission.
			getPermission();
		} else {
			// reset permission to original.
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

	// export loading state
	const [exportLoading, setExportLoading] = useState(false);
	/**
	 * @name exportAPP
	 * @desc export APP pixel
	 */
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
			const appId = getValues("appId");
			const res = await fetchDependencies(configStore, appId);
			if (res.type === "success") {
				const modelled = modelDependencies(res.output);
				setValue("dependencies", modelled);
			} else {
				toast.error(res.output);
			}
		}
		setIsEditDependenciesModalOpen(false);
	};

	/**
	 * @name onSubmit
	 * @desc update app details
	 * @param data - form data
	 */
	const onSubmit = handleSubmit((data: AppDetailsFormTypes) => {
		// copy over the defined keys
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
				)}], jsonCleanup=[true])`,
			)
			.then(async (response) => {
				const { output, additionalOutput, operationType } =
					response.pixelReturn[0];

				// track the errors
				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output as string);
					return;
				}
				// upload the image
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

				// close it, refresh and succesfully message
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
	const [selectedTab, setSelectedTab] = useState("Overview");

	const TABS_BY_PERMISSION: Record<string, string[]> = {
		author: [
			"Overview",
			"Files",
			"Access Control",
			"Dependencies",
			"Settings",
			"SMSS",
			"MCP Usage",
		],
		editor: ["Overview", "Files", "Access Control", "Dependencies"],
		readOnly: ["Overview", "Files", "Dependencies"],
		discoverable: ["Overview"],
	};

	const visibleTabs = TABS_BY_PERMISSION[permission] || ["Overview"];

	return (
		<div className="w-full">
			{showNav && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<div
				className={`h-full w-full ${
					showNav ? "flex justify-center" : "p-5"
				}`}
			>
				<div
					className={`flex h-full w-full flex-col gap-3 ${
						showNav ? "m-auto max-w-[79rem]" : ""
					}`}
				>
					{showNav && (
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href="#/app">
										App Catalog
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator>/</BreadcrumbSeparator>
								<BreadcrumbItem>
									<BreadcrumbPage>
										<div
											title={appInfo?.project_name}
											className="w-[40ch] truncate text-ellipsis"
										>
											{appInfo?.project_name}
										</div>
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					)}

					<div>
						<div className="flex flex-col">
							<section className="flex flex-wrap items-center justify-between gap-2 pb-2">
								<div className="flex gap-2">
									<img
										src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
										alt="app"
										className="h-16 w-16 overflow-hidden rounded-lg"
									/>
									<div className="flex flex-col justify-center gap-2">
										<div
											title={appInfo?.project_name}
											className="mt-1 max-w-[40ch] truncate text-ellipsis font-normal text-[34px] leading-[150%]"
										>
											{appInfo?.project_name}
										</div>
									</div>
								</div>

								<div className="ml-auto flex gap-2">
									{permission === "author" ? (
										<Button
											disabled={exportLoading}
											variant="outline"
											onClick={() => exportApp()}
											data-testid="appDetail-export-btn"
										>
											{exportLoading ? (
												<Spinner className="size-4" />
											) : (
												<Download className="size-4" />
											)}
											Export
										</Button>
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
											onClick={() =>
												setIsChangeAccessModalOpen(true)
											}
											data-testid="appDetail-access-btn"
										>
											{responseStatus ? (
												<RefreshCw className="size-4 text-muted-foreground" />
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
											<Button
												variant="default"
												onClick={() => {
													setIsEditDetailsModalOpen(
														true,
													);
												}}
												data-testid="appDetail-edit-btn"
											>
												<PencilLine className="size-4" />
												Edit
											</Button>
										)}
									{permission !== "discoverable" &&
										permission !== "readOnly" &&
										showNav && (
											<Button
												variant="outline"
												onClick={() =>
													navigate(
														`/app/${appId}/view`,
													)
												}
												data-testid="appDetail-edit-btn"
											>
												<SquareArrowOutUpRight className="size-4" />
												Open App
											</Button>
										)}
								</div>
							</section>
							<div className="grid grid-cols-1 items-start gap-2 pb-2 md:grid-cols-12">
								<div className="md:col-span-8">
									<p className="pb-2 text-muted-foreground">
										{appInfo?.description ||
											"No description available"}
									</p>
								</div>

								<div className="flex justify-end md:col-span-4">
									<div className="flex flex-col items-end gap-0.5 text-muted-foreground text-sm">
										<span>
											Published by:{" "}
											{appInfo?.project_created_by ||
												"Unknown"}
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

							<div className="pb-2">
								{tags ? (
									<div className="flex flex-wrap gap-2.5">
										{tags.map((tag) => (
											<Badge
												key={`tag-${tag}`}
												variant="outline"
											>
												{tag}
											</Badge>
										))}
									</div>
								) : (
									<p className="text-sm">No tags available</p>
								)}
							</div>

							<div className="flex w-full flex-col gap-3">
								<Tabs
									value={selectedTab}
									onValueChange={(val) => setSelectedTab(val)}
									className="gap-0"
								>
									<div className="w-full rounded-t-lg bg-muted">
										<TabsList>
											{visibleTabs.includes(
												"Overview",
											) && (
												<TabsTrigger
													value="Overview"
													className="p-3"
												>
													Overview
												</TabsTrigger>
											)}
											{visibleTabs.includes(
												"Access Control",
											) && (
												<TabsTrigger
													value="Access Control"
													className="p-3"
												>
													Access Control
												</TabsTrigger>
											)}
											{visibleTabs.includes("Files") && (
												<TabsTrigger
													value="Files"
													className="p-3"
												>
													Files
												</TabsTrigger>
											)}
											{visibleTabs.includes(
												"Dependencies",
											) && (
												<TabsTrigger
													value="Dependencies"
													className="p-3"
												>
													Dependencies
												</TabsTrigger>
											)}
											{visibleTabs.includes("SMSS") && (
												<TabsTrigger
													value="SMSS"
													className="p-3"
												>
													SMSS
												</TabsTrigger>
											)}
											{visibleTabs.includes(
												"MCP Usage",
											) && (
												<TabsTrigger
													value="MCP Usage"
													className="p-3"
												>
													MCP Usage
												</TabsTrigger>
											)}
											{visibleTabs.includes(
												"Settings",
											) && (
												<TabsTrigger
													value="Settings"
													className="p-3"
												>
													Settings
												</TabsTrigger>
											)}
										</TabsList>
									</div>
									<TabsContent
										value="Overview"
										className="mt-2 w-full"
									>
										<Overview appInfo={appInfo} />
									</TabsContent>
									<TabsContent
										value="Access Control"
										className="mt-2 w-full"
									>
										<div className="w-full">
											<AccessControl
												appInfo={appInfo}
												appId={appId}
												fetchUserSpecificData={
													fetchUserSpecificData
												}
												permission={permission}
											/>
										</div>
									</TabsContent>
									<TabsContent
										value="Files"
										className="mt-2 w-full"
									>
										<AppFileManagerPage
											appId={appId}
											showNavbar={showNav}
										/>
									</TabsContent>
									<TabsContent
										value="Dependencies"
										className="mt-2 w-full"
									>
										<div className="w-full">
											<div className="flex w-full items-center">
												{/* Left: Title + Tooltip */}
												<div className="flex items-center gap-2">
													<H2 className="font-medium text-xl">
														Dependencies
													</H2>

													<Tooltip>
														<TooltipTrigger asChild>
															<Info className="size-[15px] cursor-pointer text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															{appInfo?.project_type ===
															"CODE"
																? "Add/Remove dependencies using the Edit Icon"
																: "Add/Remove dependencies using the Variables Tab"}
														</TooltipContent>
													</Tooltip>
												</div>

												{/* Right: Edit button */}
												{appInfo?.project_type ===
													"CODE" &&
													permission === "author" && (
														<Button
															size="icon-sm"
															variant="ghost"
															onClick={() =>
																setIsEditDependenciesModalOpen(
																	true,
																)
															}
															data-testid="appDetail-edit-btn"
															className="ml-auto"
														>
															<Edit className="size-4" />
														</Button>
													)}
											</div>

											<Dependencies
												dependencies={dependencies}
											/>
										</div>
									</TabsContent>
									<TabsContent
										value="Settings"
										className="mt-2 w-full"
									>
										<div className="w-full">
											<SettingsContext.Provider
												value={{
													adminMode: false,
												}}
											>
												<SettingsTab id={appId} />
											</SettingsContext.Provider>
										</div>
									</TabsContent>
									<TabsContent
										value="SMSS"
										className="mt-2 w-full"
									>
										<div className="w-full">
											<SettingsContext.Provider
												value={{
													adminMode: false,
												}}
											>
												<UpdateSMSS
													type={"PROJECT"}
													id={appId}
												/>
											</SettingsContext.Provider>
										</div>
									</TabsContent>
									<TabsContent
										value="MCP Usage"
										className="mt-2 w-full"
									>
										<div className="w-full">
											<McpUsage id={appId} />
										</div>
									</TabsContent>
								</Tabs>
							</div>
						</div>
					</div>
				</div>

				<Dialog
					open={isShareOverlayOpen}
					onOpenChange={setIsShareOverlayOpen}
				>
					<DialogContent>
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
		</div>
	);
};
