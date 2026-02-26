import {
	Edit,
	EditOutlined,
	InfoRounded,
	LockReset,
	SimCardDownload,
} from "@mui/icons-material";
import UpdateIcon from "@mui/icons-material/Update";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
import { getUserProjectPermission } from "@semoss/shared";
import {
	Box,
	Breadcrumbs,
	Button,
	Chip,
	CircularProgress,
	Grid,
	IconButton,
	Modal,
	Stack,
	styled,
	ToggleTabsGroup,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
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
import { AccessControl } from "./AppDetailTabs/AccessControl";
import { Dependencies } from "./AppDetailTabs/Dependencies";
import { Overview } from "./AppDetailTabs/Overview";
import { SettingsTab } from "./AppDetailTabs/Settings";
import { AppFileManagerPage } from "./app-file-manager-page";

const OuterContainer = styled("div")({
	height: "100%",
	justifyContent: "center",
	overflow: "scroll",
	width: "100%",
});

const InnerContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	gap: theme.spacing(3),
	margin: "auto",
	maxWidth: "79rem",
	width: "100%",
}));

const ActionBar = styled("div")(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	marginLeft: "auto",
}));

const PageBody = styled("div")({
	//marginLeft: '200px',
	display: "flex",
	flexDirection: "column",
});

const TitleSection = styled("section")(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(2),
	paddingBottom: theme.spacing(2),
	justifyContent: "space-between",
	alignItems: "center",
	flexWrap: "wrap",
}));

const TitleSectionImg = styled("img")(({ theme }) => ({
	borderRadius: theme.spacing(0.75),
	height: "64px",
	width: "64px",
	overflow: "hidden",
}));

const TitleSectionBodyWrapper = styled("div")({
	display: "flex",
	flexDirection: "column",
	gap: "0.5rem",
	justifyContent: "center",
});

const TagsBodyWrapper = styled("div")({
	display: "flex",
	flexWrap: "wrap",
	gap: "0.6rem",
});

const TagsDescription = styled(Typography)(({ theme }) => ({
	paddingBottom: theme.spacing(2),
}));

const StyledContentContainer = styled(Box)(({ theme }) => ({
	width: "100% !important",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(3),
	color: theme.palette.secondary.light,
	"&.MuiBox-root": {
		width: "100%",
	},
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	minHeight: "42px",
	color: theme.palette.secondary.light,
	//borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
	display: "flex",
	justifyContent: "flex-start", // or 'flex-start' if you want left alignment
	borderBottomRadius: "0px",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 11px",
	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));

const StyledTabs = {
	width: "100%",
	borderBottomLeftRadius: "0px",
	borderBottomRightRadius: "0px",
};

const StyledTabsSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	width: "100%",
	flexWrap: "wrap",
	gap: theme.spacing(3),
	padding: "2px",
	backgroundColor: theme.palette.background.paper,
	// boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
}));

const StyledUpdateIcon = styled(UpdateIcon)(({ theme }) => ({
	color: theme.palette.text.disabled,
}));

const StyledLockReset = styled(LockReset)(({ theme }) => ({
	color: theme.palette.background.paper,
}));

const ContainerGrid = styled(Grid)(({ theme }) => ({
	paddingBottom: theme.spacing(2),
	alignItems: "flex-start", // align both columns to top
}));

const DescriptionText = styled(Typography)(({ theme }) => ({
	paddingBottom: theme.spacing(2), // 16px
	color: theme.palette.text.disabled,
}));

const RightColumn = styled(Grid)(() => ({
	display: "flex",
	justifyContent: "flex-end", // push content to the right
}));

const PublisherInfo = styled(Typography)(({ theme }) => ({
	fontSize: theme.typography.pxToRem(14),
	color: "gray",
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-end",
	gap: theme.spacing(0.5),
}));

const HeaderRow = styled("div")({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
});

const StyledInfoOutlined = styled(InfoRounded)(({ theme }) => ({
	cursor: "pointer",
	width: "15px",
	height: "15px",
	color: theme.palette.secondary.dark,
}));

const StyledTypography = styled(Typography)({
	display: "flex",
	alignItems: "center",
	gap: "6px",
});

const StyledStack = styled(Stack)(({ theme }) => ({
	width: "100%",
	padding: theme.spacing(3),
}));

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
	const notification = useNotification();
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
		notification.add({
			color: isError ? "error" : "success",
			message,
		});
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
				notification.add({
					color: "error",
					message: res.output,
				});
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
			notification.add({
				color: "warning",
				message: "Nothing to Save",
			});

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
					notification.add({
						color: "error",
						message: output as string,
					});

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
				notification.add({
					color: "success",
					message: additionalOutput[0].output,
				});

				fetchAppData(appId);
				handleCloseEditDetailsModal();
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error.message,
				});
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
		editor: [
			"Overview",
			"Files",
			"Access Control",
			"Dependencies",
			"MCP Usage",
		],
		readOnly: ["Overview", "Dependencies", "MCP Usage"],
		discoverable: ["Overview"],
	};

	const visibleTabs = TABS_BY_PERMISSION[permission] || ["Overview"];

	return (
		<div>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<OuterContainer>
				<InnerContainer>
					<Breadcrumbs separator="/">
						<Breadcrumbs.Item
							href="#/app"
							underline="none"
							color="inherit"
							variant="body1"
						>
							App Catalog
						</Breadcrumbs.Item>
						<Breadcrumbs.Item
							href={`.`}
							underline="none"
							color="text.disabled"
							variant="body1"
						>
							<div
								title={appInfo?.project_name}
								className="w-[40ch] truncate text-ellipsis"
							>
								{appInfo?.project_name}
							</div>
						</Breadcrumbs.Item>
					</Breadcrumbs>

					<div>
						<PageBody>
							<TitleSection>
								<Box>
									<TitleSectionImg
										src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
										alt="App Image"
									/>
									<TitleSectionBodyWrapper>
										<div
											title={appInfo?.project_name}
											className={
												"mt-1 max-w-[40ch] truncate text-ellipsis font-normal text-[34px] leading-[150%]"
											}
										>
											{appInfo?.project_name}
										</div>
									</TitleSectionBodyWrapper>
								</Box>

								<ActionBar>
									{permission === "author" ? (
										<Button
											disabled={exportLoading}
											startIcon={
												exportLoading ? (
													<CircularProgress size="1em" />
												) : (
													<SimCardDownload />
												)
											}
											variant="outlined"
											onClick={() => exportApp()}
											data-testid={"appDetail-export-btn"}
										>
											Export
										</Button>
									) : (
										<Button
											startIcon={
												responseStatus ? (
													<StyledUpdateIcon />
												) : permission ===
													"discoverable" ? (
													<StyledLockReset />
												) : null
											}
											disabled={
												responseStatus || pendingRequest
											}
											variant={
												responseStatus
													? "outlined"
													: permission ===
															"discoverable"
														? "contained"
														: "outlined"
											}
											onClick={() =>
												setIsChangeAccessModalOpen(true)
											}
											data-testid={"appDetail-access-btn"}
										>
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
												variant="contained"
												startIcon={
													<EditOutlined fontSize="inherit" />
												}
												onClick={() => {
													setIsEditDetailsModalOpen(
														true,
													);
												}}
												data-testid="appDetail-edit-btn"
											>
												Edit
											</Button>
										)}
								</ActionBar>
							</TitleSection>
							<ContainerGrid container spacing={2}>
								<Grid item xs={12} md={8}>
									<DescriptionText variant="body1">
										{appInfo?.description ||
											"No description available"}
									</DescriptionText>
								</Grid>

								<RightColumn item xs={12} md={4}>
									<PublisherInfo variant="body1">
										<span>
											Published by:{" "}
											{appInfo?.project_created_by ||
												"Unknown"}
										</span>
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
									</PublisherInfo>
								</RightColumn>
							</ContainerGrid>

							<TagsDescription variant="body1">
								{tags ? (
									<TagsBodyWrapper>
										{tags.map((tag) => (
											<Chip
												key={`tag-${tag}-${tag}`}
												label={tag}
												variant="outlined"
											/>
										))}
									</TagsBodyWrapper>
								) : (
									<Typography variant="body1">
										No tags available
									</Typography>
								)}
							</TagsDescription>

							<StyledContentContainer>
								<StyledToggleTabsGroup
									value={selectedTab}
									boxSx={StyledTabs}
									onChange={(_e, val) =>
										setSelectedTab(String(val))
									}
								>
									{visibleTabs.includes("Overview") && (
										<StyledToggleTabsGroupItem
											label="Overview"
											value="Overview"
										/>
									)}
									{visibleTabs.includes("Files") && (
										<StyledToggleTabsGroupItem
											label="Files"
											value="Files"
										/>
									)}
									{visibleTabs.includes("Access Control") && (
										<StyledToggleTabsGroupItem
											label="Access Control"
											value="Access Control"
										/>
									)}
									{visibleTabs.includes("Dependencies") && (
										<StyledToggleTabsGroupItem
											label="Dependencies"
											value="Dependencies"
										/>
									)}
									{visibleTabs.includes("Settings") && (
										<StyledToggleTabsGroupItem
											label="Settings"
											value="Settings"
										/>
									)}
									{visibleTabs.includes("SMSS") && (
										<StyledToggleTabsGroupItem
											label="SMSS"
											value="SMSS"
										/>
									)}
									{visibleTabs.includes("MCP Usage") && (
										<StyledToggleTabsGroupItem
											label="MCP Usage"
											value="MCP Usage"
										/>
									)}
								</StyledToggleTabsGroup>
							</StyledContentContainer>
							<StyledTabsSection>
								{selectedTab === "Overview" && (
									<Overview appInfo={appInfo} />
								)}
								{selectedTab === "Files" && (
									<AppFileManagerPage appId={appId || ""} />
								)}
								{selectedTab === "Access Control" && (
									<AccessControl
										appInfo={appInfo}
										appId={appId}
										fetchUserSpecificData={
											fetchUserSpecificData
										}
										permission={permission}
									/>
								)}
								{selectedTab === "Dependencies" && (
									<StyledStack>
										<HeaderRow>
											<StyledTypography variant="h6">
												Dependencies
												<Tooltip
													title={
														appInfo.project_type ===
														"CODE"
															? "Add/Remove dependencies using the Edit Icon"
															: "Add/Remove dependencies using the Variables Tab"
													}
												>
													<StyledInfoOutlined fontSize="small" />
												</Tooltip>
											</StyledTypography>

											{appInfo.project_type === "CODE" &&
												permission === "author" && (
													<IconButton
														size="small"
														onClick={() =>
															setIsEditDependenciesModalOpen(
																true,
															)
														}
														data-testid="appDetail-edit-btn"
													>
														<Edit />
													</IconButton>
												)}
										</HeaderRow>

										<Dependencies
											dependencies={dependencies}
										/>
									</StyledStack>
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
								{selectedTab === "SMSS" && (
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
								)}
								{selectedTab === "MCP Usage" && (
									<SettingsContext.Provider
										value={{
											adminMode: false,
										}}
									>
										<McpUsage id={appId} />
									</SettingsContext.Provider>
								)}
							</StyledTabsSection>
						</PageBody>
					</div>
				</InnerContainer>

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
			</OuterContainer>
		</div>
	);
};
