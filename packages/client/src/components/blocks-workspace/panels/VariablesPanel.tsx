import { Add, FilterListRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useBlocks, VARIABLE_TYPES } from "@semoss/renderer";
import {
	Box,
	Button,
	Checklist,
	IconButton,
	List,
	Popover,
	Search,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { AddVariablePopover, NotebookVariable } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { usePixel } from "@/hooks";

import { AutoFixHighRounded } from "@mui/icons-material";

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
							>
								<StyledMenuTitle variant="h6">
									Variables
								</StyledMenuTitle>
								<Stack 								direction="row"
>
									<IconButton
									title="Suggest variable names"
									className="notebook-variable-menu__suggest-rename-button"
									onClick={async (e) => {
										const suggestedChanges = await state.processRename()

										state.changeVariableNames(suggestedChanges)
									}}
								>
									<AutoFixHighRounded />
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
			</Panel>
		);
	},
);
