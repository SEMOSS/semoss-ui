import {
	Add,
	AutoFixHighOutlined,
	FilterListRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useBlocks, VARIABLE_TYPES, type Variable } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Box,
	Button,
	Checkbox,
	Checklist,
	CircularProgress,
	IconButton,
	List,
	Modal,
	Popover,
	Search,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { AddVariablePopover, NotebookVariable } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { usePixel, useWorkspace } from "@/hooks";
import { suggestVariableRenames } from "../utils";

interface LLMResponse {
	response: string;
}

const StyledStack = styled(Stack)(() => ({
	maxHeight: "100%",
}));

const StyledButton = styled(Button)(() => ({
	width: "100px",
}));

const StyledMenu = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	paddingTop: theme.spacing(1),
	backgroundColor: theme.palette.background.paper,
	overflowY: "scroll",
}));

const StyledMenuTitle = styled(Typography)(() => ({}));

const StyledTitleSpan = styled("span")(() => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFamily: "Inter",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontStyle: "normal",
	fontSize: "13px",
	lineHeight: "18px",
	fontWeight: 400,
	marginTop: "8px",
	letterSpacing: "0.16px",
	marginBottom: "8px",
}));

const StyledMenuScroll = styled("div")(({ theme }) => ({
	flex: "1",
	width: "100%",
	paddingBottom: theme.spacing(1),
	overflowX: "hidden",
	overflowY: "auto",
}));

const StyledBox = styled(Box)(({ theme }) => ({
	height: "300px",
	overflow: "scroll",
	marginLeft: theme.spacing(2),
	marginTop: theme.spacing(2),
	marginBottom: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: " #EBF4FE",
	width: "fit-content",
	marginTop: "8px",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	marginBottom: "8px",
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
}));

interface VariablePanelProps {
	title: string;
}

/**
 * Render the variables menu
 */
export const VariablesPanel = observer(
	(props: VariablePanelProps): JSX.Element => {
		const { title } = props;

		const { state } = useBlocks();
		const { workspace } = useWorkspace();

		/**
		 * State
		 */
		const [popoverAnchorEle, setPopoverAnchorEl] =
			useState<HTMLElement | null>(null);
		const [filterAnchorEl, setFilterAnchorEl] =
			useState<HTMLElement | null>(null);
		const [engines, setEngines] = useState<{
			models: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			databases: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			storages: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			functions: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			vectors: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
		}>({
			models: [],
			databases: [],
			storages: [],
			functions: [],
			vectors: [],
		});
		const [filterWord, setFilterWord] = useState("");
		const [selectedFilter, setSelectedFilter] = useState(VARIABLE_TYPES);

		// New state for the rename modal
		const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
		const [suggestedChanges, setSuggestedChanges] = useState<
			Record<string, string>
		>({});
		const [selectedChanges, setSelectedChanges] = useState<
			Record<string, boolean>
		>({});
		const [isProcessing, setIsProcessing] = useState(false);

		const [llmLoad, setLLMLoad] = useState<boolean>(false);

		/**
		 * API
		 */
		const getEngines =
			usePixel<
				{
					app_id: string;
					app_name: string;
					app_type: string;
					app_subtype: string;
				}[]
			>(`MyEngines();`);

		/**
		 * Computed
		 */
		const isFilterPopoverOpen = Boolean(filterAnchorEl);
		const isPopoverOpen = Boolean(popoverAnchorEle);

		/**
		 * Effects/Memos
		 */
		useEffect(() => {
			if (getEngines.status !== "SUCCESS") {
				return;
			}
			const cleanedEngines = getEngines.data.map((d) => ({
				app_name: d.app_name ? d.app_name.replace(/_/g, " ") : "",
				app_id: d.app_id,
				app_type: d.app_type,
				app_subtype: d.app_subtype,
			}));

			const newEngines = {
				models: cleanedEngines.filter((e) => e.app_type === "MODEL"),
				databases: cleanedEngines.filter(
					(e) => e.app_type === "DATABASE",
				),
				storages: cleanedEngines.filter(
					(e) => e.app_type === "STORAGE",
				),
				functions: cleanedEngines.filter(
					(e) => e.app_type === "FUNCTION",
				),
				vectors: cleanedEngines.filter((e) => e.app_type === "VECTOR"),
			};

			setEngines(newEngines);
		}, [getEngines.status, getEngines.data]);

		const variables = useMemo(() => {
			return Object.entries(state.variables)
				.filter(
					([id, val]) =>
						id.includes(filterWord) &&
						selectedFilter.indexOf(val.type) > -1,
				)
				.sort((a, b) => a[0].localeCompare(b[0]));
		}, [
			filterWord,
			selectedFilter.length,
			Object.values(state.variables),
			Object.entries(state.variables).length,
			Object.keys(state.variables).join(""),
		]);

		/**
		 * Handle opening the rename modal and getting suggestions
		 */
		const handleOpenRenameModal = async () => {
			setLLMLoad(true);
			try {
				const changes = await suggestVariableRenames(
					state,
					workspace.agentModelEngine,
				);

				if (typeof changes === "object" && changes !== null) {
					const changesRecord = changes as Record<string, string>;
					setSuggestedChanges(changesRecord);

					// Initialize all changes as selected (true)
					const initialSelection: Record<string, boolean> = {};
					Object.keys(changesRecord).forEach((key) => {
						initialSelection[key] = true;
					});
					setSelectedChanges(initialSelection);

					setIsRenameModalOpen(true);
				}
				setLLMLoad(false);
			} catch (error) {
				console.error("Error getting suggested changes:", error);
				setLLMLoad(false);
			}
		};

		/**
		 * Handle applying the selected changes
		 */
		const handleApplyChanges = async () => {
			workspace.setLoading(true);
			try {
				// Filter only the selected changes
				const changesToApply: Record<string, string> = {};
				Object.entries(suggestedChanges).forEach(
					([oldName, newName]) => {
						if (selectedChanges[oldName]) {
							changesToApply[oldName] = newName;
						}
					},
				);

				if (Object.keys(changesToApply).length > 0) {
					// TODO: Refactor this and go off of cell and variable class functions
					const success = await (state as any).applyVariableRenames(
						changesToApply,
					);
					// if (success) {
					setIsRenameModalOpen(false);
					setSuggestedChanges({});
					setSelectedChanges({});
					// }
				}
			} catch (error) {
				console.error("Error applying changes:", error);
			} finally {
				workspace.setLoading(false);
			}
		};

		/**
		 * Handle toggling a change selection
		 */
		const handleToggleChange = (oldName: string) => {
			setSelectedChanges((prev) => ({
				...prev,
				[oldName]: !prev[oldName],
			}));
		};

		return (
			<Panel>
				<StyledStack
					direction={"column"}
					spacing={0}
					className="notebook-variables-menu"
				>
					<StyledTitle>
						<StyledTitleSpan>{title}</StyledTitleSpan>
					</StyledTitle>
					<StyledMenu>
						<Stack
							spacing={2}
							paddingLeft={2}
							paddingBottom={1}
							paddingRight={2}
						>
							<Search
								size={"small"}
								placeholder="Search"
								onChange={(e) => {
									setFilterWord(e.target.value);
								}}
							/>
						</Stack>
						<Stack spacing={2} paddingLeft={2}>
							<StyledButton
								color={"secondary"}
								onClick={(e) => {
									setFilterAnchorEl(e.currentTarget);
								}}
							>
								<Stack direction={"row"} gap={1}>
									<FilterListRounded />
									Types
								</Stack>
							</StyledButton>
							<Popover
								id={"filter-variable-popover"}
								open={isFilterPopoverOpen}
								anchorEl={filterAnchorEl}
								onClose={() => {
									setFilterAnchorEl(null);
								}}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "center",
								}}
							>
								<StyledBox>
									<Checklist
										direction={"column"}
										options={VARIABLE_TYPES}
										checked={selectedFilter}
										onChange={(selected) => {
											setSelectedFilter(selected);
										}}
									/>
								</StyledBox>
							</Popover>
						</Stack>
						<Stack spacing={2} padding={2}>
							<Stack
								direction="row"
								justifyContent="space-between"
								alignItems={"center"}
							>
								<StyledMenuTitle variant="h6">
									Variables
								</StyledMenuTitle>
								<Stack direction="row" spacing={1}>
									<IconButton
										size="small"
										disabled={
											!workspace.agentModelEngine ||
											isProcessing
										}
										onClick={handleOpenRenameModal}
									>
										{llmLoad ? (
											<CircularProgress
												size="1.5rem"
												color="secondary"
											/>
										) : (
											<AutoFixHighOutlined />
										)}
									</IconButton>
									<IconButton
										className="notebook-variable-menu__add-variable-button"
										onClick={(e) => {
											setPopoverAnchorEl(e.currentTarget);
										}}
									>
										<Add />
									</IconButton>
								</Stack>
							</Stack>
						</Stack>

						<StyledMenuScroll>
							<List disablePadding>
								{variables.map((keyValue, index) => {
									const id = keyValue[0];
									const variable = keyValue[1];
									return (
										<NotebookVariable
											key={id}
											id={id}
											variable={variable}
											engines={engines}
											suggestVariableRenames={
												suggestVariableRenames
											}
										/>
									);
								})}
							</List>
						</StyledMenuScroll>
						{isPopoverOpen && (
							<AddVariablePopover
								open={isPopoverOpen}
								anchorEl={popoverAnchorEle}
								onClose={() => {
									setPopoverAnchorEl(null);
								}}
								engines={engines}
							/>
						)}
					</StyledMenu>
				</StyledStack>

				{/* Rename Modal */}
				<Modal
					open={isRenameModalOpen}
					onClose={() => setIsRenameModalOpen(false)}
					aria-labelledby="rename-variables-modal"
				>
					<Box
						sx={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: 600,
							maxHeight: "80vh",
							bgcolor: "background.paper",
							borderRadius: 2,
							boxShadow: 24,
							p: 4,
							overflow: "auto",
						}}
					>
						<Typography variant="h6" gutterBottom>
							Suggested Variable Name Changes
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mb: 3 }}
						>
							Review and select the variable name changes you'd
							like to apply. All changes are selected by default.
						</Typography>

						<Stack spacing={2} sx={{ mb: 3 }}>
							{Object.entries(suggestedChanges).map(
								([oldName, newName]) => (
									<Box
										key={oldName}
										sx={{
											display: "flex",
											alignItems: "center",
											p: 2,
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
											backgroundColor:
												"background.default",
										}}
									>
										<Checkbox
											checked={
												selectedChanges[oldName] ||
												false
											}
											onChange={() =>
												handleToggleChange(oldName)
											}
										/>
										<Box sx={{ ml: 2, flex: 1 }}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												{oldName}
											</Typography>
											<Typography
												variant="body1"
												sx={{ fontWeight: "bold" }}
											>
												→ {newName}
											</Typography>
										</Box>
									</Box>
								),
							)}
						</Stack>

						<Stack
							direction="row"
							spacing={2}
							justifyContent="flex-end"
						>
							<Button
								onClick={() => setIsRenameModalOpen(false)}
								disabled={isProcessing}
							>
								Cancel
							</Button>
							<Button
								variant="contained"
								onClick={handleApplyChanges}
								disabled={
									isProcessing ||
									Object.keys(selectedChanges).filter(
										(key) => selectedChanges[key],
									).length === 0
								}
							>
								{isProcessing
									? "Applying..."
									: "Apply Selected Changes"}
							</Button>
						</Stack>
					</Box>
				</Modal>
			</Panel>
		);
	},
);
