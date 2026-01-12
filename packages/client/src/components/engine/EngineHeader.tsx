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
	Modal,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useEngine, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { EditEngineDetails, EngineAccessButton, EngineMCPButton } from ".";

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
	const [openExportModal, setOpenExportModal] = useState(false);

	// export loading state
	const [exportLoading, setExportLoading] = useState(false);

	/**
	 * @name exportDB
	 * @desc export DB pixel
	 */
	const exportDB = (includeData: boolean) => {
		setExportLoading(true);
		const pixel = `META | ExportEngine(engine=["${
			active.id
		}"], includeData="${includeData ? "true" : "false"}" );`;

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
						<Typography variant="h4" data-testid="Title">
							{active.name}
						</Typography>
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
									data-testid={formatToDataTestId(
										`engineHeader-${name}-export-btn`,
									)}
									variant="outlined"
									onClick={() => {
										const engineType =
											active.metadata.database_subtype;
										if (engineType === "H2_DB") {
											setOpenExportModal(true);
										} else {
											exportDB(false);
										}
									}}
								>
									Export
								</Button>
							)}
							<EngineMCPButton />
							<EditEngineDetails />
						</Stack>
					</Stack>
					<Modal
						open={openExportModal}
						maxWidth="sm"
						fullWidth
						onClose={() => setOpenExportModal(false)}
						aria-labelledby="export-modal-title"
						aria-describedby="export-modal-description"
					>
						<Modal.Title>
							<Typography id={"export-modal-title"} variant="h6">
								Export Engine
							</Typography>
						</Modal.Title>
						<Modal.Content>
							<Typography
								id={"export-modal-description"}
								variant="body1"
								sx={{ mb: 2 }}
							>
								Do you want to export data along with the
								database?
							</Typography>
						</Modal.Content>
						<Modal.Actions>
							<Button
								variant="contained"
								color="primary"
								onClick={() => {
									setOpenExportModal(false);
									exportDB(true);
								}}
							>
								Yes
							</Button>
							<Button
								variant="outlined"
								color="secondary"
								onClick={() => {
									setOpenExportModal(false);
									exportDB(false);
								}}
							>
								No
							</Button>
						</Modal.Actions>
					</Modal>
					<Stack
						flex={1}
						direction="row"
						alignItems={"center"}
						spacing={0.5}
					>
						<Typography
							variant="body2"
							data-testid={`engineHeader-${name}-id`}
						>
							{active.id}
						</Typography>
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
					<StyledInfoDescription
						variant={"subtitle1"}
						data-testid="Description"
					>
						{(active.metadata.description as unknown as string) ||
							""}
					</StyledInfoDescription>

					<Stack direction="row" spacing={1} flexWrap={"wrap"}>
						{active.metadata.tag &&
							(active.metadata.tag as string[]).map((tag, i) => {
								if (tag === "") return null;
								return (
									<Chip
										key={tag}
										label={tag}
										color="default"
										size="small"
										variant="outlined"
										data-testid="tag-chip"
									/>
								);
							})}
					</Stack>
				</StyledInfoLeft>
				<StyledInfoRight>
					<Stack alignItems={"flex-end"} spacing={1}>
						{active?.PERMISSIONGRANTEDBY ? (
							<Typography
								variant={"caption"}
								color="disabled"
								data-testid="PublishedBy"
							>
								{`Published by ${active.PERMISSIONGRANTEDBY}`}
							</Typography>
						) : (
							<Typography
								variant={"caption"}
								color="disabled"
								data-testid="CreatedBy"
							>
								{`Created by ${active.database_created_by}`}
							</Typography>
						)}
						{active?.DATEADDED && (
							<Typography
								variant={"caption"}
								color="disabled"
								data-testid="DateAdded"
							>
								{`on ${active.DATEADDED}`}
							</Typography>
						)}
					</Stack>
				</StyledInfoRight>
			</StyledInfo>
		</>
	);
};
