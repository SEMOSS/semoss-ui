import {
	Add,
	AddBox,
	AddCard,
	DeleteOutline,
	Image,
	List,
	SmartButton,
	SwapHoriz,
	TextFields,
} from "@mui/icons-material";
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
	ButtonGroup,
	IconButton,
	styled,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import { useDesigner, useRootStore } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";
import DuplicateIcon from "../../assets/img/Duplicate.svg";
import { AddClientBlockModal } from "./AddClientBlockModal";
import { QuickMenu } from "./QuickMenu";

const STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH = 48;
const STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT = 32;

const StyledContainer = styled("div")(({ theme }) => ({
	position: "absolute",
	padding: theme.spacing(2),
	top: "0",
	right: "0",
	bottom: "0",
	left: "0",
	zIndex: "30",
	width: `${STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH}px`,
	height: `${STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT}px`,
}));

const StyledButtonGroup = styled(ButtonGroup)(() => ({
	boxShadow:
		"0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)", // custom from design
	backgroundColor: "white",
}));

const StyledButtonGroupIconButton = styled(IconButton)(({ theme }) => ({
	width: `${STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH}px`,
	backgroundColor: "white",
	borderRadius: theme.shape.borderRadius,
}));

interface DeleteDuplicateMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

const quickMenu = [
	{ name: "Container", value: "container", icon: <List /> },
	{ name: "Text", value: "text", icon: <TextFields /> },
	{ name: "Image", value: "image", icon: <Image /> },
	{ name: "Card", value: "flip-card", icon: <AddCard /> },
	{ name: "Button", value: "button", icon: <SmartButton /> },
];

export const DeleteDuplicateMask = observer(
	(props: DeleteDuplicateMaskProps) => {
		const { screenEle } = props;

		// create the state
		const [size, setSize] = useState<{
			top: number;
			left: number;
			height: number;
			width: number;
		} | null>(null);

		const [openModal, setOpenModal] = useState<boolean>(false);

		// get the store
		const { registry, state } = useBlocks();
		const { designer } = useDesigner();
		const notification = useNotification();
		const { configStore } = useRootStore();

		// get the block
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
		// check if it is visible
		const isVisible =
			block && registry[block.widget] && block.widget !== "page";

		const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

		// get the root, watch changes, and reposition the mask
		useLayoutEffect(() => {
			if (!isVisible) {
				return;
			}

			// reposition the mask
			const repositionMask = () => {
				// get the block element
				const blockEle = getBlockElement(designer.selected);

				if (!blockEle) {
					return;
				}

				// calculate and set the side
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

			// reposition it
			repositionMask();

			return () => observer.disconnect();
		}, [designer.selected, isVisible, screenEle]);

		if (!size || !isVisible) {
			return null;
		}

		const getStyle = () => {
			// get position of page root block element
			const screenElementSize = screenEle.getBoundingClientRect();
			// get position of selected block element
			const selectedElement = getBlockElement(designer.selected);
			if (!selectedElement) return;
			const selectedElementSize = selectedElement.getBoundingClientRect();

			// check for overflow
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
			// dispatch the event
			state.dispatch({
				message: ActionMessages.REMOVE_BLOCK,
				payload: {
					id: designer.selected,
					keep: true,
				},
			});

			// clear the selected value
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

		/**
		 * Delete the block
		 */
		const onDelete = () => {
			const parentBlock = state.getBlock(block.parent.id);

			// dispatch the event
			state.dispatch({
				message: ActionMessages.REMOVE_BLOCK,
				payload: {
					id: designer.selected,
					keep: false,
				},
			});

			// If its within an iteration block, clean up the data.child
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

			// clear the selected value
			designer.setSelected("");
		};

		const onDuplicate = async () => {
			// get the json for the block to add
			const getJsonForBlock = (id: string) => {
				const block = state.blocks[id];

				const blockJson = {
					widget: toJS(block.widget),
					data: toJS(block.data),
					listeners: toJS(block.listeners),
					slots: {},
				};

				// generate the slots
				for (const slot in block.slots) {
					if (block.slots[slot]) {
						blockJson.slots[slot] = block.slots[slot].children.map(
							(childId) => {
								return getJsonForBlock(childId);
							},
						);
					}
				}

				// return it
				return blockJson;
			};

			const parentBlock = state.getBlock(block.parent.id);
			if (parentBlock.widget === "iteration") {
				notification.add({
					color: "error",
					message: `Unable to duplicate ${block.widget} within an Iterator Block`,
				});
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

			// TODO: REFACTOR
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

		// Conditionally define addBlock to avoid unnecessary creation when not needed.
		// This ensures the function is only created if the block is an iteration or container.
		const addBlock = isIterationOrContainer
			? (item: {
					name: string;
					value: string;
					icon: React.ReactElement;
				}) => {
					// Create the new block JSON
					const blockJson = {
						widget: item.value,
						data: registry[item.value].data,
						listeners: registry[item.value].listeners,
						slots: registry[item.value].slots,
					} as BlockJSON;

					// If the block is an iteration and has children, remove them first
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

					// Make this function async and await the dispatch
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
			<StyledContainer style={getStyle()}>
				<StyledButtonGroup>
					{isIterationOrContainer && (
						<>
							<Tooltip
								title={
									isChangeable
										? "Swap Child Block"
										: "Add Block to Content"
								}
							>
								<StyledButtonGroupIconButton
									sx={{ color: "#757575" }}
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
									{isChangeable ? <SwapHoriz /> : <Add />}
								</StyledButtonGroupIconButton>
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
						<Tooltip title="Add to client">
							<StyledButtonGroupIconButton
								sx={{ color: "#757575" }}
								size="small"
								onClick={() => setOpenModal(true)}
							>
								<AddBox />
							</StyledButtonGroupIconButton>
						</Tooltip>
					)}
					<Tooltip title="Duplicate">
						<StyledButtonGroupIconButton
							sx={{ color: "#757575" }}
							size="small"
							onClick={onDuplicate}
						>
							<img src={DuplicateIcon} alt="Duplicate Icon" />
						</StyledButtonGroupIconButton>
					</Tooltip>
					<Tooltip title="Delete">
						<StyledButtonGroupIconButton
							sx={{ color: "#757575" }}
							onClick={
								designer.rendered === designer.selected
									? onClear
									: onDelete
							}
						>
							<DeleteOutline />
						</StyledButtonGroupIconButton>
					</Tooltip>
				</StyledButtonGroup>
				<AddClientBlockModal
					isOpen={openModal}
					onClose={() => setOpenModal(false)}
					selected={designer.selected}
				/>
			</StyledContainer>
		);
	},
);
