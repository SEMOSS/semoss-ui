import { Edit } from "@mui/icons-material";
import BlockIcon from "@mui/icons-material/Block";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Env } from "@semoss/sdk";
import { Box, Chip, Link, Stack, styled, Typography } from "@semoss/ui";
import type { modelledDependency } from "@/components/app";
import { EngineAccessButton } from "@/components/engine";
import { EngineContext } from "@/contexts/EngineContext";
import type { ENGINE_TYPES, Role } from "@/types";

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
}: {
	dependencies: modelledDependency[];
}) => {
	const toCapitalized = (word: string): string => {
		if (!word) return "";
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	};
	return (
		<RootStack spacing={2}>
			{dependencies.length === 0 ? (
				<StyledTypographyPrimary variant="body1" color="textSecondary">
					No Dependencies Found
				</StyledTypographyPrimary>
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
										<Stack direction="row" spacing={1}>
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
