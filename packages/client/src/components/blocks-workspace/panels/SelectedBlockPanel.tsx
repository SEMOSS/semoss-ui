import {
	ContentCopy,
	LibraryAdd,
	Search,
	SearchOff,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { createElement, useMemo, useState } from "react";
import { INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
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

const StyledTitle = styled(Typography)(() => ({
	textTransform: "capitalize",
	fontWeight: "bold",
}));
const StyledBlockTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: " #EBF4FE",
	width: "fit-content",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
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

const StyledMessage = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	alignItems: "center",
	justifyContent: "center",
	padding: "6px 0px",
}));
const StyledMultiBlockMessage = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "center",
	padding: "8px 0px",
	flex: "1 0 0",
}));
const StyledAlertTitle = styled(Alert.Title)(({ theme }) => ({
	alignSelf: "stretch",
	color: "#666",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 500,
	lineHeight: "150%",
	letterSpacing: "0.15px",
}));
const StyledTypography = styled(Typography)(({ theme }) => ({
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
const StyledCustomTabPanel = styled("div")(({ theme }) => ({}));

const StyledParentDiv = styled("div")(({ theme }) => ({
	padding: "16px 8px",
}));

const StyledDiv = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	padding: "6px 16px",
	gap: "12px",
	alignSelf: "stretch",
	borderRadius: "4px",
	background: "#F5F5F5",
}));

const StyledImgDiv = styled("div")(({ theme }) => ({
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

const StyledTitleSpan = styled("span")(() => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFamily: "Inter",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontStyle: "normal",
	fontSize: "13px",
	lineHeight: "18px",
	fontWeight: 400,
	letterSpacing: "0.16px",
	marginLeft: "0px !important",
}));

export const SelectedBlockPanel = observer((props: SelectedBlocksProps) => {
	const { title } = props;
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

	// get the icon
	const icon = useMemo(() => {
		if (
			!BlockSettingsRegistry ||
			!block ||
			!BlockSettingsRegistry[block.widget]
		) {
			return null;
		}

		const w = BlockSettingsRegistry[block.widget];
		if (!w) {
			return null;
		}

		return w.icon;
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
	}, [block]);

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
				{/* <StyledBlockTitle>
                    <StyledTitleSpan>
                        {title}
                    </StyledTitleSpan> 
                </StyledBlockTitle> */}
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
								{styleMenu.length ? (
									<SelectedMenuSection
										id={block.id}
										sectionTitle=""
										menu={styleMenu}
										accordion={styleAccordion}
										setAccordion={setStyleAccordion}
									/>
								) : (
									<></>
								)}
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
