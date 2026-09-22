import {
	BookmarkPlus,
	BoxSelect,
	Braces,
	Copy,
	Search,
	SearchX,
	SquareDashedMousePointer,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useState } from "react";
import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
import {
	Button,
	H3,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import VariationIcon from "@/assets/img/VariationLogo.svg";
import { SelectedMenuSection } from "@/components/designer/SelectedMenuSection";
import { AddVariableModal } from "@/components/notebook/AddVariableModal";
import { Panel } from "@/components/workspace/panels/panel";
import { useDesigner } from "@/hooks/useDesigner";
import { BlockSettingsRegistry } from "../blocks";
import { PanelEmptyState } from "./panel-empty-state";

export interface SelectedBlocksProps {
	/** Title to render in the menu */
	title: string;
}

export const SelectedBlockPanel = observer(() => {
	const { designer } = useDesigner();
	const { state } = useBlocks();
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
	const [settingSection, setSettingSection] = useState<string>("0");
	const [showJsonEditor, setShowJsonEditor] = useState(false);
	const [jsonValue, setJsonValue] = useState(
		block ? JSON.stringify(block.data?.style ?? {}, null, 2) : "{}",
	);
	// get the content menu
	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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

			toast.success("Successfully copied ID");
		} catch (_e) {
			toast.error("Unable to copy ID");
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: JSON.stringify used as stable dep
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
				<PanelEmptyState
					icon={BoxSelect}
					title="Multiple blocks selected"
					message="Select a single block to edit its settings"
				/>
			</Panel>
		);
	}

	// ignore if there is no menu
	if (!block) {
		return (
			<Panel>
				<PanelEmptyState
					icon={SquareDashedMousePointer}
					title="No block selected"
					message="Select a block to view its settings"
				/>
			</Panel>
		);
	}

	return (
		<Panel>
			<div className="flex h-full w-full flex-col">
				<div className="flex min-w-0 flex-col gap-1 px-2 py-1">
					<div className="flex min-w-0 items-center justify-between gap-1">
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<img
								src={VariationIcon}
								className="size-4 shrink-0"
								alt=""
							/>
							<H3 className="min-w-0 break-words font-bold text-foreground text-sm capitalize">
								{getBlockDisplay()}
							</H3>
						</div>
						<div className="flex shrink-0 items-center">
							{variableName ? (
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<Button
											aria-label={`Copy {{${variableName}}}`}
											variant="ghost"
											size="icon-sm"
											onClick={() =>
												copy(`{{${variableName}}}`)
											}
										>
											<Copy
												className="size-4"
												aria-hidden="true"
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent>{`Copy {{${variableName}}}`}</TooltipContent>
								</Tooltip>
							) : canVariabilize ? (
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<Button
											aria-label="Add variable"
											variant="ghost"
											size="icon-sm"
											onClick={() =>
												setAddVariableModal(true)
											}
										>
											<BookmarkPlus
												className="size-4"
												aria-hidden="true"
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Add variable
									</TooltipContent>
								</Tooltip>
							) : null}
							{!menu && (
								<>
									{settingSection === "1" && (
										<Tooltip
											disableHoverableContent={false}
										>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label="Edit style JSON"
													aria-pressed={
														showJsonEditor
													}
													onClick={() =>
														setShowJsonEditor(
															(value) => !value,
														)
													}
												>
													<Braces
														className="size-4"
														aria-hidden="true"
													/>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Edit style JSON
											</TooltipContent>
										</Tooltip>
									)}
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<Button
												aria-label={
													showSearch
														? "Hide settings search"
														: "Search settings"
												}
												aria-expanded={showSearch}
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setShowSearch(
														(value) => !value,
													);
													setSearch("");
												}}
											>
												{showSearch ? (
													<SearchX
														className="size-4"
														aria-hidden="true"
													/>
												) : (
													<Search
														className="size-4"
														aria-hidden="true"
													/>
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{showSearch
												? "Hide settings search"
												: "Search settings"}
										</TooltipContent>
									</Tooltip>
								</>
							)}
						</div>
					</div>
					{!menu && showSearch && (
						<Input
							aria-label="Search settings"
							placeholder="Search settings"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					)}
				</div>
				<div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto px-2 pb-2">
					{!!menu &&
						createElement(menu, {
							id: block.id,
						})}

					{(contentMenu.length > 0 || styleMenu.length > 0) && (
						<Tabs
							value={settingSection}
							onValueChange={(val) => setSettingSection(val)}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-2 gap-0.5">
								<TabsTrigger
									value="0"
									className="w-full text-xs"
									data-testid={
										"selectedBlockPanel-settings-toggle"
									}
								>
									Settings
								</TabsTrigger>
								<TabsTrigger
									value="1"
									className="w-full text-xs"
									data-testid={
										"selectedBlockPanel-appearance-toggle"
									}
								>
									Appearance
								</TabsTrigger>
							</TabsList>

							{contentMenu.length > 0 && (
								<TabsContent value="0">
									{contentMenu.length ? (
										<SelectedMenuSection
											id={block.id}
											sectionTitle=""
											menu={contentMenu}
											accordion={contentAccordion}
											setAccordion={setContentAccordion}
										/>
									) : null}
								</TabsContent>
							)}

							{styleMenu.length > 0 && (
								<TabsContent value="1">
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
										<div className="mt-4 flex flex-col gap-2">
											<Textarea
												rows={8}
												className="max-h-80 min-h-32 resize-y font-mono"
												aria-label="Style JSON"
												placeholder="Style JSON"
												value={jsonValue}
												onChange={(e) =>
													setJsonValue(e.target.value)
												}
											/>
											<div className="flex flex-row justify-end gap-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => {
														setJsonValue(
															block
																? JSON.stringify(
																		block
																			.data
																			?.style ??
																			{},
																		null,
																		2,
																	)
																: "{}",
														);
														setShowJsonEditor(
															false,
														);
													}}
												>
													Cancel
												</Button>
												<Button
													type="button"
													variant="default"
													size="sm"
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
															toast.success(
																"Style updated!",
															);
															setShowJsonEditor(
																false,
															);
														} catch (_err) {
															toast.error(
																"Invalid JSON",
															);
														}
													}}
												>
													Save Changes
												</Button>
											</div>
										</div>
									)}
								</TabsContent>
							)}
						</Tabs>
					)}
				</div>
				{addVariableModal ? (
					<AddVariableModal
						open={true}
						type="block"
						to={designer.selected}
						onClose={() => setAddVariableModal(false)}
					/>
				) : null}
			</div>
		</Panel>
	);
});
