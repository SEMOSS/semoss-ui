import { Download, Edit, Info, LockKeyhole, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
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
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { getUserProjectPermission, uploadImage } from "@/api";
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
import { ShareOverlay } from "@/components/ui";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import type { Role } from "@/types";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { AccessControl } from "./AppDetailTabs/AccessControl";
import { Dependencies } from "./AppDetailTabs/Dependencies";
import { Overview } from "./AppDetailTabs/Overview";
import { SettingsTab } from "./AppDetailTabs/Settings";

export const AppDetailPage = () => {
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
		const { permission: role } = await getUserProjectPermission(appId);

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
		toast[isError ? "error" : "success"](message);
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
			toast.warning("Nothing to Save");
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
			"Access Control",
			"Dependencies",
			"Settings",
			"SMSS",
		],
		editor: ["Overview", "Access Control"],
		readOnly: ["Overview"],
		discoverable: ["Overview"],
	};

	const visibleTabs = TABS_BY_PERMISSION[permission] || ["Overview"];

	return (
		<div>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="h-full w-full justify-center overflow-scroll">
				<div className="m-auto flex h-full w-full max-w-[79rem] flex-col gap-4">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="#/app">
									App Catalog
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage
									title={appInfo?.project_name}
									className="w-[40ch] truncate text-ellipsis"
								>
									{appInfo?.project_name}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					<div>
						<div className="flex flex-col gap-2">
							{/* Main header row with image, title, and action buttons */}
							<div className="flex w-full flex-row items-center gap-4">
								{/* App Image */}
								<img
									src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
									alt="App"
									className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
								/>

								{/* Title section */}
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<h1
										title={appInfo?.project_name}
										className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[30px] text-foreground leading-normal"
									>
										{appInfo?.project_name}
									</h1>
								</div>

								{/* Action buttons */}
								<div className="flex flex-shrink-0 flex-row gap-2">
									{permission === "author" ? (
										<Button
											disabled={exportLoading}
											variant="outline"
											onClick={() => exportApp()}
											data-testid={"appDetail-export-btn"}
										>
											{exportLoading ? (
												<Spinner />
											) : (
												<Download />
											)}
											Export
										</Button>
									) : (
										<Button
											disabled={
												responseStatus || pendingRequest
											}
											variant={
												permission === "discoverable"
													? "default"
													: "outline"
											}
											onClick={() =>
												setIsChangeAccessModalOpen(true)
											}
											data-testid={"appDetail-access-btn"}
										>
											{responseStatus ? (
												<RefreshCw className="text-muted-foreground" />
											) : permission ===
												"discoverable" ? (
												<LockKeyhole className="text-primary-foreground" />
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
												<Edit />
												Edit
											</Button>
										)}
								</div>
							</div>

							{/* Description and metadata row */}
							<div className="mt-4 flex w-full justify-between gap-4">
								<div className="flex flex-1 flex-col gap-4">
									<p className="overflow-hidden whitespace-normal text-muted-foreground">
										{appInfo?.description ||
											"No description available"}
									</p>

									{tags ? (
										<div className="flex flex-row flex-wrap gap-2">
											{tags.map((tag) => (
												<Badge
													key={`tag-${tag}-${tag}`}
													variant="outline"
													data-testid="tag-chip"
													className="border-(--primary) text-(--primary)"
												>
													{tag}
												</Badge>
											))}
										</div>
									) : (
										<p className="text-muted-foreground">
											No tags available
										</p>
									)}
								</div>

								<div className="flex flex-col items-end gap-1 text-right">
									<span className="text-muted-foreground text-sm">
										Published by:{" "}
										{appInfo?.project_created_by ||
											"Unknown"}
									</span>
									<span className="text-muted-foreground text-sm">
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
							<div className="flex flex-col rounded-lg bg-(--muted)">
								<Tabs
									value={selectedTab}
									onValueChange={setSelectedTab}
									className="gap-0 bg-transparent"
								>
									<TabsList className="gap-2">
										{visibleTabs.map((tab) => (
											<TabsTrigger key={tab} value={tab}>
												{tab}
											</TabsTrigger>
										))}
									</TabsList>

									<TabsContent
										value="Overview"
										className="flex w-full flex-col flex-wrap bg-(--card)"
									>
										<Overview appInfo={appInfo} />
									</TabsContent>

									<TabsContent
										value="Access Control"
										className="flex w-full flex-col flex-wrap bg-(--card)"
									>
										<AccessControl
											appInfo={appInfo}
											appId={appId}
											fetchUserSpecificData={
												fetchUserSpecificData
											}
											permission={permission}
										/>
									</TabsContent>

									<TabsContent
										value="Dependencies"
										className="flex w-full flex-col flex-wrap bg-(--card)"
									>
										<div className="w-full p-6">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2 font-semibold text-xl">
													Dependencies
													<Tooltip>
														<TooltipTrigger asChild>
															<Info className="h-[15px] w-[15px] cursor-pointer text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															{appInfo?.project_type ===
															"CODE"
																? "Add/Remove dependencies using the Edit Icon"
																: "Add/Remove dependencies using the Variables Tab"}
														</TooltipContent>
													</Tooltip>
												</div>

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
														>
															<Edit />
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
										className="flex w-full flex-col flex-wrap bg-(--card)"
									>
										<SettingsContext.Provider
											value={{
												adminMode: false,
											}}
										>
											<SettingsTab id={appId} />
										</SettingsContext.Provider>
									</TabsContent>

									<TabsContent
										value="SMSS"
										className="flex w-full flex-col flex-wrap bg-(--card)"
									>
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
