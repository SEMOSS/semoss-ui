import {
	ArrowLeftRight,
	FilePlus,
	Image,
	List,
	MousePointerClick,
	Plus,
	SquarePlus,
	Trash2,
	Type,
} from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useLayoutEffect, useState } from "react";
import {
	ActionMessages,
	type BlockJSON,
	INPUT_BLOCK_TYPES,
	useBlocks,
} from "@semoss/renderer";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useDesigner, useRootStore } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";
import { getDependencyCells } from "@/utility/dependencyScanner";
import DuplicateIcon from "../../assets/img/Duplicate.svg";
import { DependencyPromptModal } from "../blocks-workspace";
import { AddClientBlockModal } from "./AddClientBlockModal";
import { QuickMenu } from "./QuickMenu";

const STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH = 48;
const STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT = 32;

const quickMenu = [
	{
		name: "Container",
		value: "container",
		icon: <List className="size-4" />,
	},
	{ name: "Text", value: "text", icon: <Type className="size-4" /> },
	{ name: "Image", value: "image", icon: <Image className="size-4" /> },
	{ name: "Card", value: "flip-card", icon: <FilePlus className="size-4" /> },
	{
		name: "Button",
		value: "button",
		icon: <MousePointerClick className="size-4" />,
	},
];

const iconButtonClass =
	"flex size-8 cursor-pointer items-center justify-center rounded bg-white text-[#757575] hover:bg-gray-50 focus:outline-none";

interface DeleteDuplicateMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

export const DeleteDuplicateMask = observer(
	(props: DeleteDuplicateMaskProps) => {
		const { screenEle } = props;

		const [size, setSize] = useState<{
			top: number;
			left: number;
			height: number;
			width: number;
		} | null>(null);

		const [openModal, setOpenModal] = useState<boolean>(false);

		const [showDependentModal, setShowDependentModal] =
			useState<boolean>(false);
		const [dependentCells, setDependentCells] = useState<string[]>([]);

		const { registry, state } = useBlocks();
		const { designer } = useDesigner();
		const { configStore } = useRootStore();

		const block = state.getBlock(designer.selected);

		const hasChildren = block?.slots?.children?.children?.length > 0;
		const isIterationOrContainer =
			block == null
				? false
				: block.widget === "iteration" ||
					block.widget === "container" ||
					block.widget === "form";
		const isForm = block?.widget === "form";
		const isChangeable =
			hasChildren && block?.widget !== "container" && !isForm;
		const showQuickMenu = isIterationOrContainer && !isForm;
		const isVisible =
			block && registry[block.widget] && block.widget !== "page";

		const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

		useLayoutEffect(() => {
			if (!isVisible) {
				return;
			}

			const repositionMask = () => {
				const blockEle = getBlockElement(designer.selected);
				if (!blockEle) {
					return;
				}
				const updated = getRelativeSize(blockEle, screenEle);
				setSize(updated);
			};

			const observer = new MutationObserver(() => {
				repositionMask();
			});

			observer.observe(screenEle, {
				subtree: true,
				childList: true,
			});

			repositionMask();

			return () => observer.disconnect();
		}, [designer.selected, isVisible, screenEle]);

		if (!size || !isVisible) {
			return null;
		}

		const getStyle = () => {
			const screenElementSize = screenEle.getBoundingClientRect();
			const selectedElement = getBlockElement(designer.selected);
			if (!selectedElement) return;
			const selectedElementSize = selectedElement.getBoundingClientRect();

			const hasLeftOverflow =
				screenElementSize.left === selectedElementSize.left &&
				selectedElementSize.width <
					STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2;
			const hasRightOverflow =
				screenElementSize.right === selectedElementSize.right &&
				selectedElementSize.width <
					STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2;

			const leftValue =
				size.left +
				size.width -
				STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 3 -
				12;

			let left: string;
			if (hasRightOverflow) {
				left = `${
					leftValue -
					(
						STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2 -
							selectedElementSize.width
					) +
					8
				}px`;
			} else if (hasLeftOverflow) {
				left = `${size.left - 8}px`;
			} else {
				left = `${leftValue}px`;
			}

			const top = size.top - STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT * 2;

			return { top, left };
		};

		const onClear = () => {
			state.dispatch({
				message: ActionMessages.REMOVE_BLOCK,
				payload: {
					id: designer.selected,
					keep: true,
				},
			});
			designer.setSelected("");
		};

		const addVariable = (id: string) => {
			const block = state.getBlock(id as string);
			if (block.slots) {
				if (INPUT_BLOCK_TYPES.indexOf(block.widget) > -1) {
					state.dispatch({
						message: ActionMessages.ADD_VARIABLE,
						payload: {
							id: id as string,
							type: "block",
							to: id as string,
						},
					});
				}
				Object.keys(block.slots).forEach((slot) => {
					const children = block.slots[slot].children;
					if (children?.length) {
						children.forEach((childId) => {
							addVariable(childId);
						});
					}
				});
			}
		};

		const dispatchDeleteBlock = () => {
			const parentBlock = state.getBlock(block.parent.id);

			state.dispatch({
				message: ActionMessages.REMOVE_BLOCK,
				payload: {
					id: designer.selected,
					keep: false,
				},
			});

			if (parentBlock.widget === "iteration") {
				state.dispatch({
					message: ActionMessages.SET_BLOCK_DATA,
					payload: {
						id: parentBlock.id,
						path: "child",
						value: null,
					},
				});
			}

			designer.setSelected("");
		};

		const onDelete = async () => {
			const dependentCellsList = await getDependencyCells(
				state,
				"",
				"",
				designer.selected,
			);
			if (dependentCellsList.length > 0) {
				const formattedDependentCells = dependentCellsList.map(
					(cell) => {
						return cell.split(".")[0];
					},
				);
				setShowDependentModal(true);
				setDependentCells(formattedDependentCells);
			} else {
				dispatchDeleteBlock();
			}
		};

		const onDuplicate = async () => {
			const getJsonForBlock = (id: string) => {
				const block = state.blocks[id];

				const blockJson = {
					widget: toJS(block.widget),
					data: toJS(block.data),
					listeners: toJS(block.listeners),
					slots: {},
				};

				for (const slot in block.slots) {
					if (block.slots[slot]) {
						blockJson.slots[slot] = block.slots[slot].children.map(
							(childId) => {
								return getJsonForBlock(childId);
							},
						);
					}
				}

				return blockJson;
			};

			const parentBlock = state.getBlock(block.parent.id);
			if (parentBlock.widget === "iteration") {
				toast.error(
					`Unable to duplicate ${block.widget} within an Iterator Block`,
				);
				return;
			}

			const position = block?.parent?.id
				? {
						parent: block.parent.id,
						slot: block.parent.slot,
						sibling: block.id,
						type: "after",
					}
				: undefined;

			const id = await state.dispatch({
				message: ActionMessages.ADD_BLOCK,
				payload: {
					json: getJsonForBlock(block.id) as BlockJSON,
					position: position,
				},
			});

			if (INPUT_BLOCK_TYPES.indexOf(block.widget) > -1) {
				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: id as string,
						type: "block",
						to: id as string,
					},
				});
			} else {
				addVariable(id as string);
			}

			designer.setSelected(id ? (id as string) : "");
		};

		const addBlock = isIterationOrContainer
			? (item: {
					name: string;
					value: string;
					icon: React.ReactElement;
				}) => {
					const blockJson = {
						widget: item.value,
						data: registry[item.value].data,
						listeners: registry[item.value].listeners,
						slots: registry[item.value].slots,
					} as BlockJSON;

					if (block.widget === "iteration") {
						if (block.slots.children.children?.length > 0) {
							[...block.slots.children.children].forEach(
								(child) => {
									state.dispatch({
										message: ActionMessages.REMOVE_BLOCK,
										payload: {
											id: child,
											keep: false,
										},
									});
								},
							);
						}
					}

					(async () => {
						const id = await state.dispatch({
							message: ActionMessages.ADD_BLOCK,
							payload: {
								json: blockJson as BlockJSON,
								position: {
									parent: block.id,
									slot: "children",
								},
							},
						});

						if (block.widget === "iteration") {
							state.dispatch({
								message: ActionMessages.SET_BLOCK_DATA,
								payload: {
									id: block.id,
									path: "child",
									value: state.getBlock(id as string),
								},
							});
						}

						setAnchorEl(null);
					})();
				}
			: null;

		return (
			<div
				style={{
					position: "absolute",
					padding: "16px",
					top: "0",
					right: "0",
					bottom: "0",
					left: "0",
					zIndex: 30,
					width: `${STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH}px`,
					height: `${STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT}px`,
					...getStyle(),
				}}
			>
				<TooltipProvider>
					<div
						className="flex rounded bg-white"
						style={{
							boxShadow:
								"0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						}}
					>
						{isIterationOrContainer && (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											className={iconButtonClass}
											onClick={(e) => {
												if (isForm) {
													window.dispatchEvent(
														new CustomEvent(
															"FORM_MENU_OPEN",
															{
																detail: {
																	formId: block.id,
																},
															},
														),
													);
												} else {
													setAnchorEl(
														e.currentTarget as HTMLElement,
													);
												}
											}}
										>
											{isChangeable ? (
												<ArrowLeftRight className="size-4" />
											) : (
												<Plus className="size-4" />
											)}
										</button>
									</TooltipTrigger>
									<TooltipContent>
										{isChangeable
											? "Swap Child Block"
											: "Add Block to Content"}
									</TooltipContent>
								</Tooltip>

								{anchorEl && showQuickMenu && (
									<QuickMenu
										parentId={block.id}
										anchorEl={anchorEl}
										quickMenu={quickMenu}
										onClose={() => setAnchorEl(null)}
										onSelect={addBlock}
									/>
								)}
							</>
						)}
						{configStore.store.user.admin && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className={iconButtonClass}
										onClick={() => setOpenModal(true)}
									>
										<SquarePlus className="size-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Add to client</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className={iconButtonClass}
									onClick={onDuplicate}
								>
									<img
										src={DuplicateIcon}
										alt="Duplicate Icon"
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent>Duplicate</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className={iconButtonClass}
									onClick={
										designer.rendered === designer.selected
											? onClear
											: onDelete
									}
								>
									<Trash2 className="size-4" />
								</button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
				<AddClientBlockModal
					isOpen={openModal}
					onClose={() => setOpenModal(false)}
					selected={designer.selected}
				/>
				<DependencyPromptModal
					open={showDependentModal}
					onClose={() => {
						setShowDependentModal(false);
					}}
					onDelete={() => dispatchDeleteBlock()}
					dependents={dependentCells}
					showReplaceOptions={false}
					cosmetics={{
						title: "Delete Block?",
						desc: "This block is linked to multiple cells in your app. Deleting it may cause errors or broken connections.",
					}}
				/>
			</div>
		);
	},
);
