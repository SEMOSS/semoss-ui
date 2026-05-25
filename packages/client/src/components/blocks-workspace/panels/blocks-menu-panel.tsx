import { SlidersHorizontal } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Popover,
	PopoverTrigger,
	Separator,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { AddBlocksMenuCard } from "@/components/designer";
import { AddClientBlockModal } from "@/components/designer/add-client-block-modal";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";
import { SECTION_ORDER } from "../menus/default-menu";
import type {
	BlockLocalStorageData,
	DesignerMenuItem,
	FilterCategory,
} from "../menus/menu-types";
import { BlocksMenuPanelFilterMenu } from "./BlocksMenuPanelFilterMenu";
import { PanelSearch } from "./panel-search";

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
	const { workspace } = useWorkspace();
	const [search, setSearch] = useState("");
	const [communityBlock, setCommunityBlock] = useState([]);
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState<MODE>("SYSTEM");

	const [filterMenuOpen, setFilterMenuOpen] = useState(false);
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
				toast.error(errors.join(""));
				setLoading(false);
			} else {
				const { output } = pixelReturn[0];
				const _res = (output as DesignerMenuItem[]).map((item) => {
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
		setCommunityBlock(communityBlock.filter((item) => item.id !== blockId));
		runPixel(`DeleteBlock(blockId = "${blockId}", hardDelete = true)`).then(
			(res) => {
				const { errors } = res;
				if (errors.length || !res.pixelReturn[0].output) {
					toast.error(errors.join("") ?? "Error deleting block");
				} else {
					toast.success("Block deleted successfully");
				}
			},
		);
		workspace.closeOverlay();
	};

	/**
	 * Open the delete modal
	 */
	const handleOnTrashClick = (blockId: string, _blockName: string) => {
		workspace.openOverlay(() => (
			<>
				<DialogHeader>
					<DialogTitle>Delete Selected Block?</DialogTitle>
				</DialogHeader>
				<div className="px-6 py-4">
					<p className="text-muted-foreground text-sm">
						You will permanently remove the block from the community
						block section.
					</p>
				</div>
				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => workspace.closeOverlay()}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => deleteBlock(blockId)}
					>
						Delete
					</Button>
				</DialogFooter>
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
			const uniqueSectionMap = items.reduce(
				(acc, curr) => {
					acc[curr.section] = true;
					return acc;
				},
				{} as Record<string, boolean>,
			);
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
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
			className="bg-background text-foreground"
		>
			<div
				style={{ flexShrink: 0 }}
				className="flex w-full flex-col gap-2 px-3 py-1"
			>
				<div className="w-fit rounded-2xl bg-primary/10 px-4">
					<span className="font-normal text-[13px] text-primary leading-[18px] tracking-[0.16px]">
						{title}
					</span>
				</div>
				<div className="relative w-full">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						placeholder="Search"
						className="w-full pr-10 pl-9"
						value={search}
						onChange={setSearch}
						trailing={
							<Popover
								open={filterMenuOpen}
								onOpenChange={setFilterMenuOpen}
							>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="rounded p-1 hover:bg-accent"
									>
										<Badge
											variant={
												anyEnabledFilter
													? "default"
													: "outline"
											}
											className="p-0.5"
										>
											<SlidersHorizontal className="size-4" />
										</Badge>
									</button>
								</PopoverTrigger>
								<BlocksMenuPanelFilterMenu
									categoryMap={filterCategoryMap}
									setCategoryMap={setFilterCategoryMap}
									onClose={() => setFilterMenuOpen(false)}
								/>
							</Popover>
						}
					/>
					<div className="px-3 pb-2">
						<Tabs
							value={mode}
							onValueChange={(val) => {
								setMode(val as MODE);
								if (val === "COMMUNITY") {
									getClientBlocks();
								}
							}}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-2 gap-0.5">
								<TabsTrigger
									value="SYSTEM"
									className="w-full min-w-0 max-w-full flex-none px-1 text-xs"
								>
									<span
										className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-center"
										title="System Blocks"
									>
										System Blocks
									</span>
								</TabsTrigger>
								<TabsTrigger
									value="COMMUNITY"
									className="w-full min-w-0 max-w-full flex-none px-1 text-xs"
								>
									<span
										className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-center"
										title="Community Blocks"
									>
										Community Blocks
									</span>
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</div>
			}
		>
			<div
				style={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					overflowX: "hidden",
				}}
				className="pb-4"
			>
				{renderedItems.length ? (
					renderedItems.map((sectionItems, index) => (
						<div
							key={sectionItems[0].section ?? defaultSection}
							className="w-full"
						>
							{index > 0 && (
								<div className="pt-2">
									<Separator />
								</div>
							)}
							<div className="px-3 pt-2 pb-1.5">
								<p className="m-0 select-none font-semibold text-muted-foreground text-xs uppercase tracking-[0.05em]">
									{sectionItems[0].section ?? defaultSection}
								</p>
							</div>
							<div className="w-full">
								<div className="grid w-full gap-2 px-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
									{sectionItems.map((block) => (
										<div key={block.name}>
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
										</div>
									))}
								</div>
							</div>
						</div>
					))
				) : (
					<div className="p-4">
						{loading ? (
							<div className="flex w-full flex-wrap gap-4">
								{[1, 2, 3].map((n) => (
									<Skeleton
										key={n}
										className="h-[133px] w-[133px]"
									/>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								No items found
							</p>
						)}
					</div>
				)}
			</div>
		</Panel>
	);
});
