import { Search, Tune } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	Modal,
	Skeleton,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Typography,
	useNotification,
} from "@semoss/ui";
import { AddBlocksMenuCard } from "@/components/designer";
import { AddClientBlockModal } from "@/components/designer/AddClientBlockModal";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";
import { SECTION_ORDER } from "../menus/default-menu";
import type {
	BlockLocalStorageData,
	DesignerMenuItem,
	FilterCategory,
} from "../menus/menu-types";
import { BlocksMenuPanelFilterMenu } from "./BlocksMenuPanelFilterMenu";

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

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	border: "1px",
	minHeight: "42px",
	color: theme.palette.secondary.light,
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
	width: "100%",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 11px",
	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));

const StyledMenu = styled("div")(({ theme }) => ({
	height: "100%",
	width: "100%",
	overflowY: "auto",
	overflowX: "hidden",
	paddingBottom: theme.spacing(2),
}));

const StyledGridWrapper = styled("div")({
	width: "100%",
});

const StyledTypography = styled(Typography)({
	userSelect: "none",
});

const StyledTitleSpan = styled("span")({
	color: "var(--Primary-Dark, #1260DD)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "13px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "18px",
	letterSpacing: "0.16px",
});

const StyledStack = styled(Stack)({
	marginLeft: "16px",
	marginTop: "8px",
});

const StyledTextFiled = styled(TextField)({
	marginRight: "8px",
	width: "95%",
	borderRadius: "8px",
});
type MODE = "COMMUNITY" | "SYSTEM";
export interface AddBlocksMenuProps {
	/** Title to render in the menu */
	title: string;

	/** Items to add to show in the menu.  */
	items: DesignerMenuItem[];

	name?: string;
}

const defaultSection = "Miscellaneous";

/**
 * Add Blocks to the UI
 */
export const BlocksMenuPanel = observer((props: AddBlocksMenuProps) => {
	const { title, items } = props;
	const notification = useNotification();
	const { workspace } = useWorkspace();
	const [search, setSearch] = useState("");
	const [communityBlock, setCommunityBlock] = useState([]);
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState<MODE>("SYSTEM");

	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
	const [filterCategoryMap, setFilterCategoryMap] = useState<
		Record<string, FilterCategory>
	>({});

	const anyEnabledFilter = useMemo(
		() =>
			Object.values(filterCategoryMap).some(
				(category) => category.enabled,
			),
		[filterCategoryMap],
	);

	/**
	 * TODO: REPLACE WITH A CALL TO THE BACKEND
	 */
	const getClientBlocks = async () => {
		setLoading(true);
		await runPixel("GetClientBlocks()").then((res) => {
			const { pixelReturn, errors } = res;
			if (errors.length) {
				notification.add({
					color: "error",
					message: errors.join(""),
				});
				setLoading(false);
			} else {
				const { output } = pixelReturn[0];
				const res = (output as DesignerMenuItem[]).map((item) => {
					return {
						...item,
						json: JSON.parse(JSON.stringify(item.json)),
					};
				});
				setCommunityBlock(output as DesignerMenuItem[]);
				setLoading(false);
			}
		});
	};

	/**
	 * Deletes a block by its ID and closes the overlay.
	 *
	 * @param blockId - The unique identifier of the block to be deleted.
	 */
	const deleteBlock = (blockId: string) => {
		setCommunityBlock(
			communityBlock.filter((item) => item["id"] !== blockId),
		);
		runPixel(`DeleteBlock(blockId = "${blockId}", hardDelete = true)`).then(
			(res) => {
				const { errors } = res;
				if (errors.length || !res.pixelReturn[0].output) {
					notification.add({
						color: "error",
						message: errors.join("") ?? "Error deleting block",
					});
				} else {
					notification.add({
						color: "success",
						message: "Block deleted successfully",
					});
				}
			},
		);
		workspace.closeOverlay();
	};

	/**
	 * Open the delete modal
	 */
	const handleOnTrashClick = (blockId: string, blockName: string) => {
		workspace.openOverlay(() => (
			<>
				<Modal.Title>Delete Selected Block?</Modal.Title>
				<Modal.Content>
					<Typography variant="body2">
						You will permanently remove the block from the community
						block section.
					</Typography>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant={"text"}
						color="secondary"
						onClick={() => workspace.closeOverlay()}
					>
						Cancel
					</Button>
					<Button
						color={"error"}
						variant={"contained"}
						onClick={() => deleteBlock(blockId)}
					>
						Delete
					</Button>
				</Modal.Actions>
			</>
		));
	};
	const handleOnEditClick = (blockId: string, item: DesignerMenuItem) => {
		workspace.openOverlay(() => (
			<AddClientBlockModal
				isOpen={true}
				onClose={() => workspace.closeOverlay()}
				selected={blockId}
				isEdit={true}
				block_json={item}
			/>
		));
	};

	const sortedItems = useMemo(() => {
		// Use community Block when mode is COMMUNITY otherwise use items from the props
		const dataToProcess = mode === "COMMUNITY" ? communityBlock : items;
		const sectionRecord: Record<string, DesignerMenuItem[]> = {};
		const newSectionOrder: string[] = [...SECTION_ORDER];
		// Group items by section
		dataToProcess.forEach((item) => {
			const currentSection = item.section ?? defaultSection;
			if (newSectionOrder.indexOf(currentSection) === -1)
				newSectionOrder.push(currentSection);
			if (!sectionRecord[currentSection])
				sectionRecord[currentSection] = [];
			sectionRecord[currentSection].push(item);
		});

		// Sort sections based on sectionOrder
		return newSectionOrder
			.map((section) => {
				const sectionItems = sectionRecord[section] || [];
				return sectionItems.sort((a, b) =>
					a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
				);
			})
			.filter((section) => section.length > 0);
	}, [items, mode, communityBlock, SECTION_ORDER]);

	// get the rendered items
	const renderedItems: DesignerMenuItem[][] = useMemo(() => {
		// calculate whether any sections are being filtered
		const anySectionFilter = Object.values(filterCategoryMap).some(
			(filter) => filter.type === "SECTION" && filter.enabled,
		);

		// room to improve this logic in the future, but for now just keep 6 most used blocks
		const localStorageMap: Record<string, BlockLocalStorageData> =
			JSON.parse(localStorage.getItem("blocks--frequently-used")) ?? {};
		const mostUsedSet = Object.values(localStorageMap)
			.filter((item) => item.use_count)
			.sort((a, b) => a.use_count - b.use_count)
			.slice(0, 6)
			.reduce((acc, curr) => {
				acc.add(curr.widget);
				return acc;
			}, new Set<string>());

		// filter out sections
		const selectSectionItems = (
			sectionItems: DesignerMenuItem[],
		): DesignerMenuItem[] => {
			if (filterCategoryMap[sectionItems[0].section]?.enabled) {
				// this section is a selected filter; show all of its items
				return sectionItems;
			} else if (filterCategoryMap["Most Used Components"]?.enabled) {
				// "Most Used Components" is enabled; return this section's items if they are in most used
				return sectionItems.filter((item) =>
					mostUsedSet.has(item.json.widget),
				);
			} else if (anySectionFilter) {
				// There are section filters applied, but this section is not selected, return nothing
				return [];
			} else {
				// There are no filters applied, return everything
				return sectionItems;
			}
		};
		const filteredItems = sortedItems
			.map(selectSectionItems)
			.filter((sectionItems) => sectionItems.length);

		if (!search) {
			return filteredItems;
		}

		const s = search.replace(/[^a-z0-9]/gi, "").toLowerCase();

		return (
			filteredItems
				.map((sectionItems) =>
					// pattern match on s
					sectionItems.filter((item) =>
						item.name
							.replace(/[^a-z0-9]/gi, "")
							.toLowerCase()
							.includes(s),
					),
				)
				// only include sections that have remaining blocks
				.filter((sectionItems) => sectionItems.length)
		);
	}, [sortedItems, search, filterCategoryMap]);

	useEffect(() => {
		setFilterCategoryMap(() => {
			const uniqueSectionMap = items.reduce((acc, curr) => {
				acc[curr.section] = true;
				return acc;
			}, {});
			const sortedSections = Object.keys(uniqueSectionMap).sort();
			return sortedSections.reduce(
				(acc, curr) => {
					acc[curr] = {
						id: curr,
						enabled: false,
						type: "SECTION",
					} satisfies FilterCategory;
					return acc;
				},
				{
					"Most Used Components": {
						id: "Most Used Components",
						enabled: false,
						type: "MOST_USED_COMPONENTS",
					} satisfies FilterCategory,
				},
			);
		});
	}, [items]);

	const isCommunity = mode === "COMMUNITY";

	return (
		<Panel>
			<Stack height="100%" spacing={undefined}>
				<StyledTitle>
					<StyledTitleSpan>{title}</StyledTitleSpan>
				</StyledTitle>
				<StyledStack>
					<StyledTextFiled
						placeholder="Search"
						size="small"
						fullWidth
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										size="small"
										onClick={(e) =>
											setMenuAnchorEl(e.currentTarget)
										}
									>
										<Badge
											variant="dot"
											invisible={!anyEnabledFilter}
											color="primary"
										>
											<Tune />
										</Badge>
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
					<StyledToggleTabsGroup
						value={mode}
						onChange={(e: React.SyntheticEvent, val) => {
							setMode(val as MODE);
							if (val === "COMMUNITY") {
								getClientBlocks();
							}
						}}
					>
						<StyledToggleTabsGroupItem
							label="System Blocks"
							value={"SYSTEM"}
						/>
						<StyledToggleTabsGroupItem
							label="Community Blocks"
							value={"COMMUNITY"}
						/>
					</StyledToggleTabsGroup>
				</StyledStack>

				{renderedItems.length ? (
					<StyledMenu>
						{renderedItems.map((sectionItems, index) => (
							<Stack
								key={sectionItems[0].section ?? defaultSection}
								width="100%"
							>
								{index > 0 && (
									<Stack paddingTop={1}>
										<Divider variant="fullWidth" flexItem />
									</Stack>
								)}
								<Stack padding={2}>
									<StyledTypography
										variant="subtitle2"
										key={index}
									>
										{sectionItems[0].section ??
											defaultSection}
									</StyledTypography>
								</Stack>
								<StyledGridWrapper>
									<Grid
										container
										spacing={2}
										width="100%"
										paddingLeft={2}
									>
										{sectionItems.map((block) => (
											<Grid item key={block.name}>
												<AddBlocksMenuCard
													item={block}
													isCommunity={isCommunity}
													handleOnTrashClick={
														handleOnTrashClick
													}
													handleOnEditClick={
														handleOnEditClick
													}
												/>
											</Grid>
										))}
									</Grid>
								</StyledGridWrapper>
							</Stack>
						))}
					</StyledMenu>
				) : (
					<Stack padding={2}>
						{loading ? (
							<Grid container gap={2} width="100%">
								{[1, 2, 3].map((n) => (
									<Skeleton
										variant="rectangular"
										height={133}
										width={133}
									/>
								))}
							</Grid>
						) : (
							<Typography variant="subtitle2">
								No items found
							</Typography>
						)}
					</Stack>
				)}
			</Stack>
			<BlocksMenuPanelFilterMenu
				anchorEl={menuAnchorEl}
				onClose={() => setMenuAnchorEl(null)}
				categoryMap={filterCategoryMap}
				setCategoryMap={setFilterCategoryMap}
			/>
		</Panel>
	);
});
