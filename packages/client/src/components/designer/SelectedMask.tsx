import { DragIndicator } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Stack, styled, Typography, useNotification } from "@semoss/ui";
import { useDesigner } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";
import { BlockSettingsRegistry } from "../blocks-workspace/blocks";

const StyledContainer = styled("div")(({ theme }) => ({
	position: "absolute",
	top: "0",
	right: "0",
	bottom: "0",
	left: "0",
	zIndex: "20",
	pointerEvents: "none",
	userSelect: "none",
	outlineWidth: "2px",
	outlineStyle: "solid",
	outlineColor: theme.palette.primary.main,
}));

const StyledTitle = styled("div")(({ theme }) => ({
	display: "inline-flex",
	alignItems: "center",
	position: "absolute",
	top: theme.spacing(-3),
	left: `-1px`,
	height: theme.spacing(3),
	paddingLeft: theme.spacing(1),
	paddingRight: theme.spacing(1),
	pointerEvents: "auto",
	cursor: "grab",
	backgroundColor: theme.palette.primary.main,
	color: theme.palette.common.white,
	whiteSpace: "nowrap",
}));

interface SelectedMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

/**
 * Show the information of a selected block
 */
export const SelectedMask = observer((props: SelectedMaskProps) => {
	const { screenEle } = props;
	const notification = useNotification();

	// create the state
	const [size, setSize] = useState<{
		top: number;
		left: number;
		height: number;
		width: number;
	} | null>(null);
	const [local, setLocal] = useState(false);

	// get the store
	const { state } = useBlocks();
	const { designer } = useDesigner();

	// get the block
	const block = state.getBlock(designer.selected);
	const variableName = state.getAlias(designer.selected);

	// check if it is draggable
	const isDraggable =
		block && BlockSettingsRegistry[block.widget] && block.widget !== "page";

	// check if all blocks are draggable
	const areAllBlocksDraggable = (): boolean => {
		return designer.selectedBlocks.every((id) => {
			const block = state.getBlock(id);
			return (
				block &&
				BlockSettingsRegistry[block.widget] &&
				block.widget !== "page"
			);
		});
	};

	/**
	 * Handle the mousedown on the block.
	 */
	const handleMouseDown = () => {
		if (designer.selectedBlocks.length > 1) {
			if (!areAllBlocksDraggable()) {
				return;
			}
			// Handle drag for multiple selected blocks
			designer.activateDrag(
				designer.selectedBlocks
					.map((id) => state.getBlock(id).widget)
					.join(","),
				(parent) => {
					// Ensure none of the selected blocks are children of the parent
					return !designer.selectedBlocks.some((id) =>
						state.containsBlock(id, parent),
					);
				},
				designer.selectedBlocks.join(","),
				designer.selectedBlocks.map(
					(id) =>
						BlockSettingsRegistry[state.getBlock(id).widget].icon,
				),
			);

			// Clear the hovered block
			designer.setHovered("");

			// Set as inactive
			setLocal(true);
		} else {
			// Existing logic for single block drag
			if (!isDraggable) {
				return;
			}
			// set the dragged
			designer.activateDrag(
				block.widget,
				(parent) => {
					// if the parent block is a child of the selected, we cannot add
					if (state.containsBlock(designer.selected, parent)) {
						return false;
					}

					return true;
				},
				block.id,
				BlockSettingsRegistry[block.widget].icon,
			);

			// Clear the hovered block
			designer.setHovered("");

			// Set as inactive
			setLocal(true);
		}
	};

	/**
	 * Handle the mouseup event on the document
	 */
	const handleDocumentMouseUp = useCallback(() => {
		if (!designer.drag.active) {
			return;
		}
		// apply the action
		const placeholderAction = designer.drag.placeholderAction;

		if (placeholderAction) {
			if (designer.selectedBlocks.length > 1) {
				// Handle multiple block movements
				let lastSiblingId = placeholderAction.id; // Start with the placeholder ID
				designer.selectedBlocks.forEach((id) => {
					const sw = state.getBlock(placeholderAction.id);

					if (
						placeholderAction.type === "before" ||
						placeholderAction.type === "after"
					) {
						const siblingWidget = state.getBlock(lastSiblingId); // Use the last sibling ID

						if (siblingWidget.parent) {
							const parent = state.getBlock(sw.parent.id);
							if (parent.widget === "iteration") {
								if (parent.slots.children.children.length) {
									notification.add({
										color: "error",
										message:
											"Please delete block within iterator before adding another child",
									});
									designer.deactivateDrag();
									return;
								}
							}
							state.dispatch({
								message: ActionMessages.MOVE_BLOCK,
								payload: {
									id,
									position: {
										parent: siblingWidget.parent.id,
										slot: siblingWidget.parent.slot,
										sibling:
											placeholderAction.type === "before"
												? siblingWidget.id
												: lastSiblingId,
										type: placeholderAction.type,
									},
								},
							});

							// Update the lastSiblingId to the current block
							lastSiblingId = id;
						}
					} else if (placeholderAction.type === "replace") {
						if (sw.widget !== "iteration") {
							state.dispatch({
								message: ActionMessages.SET_BLOCK_DATA,
								payload: {
									id: placeholderAction.id,
									path: "child",
									value: state.getBlock(id),
								},
							});
						}
						if (sw.widget !== "iteration") {
							state.dispatch({
								message: ActionMessages.MOVE_BLOCK,
								payload: {
									id,
									position: {
										parent: placeholderAction.id,
										slot: placeholderAction.slot,
									},
								},
							});
						}
					}
				});
			} else {
				// Existing logic for single block movement
				const sw = state.getBlock(placeholderAction.id);

				if (
					placeholderAction.type === "before" ||
					placeholderAction.type === "after"
				) {
					const siblingWidget = state.getBlock(placeholderAction.id);

					if (siblingWidget.parent) {
						const parent = state.getBlock(sw.parent.id);
						if (parent.widget === "iteration") {
							if (parent.slots.children.children.length) {
								notification.add({
									color: "error",
									message:
										"Please delete block within iterator before adding another child",
								});
								designer.deactivateDrag();
								return;
							}
						}
						state.dispatch({
							message: ActionMessages.MOVE_BLOCK,
							payload: {
								id: designer.selected,
								position: {
									parent: siblingWidget.parent.id,
									slot: siblingWidget.parent.slot,
									sibling: siblingWidget.id,
									type: placeholderAction.type,
								},
							},
						});
					}
				} else if (placeholderAction.type === "replace") {
					if (sw.widget === "iteration") {
						state.dispatch({
							message: ActionMessages.SET_BLOCK_DATA,
							payload: {
								id: placeholderAction.id,
								path: "child",
								value: state.getBlock(designer.selected),
							},
						});
					}

					state.dispatch({
						message: ActionMessages.MOVE_BLOCK,
						payload: {
							id: designer.selected,
							position: {
								parent: placeholderAction.id,
								slot: placeholderAction.slot,
							},
						},
					});
				}
			}
		}

		// Clear the drag
		designer.deactivateDrag();

		// Clear the hovered block
		designer.setHovered("");

		// Set as active
		setLocal(false);
	}, [
		designer.selected,
		designer.selectedBlocks,
		designer.drag.active,
		designer.drag.placeholderAction,
		state,
		designer,
	]);

	// reposition the mask
	const repositionMask = () => {
		// Use designer.selected or fallback to the first ID in designer.selectedIds
		const selectedId = designer.selected || designer.selectedBlocks[0];
		if (!selectedId) {
			return;
		}

		const blockEle = getBlockElement(selectedId);

		if (!blockEle) {
			return;
		}

		// Calculate and set the size
		const updated = getRelativeSize(blockEle, screenEle);
		setSize(updated);
	};

	// update the mask when the screen is resized
	useEffect(() => {
		window.addEventListener("resize", repositionMask);
	}, []);

	// block resized is a custom event emitted by SizeSettings
	// so we know to updated the mask when width/height changes
	useEffect(() => {
		window.addEventListener("blockResized", repositionMask);
	}, []);

	// get the root, watch changes, and reposition the mask
	useLayoutEffect(() => {
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
	}, [designer.selected]);

	// add the mouse up listener when dragged
	useEffect(() => {
		if (!designer.drag.active || !local) {
			return;
		}

		document.addEventListener("mouseup", handleDocumentMouseUp);

		return () => {
			document.removeEventListener("mouseup", handleDocumentMouseUp);
		};
	}, [designer.drag.active, local, handleDocumentMouseUp]);

	if (!size) {
		return <div/>;
	}

	if (designer.selectedBlocks.length > 1) {
		return (
			<>
				{designer.selectedBlocks.map((id, index) => {
					const blockElement = getBlockElement(id);
					if (!blockElement) return null;

					const blockSize = getRelativeSize(blockElement, screenEle);

					return (
						<StyledContainer
							key={id}
							style={{
								top: `${blockSize.top}px`,
								left: `${blockSize.left}px`,
								height: `${blockSize.height}px`,
								width: `${blockSize.width}px`,
								opacity: designer.drag.active ? 0 : 1,
							}}
						>
							<StyledTitle onMouseDown={handleMouseDown}>
								<Stack direction={"row"}>
									<Typography variant={"body2"}>
										{variableName ? variableName : id}
									</Typography>
								</Stack>
								{areAllBlocksDraggable() && (
									<DragIndicator
										fontSize="inherit"
										sx={{ marginLeft: "2px" }}
									/>
								)}
							</StyledTitle>
						</StyledContainer>
					);
				})}
			</>
		);
	} else {
		return (
			<StyledContainer
				style={{
					top: `${size.top}px`,
					left: `${size.left}px`,
					height: `${size.height}px`,
					width: `${size.width}px`,
					opacity: designer.drag.active ? 0 : 1,
				}}
			>
				<StyledTitle onMouseDown={handleMouseDown}>
					<Stack direction={"row"}>
						<Typography variant={"body2"}>
							{variableName ? variableName : designer.selected}
						</Typography>
					</Stack>
					{isDraggable && (
						<DragIndicator
							fontSize="inherit"
							sx={{ marginLeft: "2px" }}
						/>
					)}
				</StyledTitle>
			</StyledContainer>
		);
	}
});
