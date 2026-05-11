import { BookmarkPlus, Copy, Search, SearchX } from "lucide-react";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useState } from "react";
import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
import {
	Button,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
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
	<button
		type="button"
		style={{
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 10,
			border: "1px solid #E6E6E6",
			borderRadius: 8,
			boxSizing: "border-box",
			cursor: "pointer",
			background: "none",
			padding: 0,
		}}
		onClick={onClick}
		title={title}
	>
		{children}
	</button>
);
// UnstyledIconButton parent of Icon
const UnstyledIconButton = ({
	children,
	...props
}: {
	children: React.ReactNode;
	[key: string]: unknown;
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
const CssRoundedSVG = (_props: React.SVGProps<SVGSVGElement>) => (
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
				<div className="p-4">
					<div className="flex items-center gap-3 rounded bg-[#F5F5F5] p-3">
						<div className="flex h-[22px] w-[22px] items-start">
							<img
								src={MultiBlockIcon}
								alt="Multiple Blocks Selected"
							/>
						</div>
						<div className="flex flex-1 flex-col items-start justify-center">
							<p
								className="font-medium"
								style={{
									alignSelf: "stretch",
									color: "#666",
									fontFamily:
										'"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									fontSize: "16px",
									fontWeight: 500,
									lineHeight: "150%",
									letterSpacing: "0.15px",
								}}
							>
								Multiple Blocks Selected
							</p>
							<p
								style={{
									alignSelf: "stretch",
									color: "#666",
									fontFamily:
										'"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									fontSize: "14px",
									fontWeight: 400,
									lineHeight: "150%",
									letterSpacing: "0.17px",
								}}
							>
								Select a single block to view its setting
							</p>
						</div>
					</div>
				</div>
			</Panel>
		);
	}

	// ignore if there is no menu
	if (!block) {
		return (
			<Panel>
				<div className="p-4">
					<div className="flex items-center gap-3 rounded bg-[#F5F5F5] p-3">
						<div className="flex h-[22px] w-[22px] items-start">
							<img src={GroupIcon} alt="No Blocks Selected" />
						</div>
						<div className="flex h-full w-full flex-col items-center justify-center py-1.5">
							<p
								className="font-medium"
								style={{
									alignSelf: "stretch",
									color: "#666",
									fontFamily:
										'"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									fontSize: "16px",
									fontWeight: 500,
									lineHeight: "150%",
									letterSpacing: "0.15px",
								}}
							>
								No Block Selected
							</p>
							<p
								style={{
									alignSelf: "stretch",
									color: "#666",
									fontFamily:
										'"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									fontSize: "14px",
									fontWeight: 400,
									lineHeight: "150%",
									letterSpacing: "0.17px",
								}}
							>
								Select a block to view its setting
							</p>
						</div>
					</div>
				</div>
			</Panel>
		);
	}

	return (
		<Panel>
			<div className="flex h-full w-full flex-col pt-1">
				<div className="flex flex-row items-center gap-1 pt-1.5 pr-1 pb-1.5 pl-2">
					<div className="flex flex-1 flex-row items-center gap-2">
						<img
							src={VariationIcon}
							className="h-4 w-4"
							alt="Variation"
						/>
						<div className="flex flex-row items-center gap-1">
							<span className="font-bold text-base capitalize">
								{getBlockDisplay()}
							</span>
							{variableName ? (
								<Button
									aria-label="copy"
									variant="ghost"
									size="icon-sm"
									title={`{{${variableName}}}`}
									onClick={() => copy(`{{${variableName}}}`)}
								>
									<Copy className="size-4" />
								</Button>
							) : canVariabilize ? (
								<Button
									aria-label="copy"
									variant="ghost"
									size="icon-sm"
									title={"Add variable"}
									onClick={() => {
										setAddVariableModal(true);
									}}
								>
									<BookmarkPlus className="size-4" />
								</Button>
							) : null}
						</div>

						{!menu && (
							<div className="flex flex-1 flex-col items-end justify-end gap-1">
								{settingSection === "1" && (
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
								<div className="flex flex-row items-center justify-end gap-1">
									{showSearch && (
										<Input
											placeholder="Search"
											value={search}
											onChange={(e) =>
												setSearch(e.target.value)
											}
										/>
									)}
									<Button
										aria-label="toggle-search"
										variant="ghost"
										size="icon-sm"
										onClick={() => {
											setShowSearch(!showSearch);
											setSearch("");
										}}
									>
										{showSearch ? (
											<SearchX className="size-5" />
										) : (
											<Search className="size-5" />
										)}
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="h-full w-full flex-1 overflow-y-auto pr-2 pb-1">
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
							<TabsList className="flex min-h-[42px] w-full rounded px-[3px]">
								<TabsTrigger
									value="0"
									className="h-[38px] flex-1 px-4 py-2"
									data-testid={
										"selectedBlockPanel-settings-toggle"
									}
								>
									Settings
								</TabsTrigger>
								<TabsTrigger
									value="1"
									className="h-[38px] flex-1 px-4 py-2"
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
											<textarea
												rows={8}
												className="w-full resize-y rounded border border-input px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
												style={{
													minHeight: "8rem",
													maxHeight: "20rem",
												}}
												placeholder="CSS Settings"
												value={jsonValue}
												onChange={(e) =>
													setJsonValue(e.target.value)
												}
											/>
											<div className="flex flex-row justify-end gap-2">
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
												</button>
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
