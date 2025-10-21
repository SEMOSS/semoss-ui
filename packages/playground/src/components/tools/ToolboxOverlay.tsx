import { Close } from "@mui/icons-material";
import type React from "react";
import { useEffect, useState } from "react";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Grid,
	IconButton,
	Link,
	Modal,
	Search,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import LOGO from "@/assets/img/logo.svg";
import type { App, Engine, Toolbox, ToolboxConfig } from "@/types";
import { engineProjectToToolbox } from "./utility";

const ENDPOINT = import.meta.env.ENDPOINT;
const MODULE = import.meta.env.MODULE;
const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

const StyledHolder = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "422px",
	maxHeight: "40vh",
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
	overflow: "auto",
}));

const StyledItem = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	width: "100%",
	height: "130px",
	backgroundColor: theme.palette.background.default,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "transparent",
	borderRadius: theme.shape.borderRadius,
	cursor: "pointer",
}));

const StyledItemImageHolder = styled("div")({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	height: "48px",
	width: "48px",
	overflow: "hidden",
	"& img": {
		height: "100%",
	},
});

const StyledItemDescription = styled(Typography)({
	display: "-webkit-box",
	height: "60px",
	overflow: "hidden",
	WebkitBoxOrient: "vertical",
	WebkitLineClamp: 3,
});

interface ToolboxOverlayProps {
	/** Toolboxes loaded into the room */
	toolboxes: ToolboxConfig[];

	/** Callback triggered when the toolbox model is closed */
	onClose: (success: boolean, toolboxes?: Toolbox[]) => void;
}

export const ToolboxOverlay: React.FC<ToolboxOverlayProps> = (props) => {
	const { toolboxes, onClose } = props;

	const [updatedToolboxes, setUpdatedToolboxes] = useState<
		Record<string, Toolbox>
	>(() => {
		return toolboxes.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});
	});

	const updatedToolboxesArray = Object.values(updatedToolboxes);

	// update when toolboxes change
	useEffect(() => {
		const toolboxesMap = toolboxes.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});

		setUpdatedToolboxes(toolboxesMap);
	}, [toolboxes]);

	const [search, setSearch] = useState<string>("");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the groups
	 */
	const getApps = usePixel<(Engine | App)[]>(
		`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], filterWord=["${debouncedSearch}"])`,
		{
			data: [],
		},
	);
	const availableToolboxes = getApps.data.map(engineProjectToToolbox);

	/**
	 * Track if the toolbox is selected
	 */
	const isToolboxSelected = (toolboxId: string): boolean => {
		return Object.hasOwn(updatedToolboxes, toolboxId);
	};

	/**
	 * Select a toolbox and update the array
	 */
	const onToolboxSelect = (toolbox: Toolbox) => {
		// copy for react
		const updated = { ...updatedToolboxes };

		if (isToolboxSelected(toolbox.id)) {
			// remove it
			delete updated[toolbox.id];
		} else {
			// add it
			updated[toolbox.id] = toolbox;
		}

		setUpdatedToolboxes(updated);
	};

	/**
	 * Select a toolbox and update the array
	 */
	const onToolboxDelete = (t: Toolbox) => {
		// copy for react
		const updated = { ...updatedToolboxes };

		// remove it
		delete updated[t.id];

		setUpdatedToolboxes(updated);
	};

	return (
		<Modal
			open={true}
			onClose={() => onClose(false)}
			aria-labelledby="select tool"
			aria-describedby="select tool"
			maxWidth={"md"}
			fullWidth={true}
			scroll="paper"
		>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">Add Toolbox</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stack direction={"column"} spacing={2}>
					<Modal.ContentText>
						Add existing or create{" "}
						<Link
							variant="inherit"
							target="_blank"
							href={`${PLATFORM_URL}/#/app/new`}
						>
							new
						</Link>{" "}
						toolboxes for the agent. The agent will use toolboxes to
						interact with external sources to help perform actions
						and answer questions.
					</Modal.ContentText>
					<Stack direction={"row"} width={"100%"} spacing={3}>
						<Search
							label="Search"
							size="small"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
							}}
							fullWidth={true}
							sx={{
								flex: 1,
							}}
						/>
					</Stack>
					<StyledHolder>
						{getApps.status === "LOADING" && (
							<CircularProgress color="primary" />
						)}
						{getApps.status === "SUCCESS" && (
							<Grid
								container
								spacing={2}
								// alignItems={'center'}
								// justifyItems={'center'}
								// overflow={'auto'}
								height={"100%"}
							>
								{availableToolboxes.map((toolbox) => (
									<Grid key={toolbox.id} item xs={6}>
										<StyledItem
											onClick={() => {
												onToolboxSelect(toolbox);
											}}
										>
											<Stack
												direction={"row"}
												spacing={1}
											>
												<StyledItemImageHolder>
													{toolbox.type ===
														"PROJECT" && (
														<img
															alt=""
															src={`${ENDPOINT}${MODULE}/api/app-${toolbox.id}/appImage/download`}
															onError={({
																currentTarget,
															}) => {
																currentTarget.onerror =
																	null; // prevents looping
																currentTarget.src =
																	LOGO;
															}}
														/>
													)}
												</StyledItemImageHolder>
												<Typography
													variant="subtitle2"
													sx={{
														flex: 1,
													}}
												>
													{toolbox.name}
												</Typography>
												<Checkbox
													checked={isToolboxSelected(
														toolbox.id,
													)}
													onChange={() => {
														onToolboxSelect(
															toolbox,
														);
													}}
												/>
											</Stack>
											<StyledItemDescription variant="caption">
												{toolbox.description}
											</StyledItemDescription>
											<Stack
												direction="row"
												alignItems="center"
												spacing={0.5}
												height={"24px"}
											>
												{toolbox.tags.map((tag) => (
													<Chip
														key={tag}
														color="default"
														size="small"
														label={tag}
													/>
												))}
											</Stack>
										</StyledItem>
									</Grid>
								))}
							</Grid>
						)}
					</StyledHolder>
					{updatedToolboxesArray.length > 0 && (
						<>
							<Typography variant="body1" fontWeight={"medium"}>
								Selected
							</Typography>
							<Stack
								direction={"row"}
								spacing={1}
								flexWrap={"wrap"}
							>
								{updatedToolboxesArray.map((t) => (
									<Chip
										key={t.id}
										label={t.name}
										size={"small"}
										onDelete={() => {
											// should delete since it is selected
											onToolboxDelete(t);
										}}
									/>
								))}
							</Stack>
						</>
					)}
				</Stack>
			</Modal.Content>
			<Modal.Actions>
				<Button variant="text" onClick={() => onClose(false)}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={() => {
						// get the new keys
						const updated = Object.values(updatedToolboxes);

						onClose(true, updated);
					}}
				>
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
