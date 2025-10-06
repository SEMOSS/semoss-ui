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
import type { App, Engine, Tool } from "@/types";

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

const StyledItemImageHolder = styled("div")(({ theme }) => ({
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
}));

const StyledItemDescription = styled(Typography)(({ theme }) => ({
	display: "-webkit-box",
	height: "60px",
	overflow: "hidden",
	WebkitBoxOrient: "vertical",
	WebkitLineClamp: 3,
}));

interface ToolsOverlayProps {
	/** Knowledge loaded into the room */
	tools: Tool[];

	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, tools?: Tool[]) => void;
}

/**
 * Get a unique key for a tool
 * @param tool The tool to get the key for
 * @returns The unique key for the tool
 */
const getTool = (item: Engine | App): Tool => {
	let id = "";
	let name = "";
	let type: Tool["type"] = "DATABASE";

	// Type guard to check if item is App
	if ("project_id" in item && "project_name" in item) {
		id = item.project_id;
		type = "APP";
		name = item.project_name;
	} else if ("app_id" in item && "app_name" in item) {
		id = item.app_id;
		name = item.app_name;
		type = item.app_type;
	}

	return {
		id: id,
		type: type,
		name: name,
		description: "",
		tags: [],
	};
};

export const ToolsOverlay: React.FC<ToolsOverlayProps> = (props) => {
	const { tools, onClose } = props;

	const [updatedTools, setUpdatedTools] = useState<Record<string, Tool>>(
		() => {
			return tools.reduce((acc, val) => {
				acc[val.id] = val;

				return acc;
			}, {});
		},
	);

	const updatedToolsArray = Object.values(updatedTools);

	// update when tools change
	useEffect(() => {
		const toolsMap = tools.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});

		setUpdatedTools(toolsMap);
	}, [tools]);

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

	/**
	 * Track if the tool is selected
	 */
	const isToolSelected = (toolId: string): boolean => {
		return Object.hasOwn(updatedTools, toolId);
	};

	/**
	 * Select a tool and update the arraw
	 */
	const onToolSelect = (tool: Tool) => {
		// copy for react
		const updated = { ...updatedTools };

		if (isToolSelected(tool.id)) {
			// remove it
			delete updated[tool.id];
		} else {
			// add it
			updated[tool.id] = tool;
		}

		setUpdatedTools(updated);
	};

	/**
	 * Select a tool and update the arraw
	 */
	const onToolDelete = (t: Tool) => {
		// copy for react
		const updated = { ...updatedTools };

		// remove it
		delete updated[t.id];

		setUpdatedTools(updated);
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
					<Typography variant="h6">Add Tools</Typography>
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
						tools for the agent. The agent will use tools to
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
								{getApps.data.map((item) => {
									const tool = getTool(item);

									return (
										<Grid key={tool.id} item xs={6}>
											<StyledItem
												onClick={() => {
													onToolSelect(tool);
												}}
											>
												<Stack
													direction={"row"}
													spacing={1}
												>
													<StyledItemImageHolder>
														{tool.type ===
															"APP" && (
															<img
																alt=""
																src={`${ENDPOINT}${MODULE}/api/app-${tool.id}/appImage/download`}
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
														{tool.name}
													</Typography>
													<Checkbox
														checked={isToolSelected(
															tool.id,
														)}
														onChange={() => {
															onToolSelect(tool);
														}}
													/>
												</Stack>
												<StyledItemDescription variant="caption">
													{tool.description}
												</StyledItemDescription>
												<Stack
													direction="row"
													alignItems="center"
													spacing={0.5}
													height={"24px"}
												>
													{tool.tags.map((tag) => (
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
									);
								})}
							</Grid>
						)}
					</StyledHolder>
					{updatedToolsArray.length > 0 && (
						<>
							<Typography variant="body1" fontWeight={"medium"}>
								Selected
							</Typography>
							<Stack
								direction={"row"}
								spacing={1}
								flexWrap={"wrap"}
							>
								{updatedToolsArray.map((t) => (
									<Chip
										key={t.id}
										label={t.name}
										size={"small"}
										onDelete={() => {
											// should delete since it is selected
											onToolDelete(t);
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
						const updated = Object.values(updatedTools);

						onClose(true, updated);
					}}
				>
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
