import { ContentCopyOutlined, SimCardDownload } from "@mui/icons-material";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Breadcrumbs,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useEngine, useRootStore } from "@/hooks";
import { EditEngineDetails, EngineAccessButton } from ".";
import { formatToDataTestId } from "@/utility";

const StyledName = styled(Stack)(({ theme }) => ({
	width: "100%",
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(1),
}));

const StyledInfo = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	marginBottom: theme.spacing(4),
	overflow: "hidden",
}));

const StyledInfoLeft = styled("div")(({ theme }) => ({
	flex: 1,
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",
	gap: theme.spacing(1),
}));

const StyledInfoRight = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	width: "288px",
}));

const StyledInfoDescription = styled(Typography)(({ theme }) => ({
	minHeight: "80px",
	maxWidth: "699px",
	maxHeight: "174px",
	color: theme.palette.text.secondary,
	textOverflow: "ellipsis",
	overflow: "hidden",
	whiteSpace: "normal",
}));

/**
 * Engine Header
 */
export const EngineHeader: React.FC = () => {
	// get the engine information
	const { name, active, type } = useEngine();

	// Service for Axios calls
	const { monolithStore } = useRootStore();

	// notification
	const notification = useNotification();

	// export loading state
	const [exportLoading, setExportLoading] = useState(false);

	/**
	 * @name exportDB
	 * @desc export DB pixel
	 */
	const exportDB = () => {
		setExportLoading(true);
		const pixel = `META | ExportEngine(engine=["${active.id}"] );`;

		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0].output,
				insightId = response.insightId;

			const formattedEngineType =
				type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

			monolithStore
				.download(insightId, output)
				.then(() => {
					if (output && response.errors.length === 0) {
						notification.add({
							color: "success",
							message: `${formattedEngineType} engine downloaded successfully`,
						});
					}
					setExportLoading(false);
				})
				.catch(() => {
					notification.add({
						color: "error",
						message: `${formattedEngineType} engine download failed`,
					});
					setExportLoading(false);
				});
		});
		setExportLoading(false);
	};

	return (
		<>
			<Stack direction="column" spacing={1}>
				<Breadcrumbs separator={"/"}>
					<Breadcrumbs.Item
						//@ts-expect-error: TODO FIX Type
						as={Link}
						to={`..`}
						underline="none"
						color="inherit"
						variant="body1"
					>
						{name} Catalog
					</Breadcrumbs.Item>
					<Breadcrumbs.Item
						//@ts-expect-error: TODO FIX Type
						as={Link}
						to={`.`}
						underline="none"
						color="text.disabled"
						variant="body1"
					>
						{active.name}
					</Breadcrumbs.Item>
				</Breadcrumbs>
				<StyledName direction="column" spacing={0}>
					<Stack direction="row" alignItems={"center"}>
						<Typography variant="h4">{active.name}</Typography>
						<Stack flex={1}> &nbsp;</Stack>
						<Stack direction="row" spacing={2}>
							<EngineAccessButton />
							{active.role === "OWNER" && (
								<Button
									disabled={exportLoading}
									startIcon={
										exportLoading ? (
											<CircularProgress size="1em" />
										) : (
											<SimCardDownload />
										)
									}
									data-testid={formatToDataTestId(`engineHeader-${name}-export-btn`)}
									variant="outlined"
									onClick={() => exportDB()}
								>
									Export
								</Button>
							)}
							<EditEngineDetails />
						</Stack>
					</Stack>
					<Stack
						flex={1}
						direction="row"
						alignItems={"center"}
						spacing={0.5}
					>
						<Typography variant="body2">{active.id}</Typography>
						<IconButton
							aria-label={`copy ${name} ID`}
							size="small"
							data-testid={`engineHeader-copy-${name}-id-btn`}
							onClick={(e) => {
								// prevent the default action
								e.preventDefault();

								// copy
								try {
									navigator.clipboard.writeText(active.id);

									notification.add({
										color: "success",
										message: "Successfully copied ID",
									});
								} catch (e) {
									console.error(e);

									notification.add({
										color: "error",
										message: "Error copyng ID",
									});
								}
							}}
						>
							<Tooltip title={`Copy ${name} ID`}>
								<ContentCopyOutlined fontSize="inherit" />
							</Tooltip>
						</IconButton>
					</Stack>
				</StyledName>
			</Stack>
			<StyledInfo>
				<StyledInfoLeft>
					<StyledInfoDescription variant={"subtitle1"}>
						{(active.metadata.description as unknown as string) ||
							""}
					</StyledInfoDescription>

					<Stack direction="row" spacing={1}>
						{active.metadata.tag &&
							(active.metadata.tag as string[]).map((tag, i) => {
								if (i < 2)
									return (
										<Chip
											key={i}
											label={tag}
											color="default"
											size="small"
											variant="outlined"
										/>
									);
							})}
					</Stack>
				</StyledInfoLeft>
				<StyledInfoRight>
					<Stack alignItems={"flex-end"} spacing={1}>
						{active.metadata?.DATEADDED &&
						active.metadata?.PERMISSIONGRANTEDBY ? (
							<>
								<Typography
									variant={"caption"}
									color="disabled"
								>
									{`Updated by ${active.metadata.PERMISSIONGRANTEDBY}`}
								</Typography>
								<Typography
									variant={"caption"}
									color="disabled"
								>
									{`at ${active.metadata.DATEADDED}`}
								</Typography>
							</>
						) : (
							<>
								<Typography
									variant={"caption"}
									color="disabled"
								>
									No updates since creation
								</Typography>
							</>
						)}
					</Stack>
				</StyledInfoRight>
			</StyledInfo>
		</>
	);
};
