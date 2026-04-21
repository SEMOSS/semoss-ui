import { GripVertical } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { toast } from "@semoss/ui/next";
import { useDesigner } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";
import { BlockSettingsRegistry } from "../blocks-workspace/blocks";

const containerStyle: React.CSSProperties = {
	position: "absolute",
	top: "0",
	right: "0",
	bottom: "0",
	left: "0",
	zIndex: 20,
	pointerEvents: "none",
	userSelect: "none",
	outlineWidth: "2px",
	outlineStyle: "solid",
	outlineColor: "var(--primary)",
};

const titleStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	position: "absolute",
	top: "-24px",
	left: "-1px",
	height: "24px",
	paddingLeft: "8px",
	paddingRight: "8px",
	pointerEvents: "auto",
	cursor: "grab",
	backgroundColor: "var(--primary)",
	color: "white",
	whiteSpace: "nowrap",
};

interface SelectedMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

export const SelectedMask = observer((props: SelectedMaskProps) => {
	const { screenEle } = props;

	const [size, setSize] = useState<{
		top: number;
		left: number;
		height: number;
		width: number;
	} | null>(null);
	const [local, setLocal] = useState(false);

	const { state } = useBlocks();
	const { designer } = useDesigner();

	const block = state.getBlock(designer.selected);
	const variableName = state.getAlias(designer.selected);

	const isDraggable =
		block && BlockSettingsRegistry[block.widget] && block.widget !== "page";

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

	const handleMouseDown = () => {
		if (designer.selectedBlocks.length > 1) {
			if (!areAllBlocksDraggable()) {
				return;
			}
			designer.activateDrag(
				designer.selectedBlocks
					.map((id) => state.getBlock(id).widget)
					.join(","),
				(parent) => {
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

			designer.setHovered("");
			setLocal(true);
		} else {
			if (!isDraggable) {
				return;
			}
			designer.activateDrag(
				block.widget,
				(parent) => {
					if (state.containsBlock(designer.selected, parent)) {
						return false;
					}
					return true;
				},
				block.id,
				BlockSettingsRegistry[block.widget].icon,
			);

			designer.setHovered("");
			setLocal(true);
		}
	};

	const handleDocumentMouseUp = useCallback(() => {
		if (!designer.drag.active) {
			return;
		}
		const placeholderAction = designer.drag.placeholderAction;

		if (placeholderAction) {
			if (designer.selectedBlocks.length > 1) {
				let lastSiblingId = placeholderAction.id;
				designer.selectedBlocks.forEach((id) => {
					const sw = state.getBlock(placeholderAction.id);

					if (
						placeholderAction.type === "before" ||
						placeholderAction.type === "after"
					) {
						const siblingWidget = state.getBlock(lastSiblingId);

						if (siblingWidget.parent) {
							const parent = state.getBlock(sw.parent.id);
							if (parent.widget === "iteration") {
								if (parent.slots.children.children.length) {
									toast.error(
										"Please delete block within iterator before adding another child",
									);
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
								toast.error(
									"Please delete block within iterator before adding another child",
								);
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

		designer.deactivateDrag();
		designer.setHovered("");
		setLocal(false);
	}, [
		designer.selected,
		designer.selectedBlocks,
		designer.drag.active,
		designer.drag.placeholderAction,
		state,
		designer,
	]);

	const repositionMask = () => {
		const selectedId = designer.selected || designer.selectedBlocks[0];
		if (!selectedId) {
			return;
		}

		const blockEle = getBlockElement(selectedId);
		if (!blockEle) {
			return;
		}

		const updated = getRelativeSize(blockEle, screenEle);
		setSize(updated);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only listener
	useEffect(() => {
		window.addEventListener("resize", repositionMask);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only listener
	useEffect(() => {
		window.addEventListener("blockResized", repositionMask);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: repositionMask is stable
	useLayoutEffect(() => {
		const observer = new MutationObserver(() => {
			repositionMask();
		});

		observer.observe(screenEle, {
			subtree: true,
			childList: true,
		});

		repositionMask();

		return () => observer.disconnect();
	}, [designer.selected]);

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
		return null;
	}

	const handleRename = (id: string): string => {
		const block = state.getBlock(id);
		if (block?.data?.id) {
			return block.data.id as string;
		}
		return id;
	};

	if (designer.selectedBlocks.length > 1) {
		return (
			<>
				{designer.selectedBlocks.map((id, _index) => {
					const blockElement = getBlockElement(id);
					if (!blockElement) return null;

					const blockSize = getRelativeSize(blockElement, screenEle);

					return (
						<div
							key={id}
							style={{
								...containerStyle,
								top: `${blockSize.top}px`,
								left: `${blockSize.left}px`,
								height: `${blockSize.height}px`,
								width: `${blockSize.width}px`,
								opacity: designer.drag.active ? 0 : 1,
							}}
						>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle — keyboard drag not applicable */}
							<div
								style={titleStyle}
								onMouseDown={handleMouseDown}
							>
								<span className="text-sm">
									{variableName
										? variableName
										: String(
												handleRename(designer.selected),
											)}
								</span>
								{areAllBlocksDraggable() && (
									<GripVertical className="ml-0.5 size-4" />
								)}
							</div>
						</div>
					);
				})}
			</>
		);
	} else {
		return (
			<div
				style={{
					...containerStyle,
					top: `${size.top}px`,
					left: `${size.left}px`,
					height: `${size.height}px`,
					width: `${size.width}px`,
					opacity: designer.drag.active ? 0 : 1,
				}}
			>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle — keyboard drag not applicable */}
				<div style={titleStyle} onMouseDown={handleMouseDown}>
					<span className="text-sm">
						{variableName
							? variableName
							: String(handleRename(designer.selected))}
					</span>
					{isDraggable && <GripVertical className="ml-0.5 size-4" />}
				</div>
			</div>
		);
	}
});
