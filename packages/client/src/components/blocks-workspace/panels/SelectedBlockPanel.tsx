import {
	ContentCopy,
	LibraryAdd,
	Search,
	SearchOff,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useState } from "react";
import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
import {
	Alert,
	Collapse,
	IconButton,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Typography,
	useNotification,
} from "@semoss/ui";
import { SelectedMenuSection } from "@/components/designer";
import { AddVariableModal } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { useDesigner } from "@/hooks";
import GroupIcon from "../../../assets/img/Group.svg";
import MultiBlockIcon from "../../../assets/img/Multiple_Block.svg";
import VariationIcon from "../../../assets/img/VariationLogo.svg";
import { BlockSettingsRegistry } from "../blocks";

// IconButtonWrapper parent of UnstyledIconButton
const IconButtonWrapper = ({
	children,
	onClick,
	title,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	title?: string;
}) => (
	<span
		style={{
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 10,
			border: "1px solid #E6E6E6",
			borderRadius: 8,
			boxSizing: "border-box",
			cursor: "pointer",
		}}
		onClick={onClick}
		title={title}
		tabIndex={0}
		role="button"
	>
		{children}
	</span>
);
// UnstyledIconButton parent of Icon
const UnstyledIconButton = ({
	children,
	...props
}: {
	children: React.ReactNode;
	[key: string]: any;
}) => (
	<span
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			padding: 4,
			borderRadius: 48,
		}}
		{...props}
	>
		{children}
	</span>
);
// Icon parent component
const Icon = ({ children }: { children: React.ReactNode }) => (
	<span
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			width: 16,
			height: 16,
		}}
	>
		{children}
	</span>
);

// CssRounded child of Icon
const CssRounded = ({ children }: { children: React.ReactNode }) => (
	<span
		style={{
			display: "flex",
			width: 16,
			height: 16,
			justifyContent: "center",
			alignItems: "center",
		}}
	>
		{children}
	</span>
);

// CssRoundedSVG component (the SVG, child of CssRounded)
const CssRoundedSVG = (props: React.SVGProps<SVGSVGElement>) => (
	<span
		style={{
			display: "flex",
			width: 16,
			height: 16,
			padding: "0 2px",
			justifyContent: "center",
			alignItems: "center",
			flexShrink: 0,
		}}
	>
		<Group>
			<Vector />
		</Group>
	</span>
);

// Group component (12x4 SVG, child of CssRounded)
const Group = ({ children }: { children: React.ReactNode }) => (
	<span
		style={{
			display: "flex",
			width: 12,
			height: 4,
			flexShrink: 0,
			alignItems: "center",
			justifyContent: "center",
		}}
	>
		{children}
	</span>
);

// Vector component (the 12x4 SVG with path)
const Vector = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={12}
		height={4}
		viewBox="0 0 12 4"
		fill="none"
		style={{ width: 12, height: 4, flexShrink: 0, display: "block" }}
	>
		<title>CSS Icon</title>
		<path
			d="M3.33333 0.833333C3.33333 1.10667 3.10667 1.33333 2.83333 1.33333C2.61333 1.33333 2.43333 1.19333 2.36 1H1V3H2.36C2.42667 2.80667 2.61333 2.66667 2.83333 2.66667C3.10667 2.66667 3.33333 2.89333 3.33333 3.16667V3.33333C3.33333 3.7 3.03333 4 2.66667 4H0.666667C0.3 4 0 3.7 0 3.33333V0.666667C0 0.3 0.3 0 0.666667 0H2.66667C3.03333 0 3.33333 0.3 3.33333 0.666667V0.833333ZM6.69333 1C6.76 1.19333 6.94667 1.33333 7.16667 1.33333C7.44 1.33333 7.66667 1.10667 7.66667 0.833333V0.666667C7.66667 0.3 7.36667 0 7 0H5C4.63333 0 4.33333 0.3 4.33333 0.666667V1.66667C4.33333 2.03333 4.63333 2.33333 5 2.33333H6.66667V3H5.30667C5.24 2.80667 5.05333 2.66667 4.83333 2.66667C4.56 2.66667 4.33333 2.89333 4.33333 3.16667V3.33333C4.33333 3.7 4.63333 4 5 4H7C7.36667 4 7.66667 3.7 7.66667 3.33333V2.33333C7.66667 1.96667 7.36667 1.66667 7 1.66667H5.33333V1H6.69333ZM11.0267 1C11.0933 1.19333 11.28 1.33333 11.5 1.33333C11.7733 1.33333 12 1.10667 12 0.833333V0.666667C12 0.3 11.7 0 11.3333 0H9.33333C8.96667 0 8.66667 0.3 8.66667 0.666667V1.66667C8.66667 2.03333 8.96667 2.33333 9.33333 2.33333H11V3H9.64C9.57333 2.80667 9.38667 2.66667 9.16667 2.66667C8.89333 2.66667 8.66667 2.89333 8.66667 3.16667V3.33333C8.66667 3.7 8.96667 4 9.33333 4H11.3333C11.7 4 12 3.7 12 3.33333V2.33333C12 1.96667 11.7 1.66667 11.3333 1.66667H9.66667V1H11.0267Z"
			fill="rgba(0, 0, 0, 0.54)"
		/>
	</svg>
);

const StyledTitle = styled(Typography)(() => ({
	textTransform: "capitalize",
	fontWeight: "bold",
}));

const StyledMenu = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	paddingTop: theme.spacing(1),
}));

const StyledMenuHeader = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	paddingTop: theme.spacing(1.5),
	paddingRight: theme.spacing(1),
	paddingBottom: theme.spacing(1.5),
	paddingLeft: theme.spacing(2),
	gap: theme.spacing(1),
}));

const StyledMenuScroll = styled("div")(({ theme }) => ({
	flex: "1",
	height: "100%",
	width: "100%",
	paddingBottom: theme.spacing(1),
	overflowY: "auto",
	">.MuiBox-root": {
		width: "100%",
		backgroundColor: "transparent",
	},
}));

const StyledMessage = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	alignItems: "center",
	justifyContent: "center",
	padding: "6px 0px",
}));
const StyledMultiBlockMessage = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "center",
	padding: "8px 0px",
	flex: "1 0 0",
}));
const StyledAlertTitle = styled(Alert.Title)(() => ({
	alignSelf: "stretch",
	color: "#666",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 500,
	lineHeight: "150%",
	letterSpacing: "0.15px",
}));
const StyledTypography = styled(Typography)(() => ({
	alignSelf: "stretch",
	color: "#666",
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "150%",
	letterSpacing: "0.17px",
}));
//Tab group with custom style with width and margin
const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	minHeight: "42px",
	color: theme.palette.secondary.light,
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
	width: "100%",
	margin: "0 auto",
	display: "flex",
	alignSelf: "stretch",
	justifyContent: "space-between",
	".MuiTabs-scroller": {
		display: "flex",
		justifyContent: "space-around",
		".MuiTabs-flexContainer": {
			flex: 1,
			padding: "3px",
			backgroundColor: "rgb(0, 0, 0, 0.04)",
			borderRadius: "12px",
			".MuiButtonBase-root": {
				padding: "6px 8px",
			},
		},
	},
}));
//toggle group item styling
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 16px",

	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));
const StyledCustomTabPanel = styled("div")(() => ({}));

const StyledParentDiv = styled("div")(() => ({
	padding: "16px 8px",
}));

const StyledDiv = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	padding: "6px 16px",
	gap: "12px",
	alignSelf: "stretch",
	borderRadius: "4px",
	background: "#F5F5F5",
}));

const StyledImgDiv = styled("div")(() => ({
	display: "flex",
	alignItems: "flex-start",
	width: "22px",
	height: "22px",
}));

const StyledVariationIcon = styled("img")(({ theme }) => ({
	width: theme.spacing(4),
	height: theme.spacing(4),
}));
export interface SelectedBlocksProps {
	/** Title to render in the menu */
	title: string;
}

export const SelectedBlockPanel = observer(() => {
	const { designer } = useDesigner();
	const { state } = useBlocks();
	const notification = useNotification();
	const [contentAccordion, setContentAccordion] = useState<
		Record<string, boolean>
	>({});
	const [styleAccordion, setStyleAccordion] = useState<
		Record<string, boolean>
	>({});
	const [showSearch, setShowSearch] = useState<boolean>(false);
	const [search, setSearch] = useState<string>("");
	const [addVariableModal, setAddVariableModal] = useState(false);

	// get the selected block
	const block = designer.selected ? state.getBlock(designer.selected) : null;

	const variableName = state.getAlias(designer.selected);
	const canVariabilize = block
		? INPUT_BLOCK_TYPES.indexOf(block.widget) > -1
		: false;
	const [settingSection, setSettingSection] = useState<string | number>(0); //state to maintain the selected tab in setting appearance tab
	const [showJsonEditor, setShowJsonEditor] = useState(false);
	const [jsonValue, setJsonValue] = useState(
		block ? JSON.stringify(block.data?.style ?? {}, null, 2) : "{}",
	);
	// get the content menu
	const contentMenu = useMemo(() => {
		if (
			!BlockSettingsRegistry ||
			!block ||
			!BlockSettingsRegistry[block.widget]
		) {
			return [];
		}

		const m = BlockSettingsRegistry[block.widget]?.contentMenu ?? [];

		// clear out the accordion
		const acc = {};
		for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
			const key = `section--${sIdx}`;

			acc[key] = true;
		}
		setContentAccordion(acc);

		// set the menu with search filter
		if (search) {
			// filter section headers that match search
			const filteredSectionMenu = m.filter((menuItem) => {
				if (menuItem.name.toLowerCase().includes(search)) {
					return true;
				}
				return menuItem.children.some((child) => {
					return child.description.toLowerCase().includes(search);
				});
			});
			// filter section children that match search
			return filteredSectionMenu.map((menuItem) => {
				return {
					...menuItem,
					children: menuItem.children.filter((child) =>
						child.description.toLowerCase().includes(search),
					),
				};
			});
		}
		return m;
	}, [BlockSettingsRegistry, block ? block.widget : "", search]);

	// get the style menu
	const styleMenu = useMemo(() => {
		if (
			!BlockSettingsRegistry ||
			!block ||
			!BlockSettingsRegistry[block.widget]
		) {
			return [];
		}

		const m = BlockSettingsRegistry[block.widget]?.styleMenu ?? [];

		// clear out the accordion
		const acc = {};
		for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
			const key = `section--${sIdx}`;

			acc[key] = true;
		}
		setStyleAccordion(acc);

		// set the menu with search filter
		if (search) {
			// filter section headers that match search
			const filteredSectionMenu = m.filter((menuItem) => {
				if (menuItem.name.toLowerCase().includes(search)) {
					return true;
				}
				return menuItem.children.some((child) => {
					return child.description.toLowerCase().includes(search);
				});
			});
			// filter section children that match search
			return filteredSectionMenu.map((menuItem) => {
				return {
					...menuItem,
					children: menuItem.children.filter((child) =>
						child.description.toLowerCase().includes(search),
					),
				};
			});
		}
		return m;
	}, [BlockSettingsRegistry, block ? block.widget : "", search]);

	// new custom righthand menu content
	const menu = useMemo(() => {
		if (
			!BlockSettingsRegistry ||
			!block ||
			!BlockSettingsRegistry[block.widget]
		) {
			return null;
		}

		return BlockSettingsRegistry[block.widget]?.menu ?? null;
	}, [BlockSettingsRegistry, block ? block.widget : ""]);

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);

			notification.add({
				color: "success",
				message: "Successfully copied ID",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: "Unable to copy ID",
			});
		}
	};

	// clear search on blocks no longer selected
	useMemo(() => {
		if (!block) {
			setSearch("");
			setShowSearch(false);
		}
		setShowJsonEditor(false);
	}, [block]);
	useEffect(() => {
		if (block) {
			setJsonValue(JSON.stringify(block.data?.style ?? {}, null, 2));
		}
	}, [JSON.stringify(block?.data?.style ?? {})]);

	const getBlockDisplay = () => {
		if (block) {
			return block.data?.variation
				? (block.data.variation as string).replaceAll("-", " ")
				: block.widget.replaceAll("-", " ");
		} else {
			return "";
		}
	};
	if (designer.selectedBlocks.length > 1) {
		return (
			<Panel>
				<StyledParentDiv>
					<StyledDiv>
						<StyledImgDiv>
							<img
								src={MultiBlockIcon}
								alt="Multiple Blocks Selected"
							></img>
						</StyledImgDiv>
						<StyledMultiBlockMessage>
							<StyledAlertTitle>
								Multiple Blocks Selected
							</StyledAlertTitle>
							<StyledTypography variant="body2">
								Select a single block to view its setting
							</StyledTypography>
						</StyledMultiBlockMessage>
					</StyledDiv>
				</StyledParentDiv>
			</Panel>
		);
	}

	// ignore if there is no menu
	if (!block) {
		return (
			<Panel>
				<StyledParentDiv>
					<StyledDiv>
						<StyledImgDiv>
							<img src={GroupIcon} alt="No Blocks Selected"></img>
						</StyledImgDiv>
						<StyledMessage>
							<StyledAlertTitle>
								No Block Selected
							</StyledAlertTitle>
							<StyledTypography variant="body2">
								Select a block to view its setting
							</StyledTypography>
						</StyledMessage>
					</StyledDiv>
				</StyledParentDiv>
			</Panel>
		);
	}

	return (
		<Panel>
			<StyledMenu>
				<StyledMenuHeader>
					<Stack
						flex={1}
						spacing={2}
						direction="row"
						alignItems="center"
					>
						<StyledVariationIcon src={VariationIcon} />
						<Stack
							direction={"row"}
							spacing={0.5}
							alignItems="center"
						>
							<StyledTitle variant="h6">
								{getBlockDisplay()}
							</StyledTitle>
							{variableName ? (
								<IconButton
									aria-label="copy"
									color="default"
									size="small"
									title={`{{${variableName}}}`}
									onClick={() => copy(`{{${variableName}}}`)}
								>
									<ContentCopy fontSize="small" />
								</IconButton>
							) : canVariabilize ? (
								<IconButton
									aria-label="copy"
									color="default"
									size="small"
									title={"Add variable"}
									onClick={() => {
										setAddVariableModal(true);
									}}
								>
									<LibraryAdd fontSize="small" />
								</IconButton>
							) : null}
						</Stack>

						{!menu && (
							<Stack
								flex={1}
								spacing={1}
								direction="column"
								alignItems="end"
								justifyContent="end"
							>
								{settingSection === 1 && (
									<IconButtonWrapper
										onClick={() =>
											setShowJsonEditor((v) => !v)
										}
										title="Edit CSS"
									>
										<UnstyledIconButton>
											<Icon>
												<CssRounded>
													<CssRoundedSVG />
												</CssRounded>
											</Icon>
										</UnstyledIconButton>
									</IconButtonWrapper>
								)}
								<Stack
									spacing={1}
									direction="row"
									alignItems="center"
									justifyContent="end"
								>
									<Collapse
										orientation="horizontal"
										in={showSearch}
									>
										<TextField
											placeholder="Search"
											size="small"
											value={search}
											variant="outlined"
											onChange={(e) =>
												setSearch(e.target.value)
											}
										/>
									</Collapse>
									<IconButton
										aria-label="toggle-search"
										color="default"
										size="small"
										onClick={() => {
											setShowSearch(!showSearch);
											setSearch("");
										}}
									>
										{showSearch ? (
											<SearchOff fontSize="medium" />
										) : (
											<Search fontSize="medium" />
										)}
									</IconButton>
								</Stack>
							</Stack>
						)}
					</Stack>
				</StyledMenuHeader>
				<StyledMenuScroll>
					{!!menu &&
						createElement(menu, {
							id: block.id,
						})}

					{
						/**
						 * This section will show Setting and Appearance tabs if there are any content or style menus
						 * If there are no content or style menus, it will not show the tabs
						 */
						(contentMenu.length > 0 || styleMenu.length > 0) && (
							<StyledToggleTabsGroup
								variant="fullWidth"
								value={settingSection}
								onChange={(
									e: React.SyntheticEvent,
									val: string,
								) => {
									setSettingSection(val);
								}}
							>
								<StyledToggleTabsGroupItem
									label="Settings"
									value={0}
									data-testId={
										"selectedBlockPanel-settings-toggle"
									}
								/>
								<StyledToggleTabsGroupItem
									label="Appearance"
									value={1}
									data-testId={
										"selectedBlockPanel-appearance-toggle"
									}
								/>
							</StyledToggleTabsGroup>
						)
					}

					{
						/**
						 * This section will show the content menu when setting tab is selected
						 */
						contentMenu.length > 0 && (
							<StyledCustomTabPanel
								role="tabpanel"
								id={`simple-tabpanel-0`}
								aria-labelledby={`simple-tab-0`}
								hidden={settingSection !== 0 ? true : false}
							>
								{contentMenu.length ? (
									<SelectedMenuSection
										id={block.id}
										sectionTitle=""
										menu={contentMenu}
										accordion={contentAccordion}
										setAccordion={setContentAccordion}
									/>
								) : (
									<></>
								)}
							</StyledCustomTabPanel>
						)
					}
					{
						/**
						 * This section will show the style menu when appearance tab is selected
						 */
						styleMenu.length > 0 && (
							<StyledCustomTabPanel
								role="tabpanel"
								id={`simple-tabpanel-1`}
								aria-labelledby={`simple-tab-1`}
								hidden={settingSection !== 1 ? true : false}
							>
								{!showJsonEditor ? (
									styleMenu.length ? (
										<SelectedMenuSection
											id={block.id}
											sectionTitle=""
											menu={styleMenu}
											accordion={styleAccordion}
											setAccordion={setStyleAccordion}
										/>
									) : null
								) : (
									<Stack spacing={2} sx={{ mt: 4 }}>
										<TextField
											multiline
											minRows={8}
											maxRows={20}
											fullWidth
											label="CSS Settings"
											value={jsonValue}
											onChange={(e) =>
												setJsonValue(e.target.value)
											}
											variant="outlined"
											size="small"
										/>
										<Stack
											direction="row"
											spacing={2}
											justifyContent="flex-end"
										>
											<button
												type="button"
												style={{
													background: "#f5f5f5",
													color: "#666",
													border: "none",
													borderRadius: 4,
													padding: "6px 16px",
													cursor: "pointer",
												}}
												onClick={() => {
													setJsonValue(
														block
															? JSON.stringify(
																	block.data
																		?.style ??
																		{},
																	null,
																	2,
																)
															: "{}",
													);
													setShowJsonEditor(false);
												}}
											>
												Cancel
											</button>
											<button
												type="button"
												style={{
													background: "#1260DD",
													color: "#fff",
													border: "none",
													borderRadius: 4,
													padding: "6px 16px",
													cursor: "pointer",
												}}
												onClick={() => {
													try {
														const parsed =
															JSON.parse(
																jsonValue,
															);
														state.dispatch({
															message:
																ActionMessages.SET_BLOCK_DATA,
															payload: {
																id: block.id,
																path: "style",
																value: parsed,
															},
														});
														notification.add({
															color: "success",
															message:
																"Style updated!",
														});
														setShowJsonEditor(
															false,
														);
													} catch (err) {
														notification.add({
															color: "error",
															message:
																"Invalid JSON",
														});
													}
												}}
											>
												Save Changes
											</button>
										</Stack>
									</Stack>
								)}
								{/* Removed Edit CSS button from here, now at top right */}
							</StyledCustomTabPanel>
						)
					}
				</StyledMenuScroll>
				{addVariableModal ? (
					<AddVariableModal
						open={true}
						type="block"
						to={designer.selected}
						onClose={() => setAddVariableModal(false)}
					/>
				) : null}
			</StyledMenu>
		</Panel>
	);
});
