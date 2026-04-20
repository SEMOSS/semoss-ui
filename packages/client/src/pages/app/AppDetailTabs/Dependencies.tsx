import { Edit, WarningAmberRounded } from "@mui/icons-material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BlockIcon from "@mui/icons-material/Block";
import PersonIcon from "@mui/icons-material/Person";
import ViewListIcon from "@mui/icons-material/ViewList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { Env } from "@semoss/sdk";
import {
	Box,
	Chip,
	FormControlLabel,
	Link,
	Stack,
	Switch,
	styled,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@semoss/ui";
import type { modelledDependency } from "@/components/app";
import { EngineAccessButton } from "@/components/engine";
import { EngineContext } from "@/contexts/EngineContext";
import { useRootStore } from "@/hooks";
import type { ENGINE_TYPES, Role } from "@/types";

interface NestedDependency {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype?: string;
	parent_id?: string;
	permission?: number;
	permission_name?: string;
	engine_discoverable?: boolean;
	can_view_dependencies?: boolean;
	circular_reference?: boolean;
	circular_reference_to?: string;
	dependencies?: NestedDependency[];
}

const StyledIcon = styled("span")(({ theme }) => ({
	display: "inline-flex",
	color: theme.palette.secondary.main,
	width: 16,
	height: 16,
	"& svg": {
		fontSize: theme.typography.pxToRem(16),
		width: "100%",
		height: "100%",
	},
}));

const StyledCardImage = styled("img")({
	display: "flex",
	width: "48px",
	height: "48px",
	borderRadius: "8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",

	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
});

export const PERMISSION_ICONS = {
	OWNER: (
		<StyledIcon>
			<PersonIcon fontSize="small" />
		</StyledIcon>
	),
	READ_ONLY: (
		<StyledIcon>
			<VisibilityIcon fontSize="small" />
		</StyledIcon>
	),
	EDIT: (
		<StyledIcon>
			<Edit fontSize="small" />
		</StyledIcon>
	),
	NONE: (
		<StyledIcon>
			<BlockIcon fontSize="small" />
		</StyledIcon>
	),
};

const StyledContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
	padding: "10px",
	margin: "24px",
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: "12px",
	bgcolor: "background.paper",
	width: "100%",
	gap: "16px",
}));

const StyledOutline = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "8px",
	marginBottom: "16px",
});

const StyledTypography = styled(Typography)({
	color: "primary.main",
	fontSize: 16,
});

const StyledIcons = styled(Box)({
	display: "flex",
	alignItems: "center",
});

const StyledStatus = styled(Typography)(({ theme }) => ({
	fontSize: 12,
	marginLeft: "2px",
	color: theme.palette.secondary.dark,
}));

const StyledStack = styled(Stack)({
	marginLeft: "8px",
	justifyContent: "space-between",
	width: "100%",
});

const RootStack = styled(Stack)({
	width: "100%",
});

const StyledBox = styled(Box)({
	flex: 1,
});

const StyledText = styled(Typography)(({ theme }) => ({
	marginLeft: theme.spacing(0.0625), // ~0.5px
}));

const StyledSecondaryText = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledTypographyPrimary = styled(Typography)({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
});

export const Dependencies = ({
	dependencies,
	currentAppId,
	currentAppName,
}: {
	dependencies: modelledDependency[];
	currentAppId?: string;
	currentAppName?: string;
}) => {
	const [viewMode, setViewMode] = useState<"list" | "graph">("list");
	const [nestedDeps, setNestedDeps] = useState<NestedDependency[] | null>(
		null,
	);
	const [loadingGraph, setLoadingGraph] = useState(false);
	const [showAllDeps, setShowAllDeps] = useState(false);
	const { monolithStore, configStore } = useRootStore();

	const isAdmin = configStore.store.user.admin;

	const toCapitalized = (word: string): string => {
		if (!word) return "";
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	};

	// Fetch nested dependencies for graph view
	useEffect(() => {
		if (viewMode === "graph" && currentAppId && !nestedDeps) {
			setLoadingGraph(true);
			// Use admin reactor if user is admin and toggle is on
			const pixel =
				isAdmin && showAllDeps
					? `GetAllProjectDependencies(project=["${currentAppId}"]);`
					: `GetProjectDependencies(project="${currentAppId}");`;
			monolithStore
				.runQuery(pixel)
				.then((response) => {
					const output = response?.pixelReturn?.[0]?.output as
						| {
								project_id: string;
								dependencies: NestedDependency[];
						  }
						| undefined;
					if (output?.dependencies) {
						setNestedDeps(output.dependencies);
					}
				})
				.catch((error) => {
					console.error("Error fetching nested dependencies:", error);
				})
				.finally(() => {
					setLoadingGraph(false);
				});
		}
	}, [
		viewMode,
		currentAppId,
		nestedDeps,
		monolithStore,
		isAdmin,
		showAllDeps,
	]);

	// Reset nested deps when admin toggle changes
	useEffect(() => {
		if (viewMode === "graph" && showAllDeps !== undefined) {
			setNestedDeps(null);
		}
	}, [showAllDeps, viewMode]);

	return (
		<RootStack spacing={2}>
			{dependencies.length > 0 && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
					}}
				>
					{isAdmin && viewMode === "graph" && (
						<Tooltip
							title="Show all dependencies including those you don't have access to"
							arrow
						>
							<FormControlLabel
								control={
									<Switch
										checked={showAllDeps}
										onChange={(
											e: ChangeEvent<HTMLInputElement>,
										) => setShowAllDeps(e.target.checked)}
										size="small"
										color="primary"
									/>
								}
								label={
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
										}}
									>
										<AdminPanelSettingsIcon fontSize="small" />
										<Typography variant="body2">
											Admin: Show All Dependencies
										</Typography>
									</Box>
								}
							/>
						</Tooltip>
					)}
					<Box sx={{ marginLeft: "auto" }}>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							size="small"
							color="primary"
							aria-label="view mode"
						>
							<ToggleButton
								value="list"
								aria-label="list view"
								onClick={() => setViewMode("list")}
							>
								<ViewListIcon sx={{ mr: 1 }} />
								List
							</ToggleButton>
							<ToggleButton
								value="graph"
								aria-label="graph view"
								onClick={() => setViewMode("graph")}
							>
								<AccountTreeIcon sx={{ mr: 1 }} />
								Graph
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>
			)}

			{dependencies.length === 0 ? (
				<StyledTypographyPrimary variant="body1" color="textSecondary">
					No Dependencies Found
				</StyledTypographyPrimary>
			) : viewMode === "graph" ? (
				currentAppId && currentAppName ? (
					loadingGraph ? (
						<StyledTypographyPrimary
							variant="body1"
							color="textSecondary"
						>
							Loading dependency graph...
						</StyledTypographyPrimary>
					) : nestedDeps ? (
						// Legacy graph view - replaced by new implementation in app-detail-page.tsx
						<StyledTypographyPrimary
							variant="body1"
							color="textSecondary"
						>
							Graph view not available in legacy component
						</StyledTypographyPrimary>
					) : (
						<StyledTypographyPrimary
							variant="body1"
							color="textSecondary"
						>
							Loading app information...
						</StyledTypographyPrimary>
					)
				) : (
					<StyledTypographyPrimary
						variant="body1"
						color="textSecondary"
					>
						Loading app information...
					</StyledTypographyPrimary>
				)
			) : (
				dependencies.map((dep) => {
					const permissionKey = dep.userPermission || "NONE";
					return (
						<StyledContainer key={dep.id}>
							<StyledBox>
								<StyledOutline>
									<StyledCardImage
										src={
											dep.type === "PROJECT"
												? `${Env.MODULE}/api/project-${dep.id}/projectImage/download`
												: `${Env.MODULE}/api/e-${dep.id}/image/download`
										}
										alt={dep.name}
									/>
									<Box>
										<StyledTypography variant="subtitle1">
											<Link
												href={
													dep.type === "PROJECT"
														? `./#/app/${dep.id}`
														: `./#/engine/${dep.type}/${dep.id}`
												}
											>
												<StyledText variant="body2">
													{dep.name}
												</StyledText>
											</Link>
										</StyledTypography>
										<StyledIcons>
											{PERMISSION_ICONS[permissionKey]}
											<StyledStatus variant="subtitle1">
												{toCapitalized(
													dep.userPermission ||
														"NONE",
												)}
											</StyledStatus>
										</StyledIcons>
									</Box>
									<StyledStack direction="row" spacing={1}>
										<Stack
											direction="row"
											spacing={1}
											alignItems="center"
										>
											{dep.can_view_dependencies ===
												false && (
												<Tooltip
													arrow
													title={`You don't have access to all dependencies of this ${dep.type.toLowerCase()}, so functionality may be limited. Visit its details page for more information.`}
												>
													<WarningAmberRounded color="warning" />
												</Tooltip>
											)}
											{dep.isPublic && (
												<Chip label="Public" />
											)}
											{!dep.isPublic &&
												dep.isDiscoverable && (
													<Chip label="Discoverable" />
												)}
											{!dep.isPublic &&
												!dep.isDiscoverable && (
													<>
														<Chip label="Non-Discoverable" />
														<Chip label="Private" />
													</>
												)}
											<Chip
												label={toCapitalized(dep.type)}
											/>
										</Stack>
										<EngineContext.Provider
											value={{
												type: dep.type as ENGINE_TYPES,
												name: dep.name,
												path: "",
												active: {
													id: dep.id,
													role: dep.userPermission as Role,
													name: dep.name,
													metadata: {},
													refresh: () => {},
												},
											}}
										>
											<EngineAccessButton
												fromApp={true}
											/>
										</EngineContext.Provider>
									</StyledStack>
								</StyledOutline>

								<StyledSecondaryText variant="body2">
									{dep.description &&
									dep.description.trim() !== ""
										? dep.description
										: "No Description Available"}
								</StyledSecondaryText>
							</StyledBox>
						</StyledContainer>
					);
				})
			)}
		</RootStack>
	);
};
