import {
	ChevronRight,
	Copy,
	Download,
	Info,
	LockKeyhole,
	Pencil,
	RefreshCcw,
	SquareArrowOutUpRight,
	Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
import { getUserProjectPermission } from "@semoss/shared";
import { Modal, useNotification } from "@semoss/ui";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	H4,
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
		can_view_dependencies: dep.can_view_dependencies,
	}));
};

interface AppDetailsProps {
	showNav?: boolean;
}

interface MCPToolInputProperty {
	title?: string;
	description?: string;
	type?: string;
}

interface MCPToolDefinition {
	name: string;
	title?: string;
	description?: string;
	inputSchema?: {
		properties?: Record<string, MCPToolInputProperty>;
		required?: string[];
	};
}

interface MCPToolsPixelResponse {
	pixelReturn?: {
		operationType?: string[] | string;
		output?:
			| {
					tools?: MCPToolDefinition[];
			  }
			| string;
	}[];
}

const hasPixelError = (operationType?: string[] | string): boolean => {
	if (Array.isArray(operationType)) {
		return operationType.includes("ERROR");
	}

	if (typeof operationType === "string") {
		return operationType.includes("ERROR");
	}

	return false;
};

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
	const notification = useNotification();
	const { appId } = useParams();
	const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
		useState(false);
	const [selectedTab, setSelectedTab] = useState("Overview");
	const [mcpTools, setMcpTools] = useState<MCPToolDefinition[]>([]);
	const [mcpToolsLoading, setMcpToolsLoading] = useState(false);
	const [mcpToolsError, setMcpToolsError] = useState("");

	const emitMessage = useCallback(
		(isError: boolean, message: string) => {
			notification.add({
				color: isError ? "error" : "success",
				message,
			});
		},
		[notification.add],
	);
	const getPermission = useCallback(async () => {
		const role = await getUserProjectPermission(appId);

		setValue("userRole", role);
		const nextPermission = determineUserPermission(role);
		setValue("permission", nextPermission);

		if (nextPermission === "author")
			setValue("requestedPermission", "OWNER");
		if (nextPermission === "editor")
			setValue("requestedPermission", "EDIT");
		if (nextPermission === "readOnly" || nextPermission === "discoverable")
			setValue("requestedPermission", "READ_ONLY");
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

	const fetchMcpTools = useCallback(
		async (projectId: string) => {
			setMcpToolsLoading(true);
			setMcpToolsError("");

			try {
				const response = (await monolithStore.runQuery(
					`GetMCPTools(project="${projectId}")`,
				)) as MCPToolsPixelResponse;

				const result = response?.pixelReturn?.[0];
				if (hasPixelError(result?.operationType)) {
					const errorMessage =
						typeof result?.output === "string"
							? result.output
							: "Unable to load MCP tools for this app.";
					setMcpTools([]);
					setMcpToolsError(errorMessage);
					return;
				}

				const output = result?.output;
				const tools =
					typeof output === "object" && output !== null
						? output.tools
						: undefined;
				setMcpTools(Array.isArray(tools) ? tools : []);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unable to load MCP tools for this app.";
				setMcpTools([]);
				setMcpToolsError(message);
			} finally {
				setMcpToolsLoading(false);
			}
		},
		[monolithStore],
	);

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
		setSelectedTab("Overview");
		setMcpTools([]);
		setMcpToolsError("");
		setValue("appId", appId);
		fetchUserSpecificData();
		if (appId) {
			fetchAppData(appId);
		}
	}, [appId, fetchAppData, fetchUserSpecificData, setValue]);

	useEffect(() => {
		if (selectedTab !== "MCP Usage" || !appId) {
			return;
		}

		fetchMcpTools(appId);
	}, [appId, fetchMcpTools, selectedTab]);
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
	}, [appId, monolithStore]);

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
	const handleCopyAppId = async () => {
		if (!appId) return;

		try {
			await navigator.clipboard.writeText(appId);
			toast.success("App ID copied to clipboard");
		} catch (error) {
			console.error(error);
			toast.error("Failed to copy App ID");
		}
	};

	const TABS_BY_PERMISSION: Record<string, string[]> = {
		author: [
			"Overview",
			"Dependencies",
			"MCP Usage",
			"Settings",
			"Access Control",
			"Files",
			"SMSS",
		],
		editor: [
			"Overview",
			"Dependencies",
			"MCP Usage",
			"Access Control",
			"Files",
		],
		readOnly: ["Overview", "Dependencies", "MCP Usage"],
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
					showNav ? "flex flex-col justify-center gap-4" : "m-2 p-5"
				}`}
			>
				<div
					className={`flex h-full w-full flex-col gap-3 ${
						showNav ? "m-auto max-w-316" : ""
					}`}
				>
					{showNav && (
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link
											to={"/app"}
											className="text-inherit"
										>
											App Catalog
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator>
									<ChevronRight />
								</BreadcrumbSeparator>
								<BreadcrumbItem>
									<BreadcrumbPage>
										<span
											title={
												appInfo?.project_display_name ||
												appInfo?.project_name
											}
											className="inline-block max-w-[40ch] truncate text-ellipsis"
										>
											{appInfo?.project_display_name ||
												appInfo?.project_name}
										</span>
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					)}

					<div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
						<div className="h-16 w-16 shrink-0 rounded-lg bg-muted">
							<img
								src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
								alt={
									appInfo?.project_display_name ||
									appInfo?.project_name ||
									"App"
								}
								className="size-full object-cover"
							/>
						</div>

						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<h1
								className="wrap-break-words font-semibold text-2xl text-foreground leading-normal md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]"
								title={
									appInfo?.project_display_name ||
									appInfo?.project_name
								}
							>
								{appInfo?.project_display_name ||
									appInfo?.project_name}
							</h1>
							{appId && (
								<div className="flex items-center gap-1 text-muted-foreground text-sm">
									<span data-testid="appDetail-id">
										{appId}
									</span>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Copy App ID"
												onClick={(event) => {
													event.preventDefault();
													handleCopyAppId();
												}}
											>
												<Copy className="size-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Copy App ID
										</TooltipContent>
									</Tooltip>
								</div>
							)}
						</div>

						<div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end">
							{permission === "author" ? (
								<Button
									disabled={exportLoading}
									variant="ghost"
									className="gap-2 text-primary hover:bg-transparent hover:text-primary"
									onClick={() => exportApp()}
									data-testid={"appDetail-export-btn"}
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
									disabled={responseStatus || pendingRequest}
									variant={
										responseStatus
											? "outline"
											: permission === "discoverable"
												? "default"
												: "outline"
									}
									className="gap-2"
									onClick={() =>
										setIsChangeAccessModalOpen(true)
									}
									data-testid={"appDetail-access-btn"}
								>
									{responseStatus ? (
										<RefreshCcw className="size-4" />
									) : permission === "discoverable" ? (
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
										className="gap-2"
										onClick={() => {
											setIsEditDetailsModalOpen(true);
										}}
										data-testid="appDetail-edit-btn"
									>
										<Pencil className="size-4" />
										Edit
									</Button>
								)}
							{permission !== "discoverable" &&
								permission !== "readOnly" &&
								showNav && (
									<Button
										asChild
										variant="outline"
										data-testid="appDetail-edit-btn"
									>
										<Link to={`/app/${appId}/view`}>
											<SquareArrowOutUpRight className="size-4" />
											Open App
										</Link>
									</Button>
								)}
						</div>
					</div>

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
												className="border-primary text-primary"
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
							value={selectedTab}
							onValueChange={(val) => setSelectedTab(String(val))}
							className="gap-0 bg-transparent"
						>
							<div className="w-full overflow-x-auto">
								<TabsList className="w-max flex-nowrap gap-2">
									{visibleTabs.includes("Overview") && (
										<TabsTrigger value="Overview">
											Overview
										</TabsTrigger>
									)}
									{visibleTabs.includes("Dependencies") && (
										<TabsTrigger value="Dependencies">
											Dependencies
										</TabsTrigger>
									)}
									{visibleTabs.includes("MCP Usage") && (
										<TabsTrigger value="MCP Usage">
											MCP Usage
										</TabsTrigger>
									)}
									{visibleTabs.includes("Settings") && (
										<TabsTrigger value="Settings">
											Settings
										</TabsTrigger>
									)}
									{visibleTabs.includes("Access Control") && (
										<TabsTrigger value="Access Control">
											Access Control
										</TabsTrigger>
									)}
									{visibleTabs.includes("Files") &&
										showNav && (
											<TabsTrigger value="Files">
												Files
											</TabsTrigger>
										)}
									{visibleTabs.includes("SMSS") && (
										<TabsTrigger value="SMSS">
											SMSS
										</TabsTrigger>
									)}
								</TabsList>
							</div>
						</Tabs>
					)}
					<div className="w-full bg-card p-3 md:p-4">
						{selectedTab === "Overview" && (
							<Overview appInfo={appInfo} />
						)}
						{selectedTab === "Dependencies" && (
							<div className="flex w-full flex-col gap-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 font-semibold text-base">
										<span>Dependencies</span>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Info className="size-4 text-muted-foreground" />
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{appInfo.project_type === "CODE"
													? "Add/Remove dependencies using the Edit Icon"
													: "Add/Remove dependencies using the Variables Tab"}
											</TooltipContent>
										</Tooltip>
									</div>

									{appInfo.project_type === "CODE" &&
										permission === "author" && (
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													setIsEditDependenciesModalOpen(
														true,
													)
												}
												data-testid="appDetail-edit-btn"
											>
												<Pencil className="size-4" />
											</Button>
										)}
								</div>

								<Dependencies dependencies={dependencies} />
							</div>
						)}
						{selectedTab === "MCP Usage" && (
							<SettingsContext.Provider
								value={{
									adminMode: false,
								}}
							>
								<div className="space-y-6">
									<div className="rounded-2xl border border-base p-6 shadow-xs">
										<div className="mb-4">
											<H4>Available Tools</H4>
											<p className="text-muted-foreground text-sm">
												These MCP tools are currently
												exposed by this app.
											</p>
										</div>

										{mcpToolsLoading && (
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<Spinner className="size-4" />
												Loading tools...
											</div>
										)}

										{!mcpToolsLoading &&
											!!mcpToolsError && (
												<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
													<p className="font-medium text-destructive text-sm">
														Unable to load tools
													</p>
													<p className="mt-1 text-muted-foreground text-sm">
														{mcpToolsError}
													</p>
												</div>
											)}

										{!mcpToolsLoading &&
											!mcpToolsError &&
											mcpTools.length === 0 && (
												<div className="rounded-xl border border-base/70 border-dashed bg-muted/20 p-8 text-center">
													<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
														<Wrench className="size-5 text-muted-foreground" />
													</div>
													<p className="font-medium text-sm">
														No tools available
													</p>
													<p className="mt-1 text-muted-foreground text-sm">
														This app does not
														currently expose MCP
														tools.
													</p>
												</div>
											)}

										{!mcpToolsLoading &&
											!mcpToolsError &&
											mcpTools.length > 0 && (
												<div className="space-y-3">
													{mcpTools.map((tool) => {
														const toolTitle =
															tool.title ||
															tool.name;
														const inputProperties =
															tool.inputSchema
																?.properties ||
															{};
														const requiredInputs =
															tool.inputSchema
																?.required ||
															[];
														const inputEntries =
															Object.entries(
																inputProperties,
															);

														return (
															<div
																key={`${tool.name}-${toolTitle}`}
																className="rounded-xl border border-base/80 p-4"
															>
																<div className="flex items-start gap-3">
																	<Wrench className="mt-1 size-4 shrink-0 text-muted-foreground" />
																	<div className="min-w-0 flex-1">
																		<H4 className="leading-tight">
																			{
																				toolTitle
																			}
																		</H4>
																		<p className="mt-1 whitespace-pre-line text-muted-foreground text-sm">
																			{tool.description ||
																				"No description available."}
																		</p>
																	</div>
																</div>

																{inputEntries.length >
																	0 && (
																	<details className="mt-3 rounded-lg border border-base/70 border-dashed bg-muted/20 p-3">
																		<summary className="cursor-pointer font-medium text-sm">
																			View
																			input
																			parameters{" "}
																			(
																			{
																				inputEntries.length
																			}
																			)
																		</summary>
																		<div className="mt-3 space-y-2">
																			{inputEntries.map(
																				([
																					inputName,
																					inputConfig,
																				]) => (
																					<div
																						key={`${tool.name}-${inputName}`}
																						className="rounded-md bg-background p-3"
																					>
																						<div className="flex flex-wrap items-center gap-2">
																							<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
																								{
																									inputName
																								}
																							</code>
																							{inputConfig.type && (
																								<Badge variant="outline">
																									{
																										inputConfig.type
																									}
																								</Badge>
																							)}
																							{requiredInputs.includes(
																								inputName,
																							) && (
																								<Badge variant="secondary">
																									Required
																								</Badge>
																							)}
																						</div>
																						{inputConfig.description && (
																							<p className="mt-1 text-muted-foreground text-sm">
																								{
																									inputConfig.description
																								}
																							</p>
																						)}
																					</div>
																				),
																			)}
																		</div>
																	</details>
																)}
															</div>
														);
													})}
												</div>
											)}
									</div>

									<McpUsage
										id={appId}
										name={
											appInfo?.project_display_name ||
											appInfo?.project_name
										}
									/>
								</div>
							</SettingsContext.Provider>
						)}
						{selectedTab === "Settings" && (
							<SettingsContext.Provider
								value={{
									adminMode: false,
								}}
							>
								<SettingsTab id={appId} />
							</SettingsContext.Provider>
						)}
						{selectedTab === "Access Control" && (
							<AccessControl
								appInfo={appInfo}
								appId={appId}
								fetchUserSpecificData={fetchUserSpecificData}
								permission={permission}
							/>
						)}
						{selectedTab === "Files" && showNav && (
							<AppFileManagerPage appId={appId || ""} />
						)}
						{selectedTab === "SMSS" && (
							<SettingsContext.Provider
								value={{
									adminMode: false,
								}}
							>
								<UpdateSMSS type={"PROJECT"} id={appId} />
							</SettingsContext.Provider>
						)}
					</div>
				</div>
			</div>

			<Modal
				open={isShareOverlayOpen}
				onClose={() => setIsShareOverlayOpen(false)}
			>
				<ShareOverlay
					appId={appId}
					diffs={false}
					onClose={() => setIsShareOverlayOpen(false)}
				/>
			</Modal>

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
	);
};
