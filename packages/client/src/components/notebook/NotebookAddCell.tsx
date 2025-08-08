import {
	Close,
	Code,
	ImportExport,
	KeyboardArrowDown,
	KeyboardArrowUp,
	MoreVert,
	SearchOutlined,
	TextFields,
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
	TextToSqlCellConfig,
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

const StyledMenuItem = styled(Menu.Item)(() => ({
	textTransform: "capitalize",
	fontSize: "16px",
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
    'text-to-sql': {
        display: 'Text to SQL',
        defaultCellType: 'text-to-sql',
        icon: (
            <>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M19 8.5V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20V19C17.2652 19 17.5196 18.8946 17.7071 18.7071C17.8946 18.5196 18 18.2652 18 18V8.5H16C15.6022 8.5 15.2206 8.34196 14.9393 8.06066C14.658 7.77936 14.5 7.39782 14.5 7V5H9C8.73478 5 8.48043 5.10536 8.29289 5.29289C8.10536 5.48043 8 5.73478 8 6V15H7V6C7 5.46957 7.21071 4.96086 7.58579 4.58579C7.96086 4.21071 8.46957 4 9 4H14.5L19 8.5ZM5 18.841C5.00572 18.9986 5.04436 19.1532 5.11342 19.2949C5.18248 19.4367 5.28044 19.5624 5.401 19.664C5.53033 19.772 5.68967 19.856 5.879 19.916C6.163 20.006 6.29 20.007 6.544 20.007C6.882 20.007 7.168 19.9543 7.402 19.849C7.63867 19.743 7.81867 19.5963 7.942 19.409C8.06811 19.2138 8.13321 18.9854 8.129 18.753C8.129 18.529 8.084 18.3423 7.994 18.193C7.90251 18.0431 7.77317 17.92 7.619 17.836C7.44236 17.7379 7.25186 17.6671 7.054 17.626L6.433 17.482C6.28657 17.4542 6.1482 17.3941 6.028 17.306C5.98256 17.2707 5.94597 17.2253 5.92115 17.1734C5.89632 17.1215 5.88395 17.0645 5.885 17.007C5.885 16.851 5.94633 16.723 6.069 16.623C6.19367 16.5217 6.36467 16.471 6.582 16.471C6.72467 16.471 6.848 16.4937 6.952 16.539C7.04788 16.5773 7.13226 16.6396 7.197 16.72C7.25855 16.7942 7.29988 16.8831 7.317 16.978H8.067C8.05439 16.7745 7.9855 16.5786 7.868 16.412C7.74199 16.2322 7.56904 16.0903 7.368 16.002C7.12257 15.8939 6.85608 15.8419 6.588 15.85C6.29467 15.85 6.036 15.9 5.812 16C5.58733 16.0993 5.41133 16.2397 5.284 16.421C5.15733 16.603 5.094 16.816 5.094 17.06C5.094 17.2613 5.135 17.436 5.217 17.584C5.299 17.732 5.416 17.8543 5.568 17.951C5.72067 18.0463 5.90067 18.1173 6.108 18.164L6.726 18.308C6.93267 18.3567 7.08667 18.421 7.188 18.501C7.23768 18.5389 7.27752 18.5883 7.30415 18.6448C7.33077 18.7014 7.34341 18.7635 7.341 18.826C7.341 18.936 7.31267 19.0327 7.256 19.116C7.19144 19.2043 7.10245 19.2717 7 19.31C6.88867 19.3567 6.751 19.38 6.587 19.38C6.46967 19.38 6.363 19.3667 6.267 19.34C6.17835 19.3162 6.09446 19.2773 6.019 19.225C5.95251 19.1818 5.89557 19.1255 5.85171 19.0594C5.80785 18.9934 5.778 18.919 5.764 18.841H5ZM11.878 20.33L11.371 19.591C11.547 19.429 11.6807 19.229 11.772 18.991C11.864 18.7523 11.91 18.4837 11.91 18.185V17.684C11.91 17.3133 11.8407 16.991 11.702 16.717C11.5725 16.4517 11.3676 16.2304 11.113 16.081C10.8577 15.931 10.552 15.856 10.196 15.856C9.84467 15.856 9.54 15.931 9.282 16.081C9.026 16.2297 8.82867 16.4417 8.69 16.717C8.54714 17.0189 8.47693 17.3501 8.485 17.684V18.184C8.485 18.5533 8.55333 18.875 8.69 19.149C8.82867 19.4223 9.026 19.6343 9.282 19.785C9.56161 19.9387 9.87704 20.0153 10.196 20.007C10.4002 20.0079 10.6031 19.9741 10.796 19.907L11.09 20.329L11.878 20.33ZM9.262 18.2V17.678C9.262 17.432 9.3 17.222 9.376 17.048C9.44336 16.8866 9.55629 16.7483 9.701 16.65C9.84908 16.5569 10.0211 16.5089 10.196 16.512C10.388 16.512 10.553 16.558 10.691 16.65C10.8357 16.7483 10.9486 16.8866 11.016 17.048C11.0927 17.222 11.131 17.432 11.131 17.678V18.2C11.131 18.364 11.1133 18.5123 11.078 18.645C11.0427 18.7757 10.991 18.889 10.923 18.985L10.817 18.845L10.712 18.698H9.979L10.43 19.348C10.3507 19.3815 10.2651 19.3975 10.179 19.395C10.0056 19.3956 9.83606 19.3444 9.692 19.248C9.54823 19.1474 9.437 19.007 9.372 18.844C9.29404 18.6385 9.25668 18.4198 9.262 18.2ZM13.248 19.257H14.944V19.931H12.457V15.932H13.247L13.248 19.257Z"
                        fill="#757575"
                        stroke="#757575"
                        strokeWidth="0.2"
                    />
                </svg>
            </>
        ),
    },
	data: {
		display: "Data Filters",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
			>
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
		const appendCell = (widget: string) => {
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
                if (widget === TextToSqlCellConfig.widget) {
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
				const newCellId = state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query.id,
						previousCellId: previousCellId,
						config: config as Omit<CellStateConfig, "id">,
					},
				}) as string;

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
										key={i}
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
                                            add[0] === 'text-to-sql' ||
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
											key={index}
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
											<MenuSectionRoot key={index}>
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
															key={tIndex}
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
											key={index}
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
							<>
								{Array.from(
									AddCellOptions[selectedAddCell]?.options ||
										[],
									(
										{ display, defaultCellType, disabled },
										index,
									) => {
										return (
											<StyledMenuItem
												key={index}
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
							</>
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
