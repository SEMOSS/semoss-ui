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
import type { App, Engine, MCP, MCPConfig } from "@/types";
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
	/** Tools loaded into the room */
	mcp: MCPConfig[];

	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, mcp?: MCP[]) => void;
}

export const ToolboxOverlay: React.FC<ToolboxOverlayProps> = (props) => {
	const { mcp, onClose } = props;

	const [updatedMCP, setUpdatedMCP] = useState<Record<string, MCP>>(() => {
		return mcp.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});
	});

	const updatedMCPArray = Object.values(updatedMCP);

	// update when mcps change
	useEffect(() => {
		const mcpMap = mcp.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});

		setUpdatedMCP(mcpMap);
	}, [mcp]);

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
	const availableMCPs = getApps.data.map(engineProjectToToolbox);

	/**
	 * Track if the MCP is selected
	 */
	const isMCPSelected = (mcpId: string): boolean => {
		return Object.hasOwn(updatedMCP, mcpId);
	};

	/**
	 * Select a mcp and update the array
	 */
	const onMCPSelect = (mcp: MCP) => {
		// copy for react
		const updated = { ...updatedMCP };

		if (isMCPSelected(mcp.id)) {
			// remove it
			delete updated[mcp.id];
		} else {
			// add it
			updated[mcp.id] = mcp;
		}

		setUpdatedMCP(updated);
	};

	/**
	 * Select a mcp and update the array
	 */
	const onMCPDelete = (mcp: MCP) => {
		// copy for react
		const updated = { ...updatedMCP };

		// remove it
		delete updated[mcp.id];

		setUpdatedMCP(updated);
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
					<Typography variant="h6">Add MCP</Typography>
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
						MCPs for the agent. The agent will use MCPs to interact
						with external sources to help perform actions and answer
						questions.
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
								{availableMCPs.map((mcp) => (
									<Grid key={mcp.id} item xs={6}>
										<StyledItem
											onClick={() => {
												onMCPSelect(mcp);
											}}
										>
											<Stack
												direction={"row"}
												spacing={1}
											>
												<StyledItemImageHolder>
													{mcp.type === "PROJECT" && (
														<img
															alt=""
															src={`${ENDPOINT}${MODULE}/api/app-${mcp.id}/appImage/download`}
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
													{mcp.name}
												</Typography>
												<Checkbox
													checked={isMCPSelected(
														mcp.id,
													)}
													onChange={() => {
														onMCPSelect(mcp);
													}}
												/>
											</Stack>
											<StyledItemDescription variant="caption">
												{mcp.description}
											</StyledItemDescription>
											<Stack
												direction="row"
												alignItems="center"
												spacing={0.5}
												height={"24px"}
											>
												{mcp.tags.map((tag) => (
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
					{updatedMCPArray.length > 0 && (
						<>
							<Typography variant="body1" fontWeight={"medium"}>
								Selected
							</Typography>
							<Stack
								direction={"row"}
								spacing={1}
								flexWrap={"wrap"}
							>
								{updatedMCPArray.map((mcp) => (
									<Chip
										key={mcp.id}
										label={mcp.name}
										size={"small"}
										onDelete={() => {
											// should delete since it is selected
											onMCPDelete(mcp);
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
						const updated = Object.values(updatedMCP);

						onClose(true, updated);
					}}
				>
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
