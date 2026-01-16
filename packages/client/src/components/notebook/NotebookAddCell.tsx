import {
	Close,
	Code,
	ImportExport,
	KeyboardArrowDown,
	KeyboardArrowUp,
	MoreVert,
	SearchOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	ActionMessages,
	type CellStateConfig,
	CodeCellConfig,
	DataImportFormModal,
	type DefaultCellDefinitions,
	DefaultCells,
	type NewCellAction,
	QueryImportCellConfig,
	type QueryState,
	TransformationCells,
	useBlocks,
} from "@semoss/renderer";
import {
	Button,
	IconButton,
	InputAdornment,
	Menu,
	type MenuProps,
	Modal,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { ModelBrain } from "@/assets/img/ModelBrain";

const StyledButton = styled(Button)(({ theme }) => ({
	color: theme.palette.text.secondary,
	backgroundColor: "unset!important",
}));

const StyledMenu = styled((props: MenuProps) => (
	<Menu
		anchorOrigin={{
			vertical: "bottom",
			horizontal: "left",
		}}
		transformOrigin={{
			vertical: "top",
			horizontal: "left",
		}}
		{...props}
	/>
))(({ theme }) => ({
	"& .MuiPaper-root": {
		marginTop: theme.spacing(1),
		borderRadius: "0px",
	},
	".MuiList-root": {
		padding: 0,
	},
}));

const StyledMenuItem = styled(Menu.Item)(({ theme }) => ({
	textTransform: "capitalize",
	fontSize: "16px",
	display: "flex",
	gap: theme.spacing(1),
}));

const StyledBorderDiv = styled("div")(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.main}`,
	padding: "8px 16px",
	borderRadius: "8px",
}));
const MenuSectionRoot = styled("li")({
	listStyle: "none",
});

interface AddCellOption {
	display: string;
	icon: React.ReactNode;
	defaultCellType?: DefaultCellDefinitions["widget"];
	options?: {
		display: string;
		defaultCellType: DefaultCellDefinitions["widget"];
		disabled?: boolean;
	}[];
	disabled?: boolean;
}

const Transformations = Array.from(Object.values(TransformationCells)).map(
	(item) => {
		return {
			display: item.name,
			defaultCellType: item.widget,
		};
	},
);

const DataImportDropdownOptions = [
	{
		display: "From Data Catalog",
		defaultCellType: null,
	},
	{
		display: "Custom Import (SQL)",
		defaultCellType: "query-import",
	},
	{
		display: "From CSV",
		defaultCellType: null,
		disabled: true,
	},
];

const OtherOptions = [
	{
		display: "Send Email",
		defaultCellType: "send-email",
	},
];

const DataOptions = [
	{
		display: "Filter Data",
		defaultCellType: "filter-data",
	},
	{
		display: "Unfilter Data",
		defaultCellType: `unfilter-data`,
	},
	{
		display: "Text to SQL",
		defaultCellType: "text-to-sql",
	},
];

const AddCellOptions: Record<string, AddCellOption> = {
	code: {
		display: "Cell",
		defaultCellType: "code",
		icon: <Code />,
	},
	"import-data": {
		display: "Import Data",
		icon: <ImportExport />,
		options: DataImportDropdownOptions,
		disabled: false,
	},
	data: {
		display: "Data Filters",
		icon: (
			<svg
				role="img"
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
			>
				<title>data-filter-icon</title>
				<g clipPath="url(#clip0_2378_103062)">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.59 21 12 21C16.41 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM18 17C18 17.5 15.87 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C14.28 16 16.39 15.55 18 14.77V17ZM18 12.45C16.7 13.4 14.42 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11C14.39 11 16.53 10.47 18 9.64V12.45ZM12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9Z"
						fill="#666666"
					></path>
				</g>
				<defs>
					<clipPath id="clip0_2378_103062">
						<rect width="24" height="24" fill="#666666"></rect>
					</clipPath>
				</defs>
			</svg>
		),
		options: DataOptions,
	},
	transformation: {
		display: "Transformation",
		icon: (
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>transformation-icon</title>
				<path
					d="M9.9987 3.33203V0.832031L6.66536 4.16536L9.9987 7.4987V4.9987C12.757 4.9987 14.9987 7.24036 14.9987 9.9987C14.9987 10.8404 14.7904 11.6404 14.4154 12.332L15.632 13.5487C16.282 12.5237 16.6654 11.307 16.6654 9.9987C16.6654 6.31536 13.682 3.33203 9.9987 3.33203ZM9.9987 14.9987C7.24036 14.9987 4.9987 12.757 4.9987 9.9987C4.9987 9.15703 5.20703 8.35703 5.58203 7.66536L4.36536 6.4487C3.71536 7.4737 3.33203 8.69036 3.33203 9.9987C3.33203 13.682 6.31536 16.6654 9.9987 16.6654V19.1654L13.332 15.832L9.9987 12.4987V14.9987Z"
					fill="#757575"
				/>
			</svg>
		),
		options: Transformations,
	},
	llm: {
		display: "LLM",
		defaultCellType: "llm",
		icon: <ModelBrain color={"#666666"} width={"20"} height={"20"} />,
	},
	others: {
		display: "",
		icon: <MoreVert />,
		options: OtherOptions,
	},
};

export const NotebookAddCell = observer(
	(props: { query: QueryState; previousCellId?: string }): JSX.Element => {
		const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
		const [selectedAddCell, setSelectedAddCell] = useState<string>("");
		const [isDataImportModalOpen, setIsDataImportModalOpen] =
			useState<boolean>(false);
		const open = Boolean(anchorEl);
		const { query, previousCellId = "" } = props;
		const { state, notebook } = useBlocks();
		const [searchQuery, setSearchQuery] = useState("");

		/**
		 * @description - organizes transformation menu in a ds to map
		 */
		const TransformationCategories = useMemo(() => {
			const categories = {
				Text: [],
				"Data & Time": [],
				Numeric: [],
				Column: [],
			} as Record<string, typeof Transformations>;

			Transformations.forEach((transformation) => {
				switch (transformation.display) {
					case "Uppercase":
						categories.Text.push(transformation);
						break;
					case "Date Difference":
					case "Timestamp":
						categories["Data & Time"].push(transformation);
						break;
					case "Cumulative Sum":
					case "Encode Column":
						categories.Numeric.push(transformation);
						break;
					case "Update Row":
					case "Change Column Type":
					case "Join":
					case "Collapse":
						categories.Column.push(transformation);
						break;
					default:
						break;
				}
			});

			return categories;
		}, [TransformationCells]);

		/**
		 * filters transformations based on search term
		 */
		const filteredCategories = Object.entries(TransformationCategories)
			.map(([category, transformations]) => {
				const filteredTransformations = searchQuery
					? transformations.filter((t) =>
							t.display
								.toLowerCase()
								.includes(searchQuery.toLowerCase()),
						)
					: transformations;

				return {
					category,
					transformations: filteredTransformations,
				};
			})
			.filter(({ transformations }) => transformations.length > 0);

		/**
		 * @description - sets search term in state
		 * @param event
		 */
		const handleSearchChange = (event) => {
			setSearchQuery(event.target.value);
		};

		/**
		 * @description - clears search term in state
		 */
		const clearSearch = () => {
			setSearchQuery("");
		};

		/**
		 * @description - Create a New Cell and Add to Notebook
		 *
		 */
		const appendCell = async (widget: string) => {
			try {
				const config: NewCellAction["payload"]["config"] = {
					widget: DefaultCells[widget].widget,
					parameters: DefaultCells[widget].parameters,
				};

				if (widget === QueryImportCellConfig.widget) {
					config.parameters = {
						...DefaultCells[widget].parameters,
						frameVariableName: `FRAME_${Math.floor(
							Math.random() * 100000,
						)}`,
					};
				}

				if (
					previousCellId &&
					state.queries[query.id].cells[previousCellId].widget ===
						widget &&
					widget === CodeCellConfig.widget
				) {
					const previousCellType =
						state.queries[query.id].cells[previousCellId].parameters
							?.type ?? "pixel";
					config.parameters = {
						...DefaultCells[widget].parameters,
						type: previousCellType,
					};
				}

				// copy and add the step
				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query.id,
						previousCellId: previousCellId,
						config: config as Omit<CellStateConfig, "id">,
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${query.id}--${newCellId}`,
						type: "cell",
						to: query.id,
						cellId: newCellId,
					},
				});

				notebook.selectCell(query.id, newCellId);
			} catch (e) {
				console.error(e);
			}
		};

		return (
			<>
				<Stack
					direction={"row"}
					alignItems={"center"}
					gap={1}
					justifyContent={"center"}
				>
					<StyledBorderDiv>
						{AddCellOptions &&
							Object.entries(AddCellOptions).map((add, i) => {
								const value = add[1];
								return (
									<StyledButton
										key={`${query.id}-${previousCellId}-${value.display}`}
										title={`${value.display}`}
										variant="contained"
										size="small"
										disabled={
											query.isLoading || value.disabled
										}
										startIcon={value.icon}
										onClick={(e) => {
											if (value.options) {
												setAnchorEl(e.currentTarget);
												setSelectedAddCell(add[0]);
											} else {
												appendCell(
													value.defaultCellType,
												);
												setSelectedAddCell(add[0]);
											}
										}}
										sx={{
											...((value.options
												? selectedAddCell === add[0] &&
													open
												: selectedAddCell ===
													add[0]) && {
												backgroundColor:
													"#EBF4FE !important",
												color: "#212121 !important",
											}),
										}}
										endIcon={
											add[0] === "others" ||
											add[0] ===
												"code" ? null : Array.isArray(
													value.options,
												) &&
												selectedAddCell === add[0] &&
												open ? (
												<KeyboardArrowUp />
											) : (
												<KeyboardArrowDown />
											)
										}
									>
										{value.display}
									</StyledButton>
								);
							})}
					</StyledBorderDiv>
					<StyledMenu
						anchorEl={anchorEl}
						open={
							open &&
							!!AddCellOptions[selectedAddCell]?.options?.length
						}
						onClose={() => {
							setAnchorEl(null);
						}}
					>
						{selectedAddCell === "data" && // Ensure we are showing the options for "Data"
							DataOptions.map(
								({ display, defaultCellType }, index) => {
									return (
										<StyledMenuItem
											key={`${query.id}-${previousCellId}-${display}`}
											value={display}
											onClick={() => {
												appendCell(defaultCellType); // Append selected cell
												setAnchorEl(null); // Close the menu
											}}
										>
											{display}
										</StyledMenuItem>
									);
								},
							)}

						{selectedAddCell === "transformation" && (
							<>
								{/* Search Input with Clear Icon */}

								<TextField
									placeholder="Search"
									size="small"
									sx={{
										padding: "8px",
										borderRadius: "8px",
										width: "211px",
									}}
									value={searchQuery}
									onChange={handleSearchChange}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchOutlined />
											</InputAdornment>
										),
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													size="small"
													onClick={clearSearch}
												>
													<Close />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
								<Stack
									sx={{
										maxHeight: "300px",
										overflowY: "auto",
									}}
								>
									{/* Menu Section */}
									{filteredCategories.map(
										(
											{ category, transformations },
											index,
										) => (
											<MenuSectionRoot
												key={`${query.id}-${previousCellId}-${category}`}
											>
												<StyledMenuItem
													value={category}
													disabled
												>
													<Typography
														variant={"button"}
														sx={{
															fontSize: "14px",
														}}
													>
														{category}
													</Typography>
												</StyledMenuItem>
												{transformations.map(
													(
														transformation,
														tIndex,
													) => (
														<StyledMenuItem
															value={
																transformation.display
															}
															key={`${query.id}-${previousCellId}-${transformation.display}`}
															onClick={() => {
																appendCell(
																	transformation.defaultCellType,
																);
																setAnchorEl(
																	null,
																);
																setSearchQuery(
																	"",
																);
															}}
														>
															{
																transformation.display
															}
														</StyledMenuItem>
													),
												)}
											</MenuSectionRoot>
										),
									)}
								</Stack>
							</>
						)}
						{selectedAddCell === "others" &&
							Array.from(
								AddCellOptions[selectedAddCell]?.options || [],
								({ display, defaultCellType }, index) => {
									return (
										<StyledMenuItem
											key={`${query.id}-${previousCellId}-${display}`}
											value={display}
											onClick={() => {
												appendCell(defaultCellType);
												setAnchorEl(null);
											}}
										>
											{display}
										</StyledMenuItem>
									);
								},
							)}

						{selectedAddCell === "import-data" && (
							<div>
								{Array.from(
									AddCellOptions[selectedAddCell]?.options ||
										[],
									(
										{ display, defaultCellType, disabled },
										index,
									) => {
										return (
											<StyledMenuItem
												key={`${query.id}-${previousCellId}-${display}`}
												value={display}
												disabled={disabled}
												onClick={() => {
													if (!defaultCellType) {
														setIsDataImportModalOpen(
															true,
														);
													} else {
														appendCell(
															defaultCellType,
														);
													}
													setAnchorEl(null);
												}}
											>
												{display}
											</StyledMenuItem>
										);
									},
								)}
							</div>
						)}
					</StyledMenu>
				</Stack>

				{isDataImportModalOpen && (
					<Modal
						open={setIsDataImportModalOpen as unknown as boolean}
					>
						<DataImportFormModal
							setIsDataImportModalOpen={setIsDataImportModalOpen}
							query={query}
							previousCellId={previousCellId}
							cell={null}
							editMode={false}
						/>
					</Modal>
				)}
			</>
		);
	},
);
