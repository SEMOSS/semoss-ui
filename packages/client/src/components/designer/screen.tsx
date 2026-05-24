import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { useDesigner } from "@/hooks";
import {
	getNearestBlock,
	getNearestBlockElement,
	getNearestSlot,
	getNearestSlotElement,
	getRelativeSize,
} from "@/stores";
import { BlockSettingsMask } from "./BlockSettingsMask";
import { DeleteDuplicateMask } from "./DeleteDuplicateMask";
import { FormMenuHost } from "./FormMenuHost";
import { Ghost } from "./Ghost";
import { HoveredMask } from "./HoveredMask";
import { Placeholder } from "./Placeholder";
// TODO: FIX
import { SelectedMask } from "./SelectedMask";

interface ScreenProps {
	/** Children to render */
	children: React.ReactNode;
}

export const Screen = observer((props: ScreenProps) => {
	const { children } = props;

	const eleRef = useRef<HTMLDivElement | null>(null);

	const { state } = useBlocks();
	const { designer } = useDesigner();

	const handleClickCapture = (event: React.MouseEvent) => {
		if (!designer.hovered || designer.hovered === designer.selected) {
			return;
		}

		event.stopPropagation();
		event.preventDefault();

		designer.setSelected(designer.hovered);
	};

	const handleMultipleSelection = (event) => {
		if (!designer.hovered || designer.hovered === designer.selected) {
			return;
		}
		const id = getNearestBlock(event.target as Element);

		event.stopPropagation();
		event.preventDefault();
		if (designer.selectedBlocks.includes(id)) {
			return;
		}

		designer.setSelected(id);
		designer.addBlockToSelected(id);
		if (designer.selectedBlocks.length > 1) {
			designer.setSelected("");
		}
	};

	const handleMouseOver = (event: React.MouseEvent) => {
		const id = getNearestBlock(event.target as Element);

		if (!id || id === designer.hovered) {
			return;
		}

		designer.setHovered(id);
	};

	const handleMouseLeave = () => {
		designer.setHovered("");

		if (designer.drag.active) {
			designer.resetPlaceholder();
			designer.updateGhostPosition(null);
		}
	};

	const handleDocumentMouseMove = useCallback(
		(event: MouseEvent) => {
			if (!designer.drag.active) {
				return;
			}

			if (!eleRef.current) {
				return;
			}

			event.preventDefault();

			designer.updateGhostPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const nearestElement = getNearestBlockElement(
				event.target as Element,
			);

			if (!nearestElement) {
				return;
			}

			const id = getNearestBlock(nearestElement) as string;

			designer.setHovered(id);

			const slotElement = getNearestSlotElement(event.target as Element);
			if (slotElement) {
				const slot = getNearestSlot(slotElement) as string;

				if (!designer.drag.canDrop(id, slot)) {
					return;
				}

				designer.updatePlaceholder(
					{
						type: "replace",
						id: id,
						slot: slot,
					},
					getRelativeSize(slotElement, eleRef.current),
				);

				return;
			}

			const block = state.getBlock(id);

			if (!block.parent) {
				return;
			}

			if (!designer.drag.canDrop(block.parent.id, block.parent.slot)) {
				return;
			}

			const widgetClientRect = nearestElement.getBoundingClientRect();
			const percent = Math.round(
				((event.clientY - widgetClientRect.y) /
					widgetClientRect.height) *
					100,
			);

			if (percent <= 30) {
				designer.updatePlaceholder(
					{
						type: "before",
						id: id,
					},
					getRelativeSize(nearestElement, eleRef.current),
				);
			} else if (percent >= 70) {
				designer.updatePlaceholder(
					{
						type: "after",
						id: id,
					},
					getRelativeSize(nearestElement, eleRef.current),
				);
			}
		},
		[designer.drag.active, designer.drag.canDrop, designer, state],
	);

	useEffect(() => {
		if (!designer.drag.active) {
			return;
		}

		document.addEventListener("mousemove", handleDocumentMouseMove);

		return () => {
			document.removeEventListener("mousemove", handleDocumentMouseMove);
		};
	}, [designer.drag.active, handleDocumentMouseMove]);

	const isHoveredOverSelectedBlock = useMemo(() => {
		return designer.hovered === designer.selected;
	}, [designer.hovered, designer.selected]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				(event.key === "x" || event.key === "X")
			) {
				if (designer.selected) {
					if (designer.selected.includes("page")) {
						return;
					}
					state.dispatch({
						message: ActionMessages.REMOVE_BLOCK,
						payload: {
							id: designer.selected,
							keep: false,
						},
					});
					designer.setSelected("");
				} else if (designer.selectedBlocks.length > 0) {
					designer.selectedBlocks.forEach((id: string) => {
						if (!id.includes("page")) {
							state.dispatch({
								message: ActionMessages.REMOVE_BLOCK,
								payload: {
									id: id,
									keep: false,
								},
							});
						}
					});
					designer.addBlockToSelected("clear");
				}
				event.preventDefault();
				event.stopPropagation();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [designer]);

	return (
		<div
			ref={eleRef}
			className="relative flex h-full flex-grow overflow-auto"
			style={{ padding: "20px 16px" }}
		>
			{eleRef.current ? (
				<>
					{(designer.selected ||
						designer.selectedBlocks.length > 1) && (
						<SelectedMask screenEle={eleRef.current} />
					)}
					{designer.hovered && (
						<HoveredMask screenEle={eleRef.current} />
					)}
					{designer.selected && !designer.drag.active && (
						<DeleteDuplicateMask screenEle={eleRef.current} />
					)}
					{designer.selected && !designer.drag.active && (
						<BlockSettingsMask screenEle={eleRef.current} />
					)}
				</>
			) : null}

			{designer.drag.active && <Placeholder />}
			{designer.drag.active && <Ghost />}
			{<FormMenuHost />}

			<div
				className="flex min-w-0 flex-grow flex-col items-center"
				style={{ userSelect: designer.drag.active ? "none" : "auto" }}
			>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: designer canvas */}
				<div
					className="flex h-inherit w-full min-w-0 flex-1 overflow-x-hidden p-2"
					onMouseLeave={handleMouseLeave}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: designer canvas */}
					{/* biome-ignore lint/a11y/useKeyWithMouseEvents: designer canvas */}
					<div
						className="relative h-inherit w-full min-w-0 flex-1"
						style={{
							cursor: !isHoveredOverSelectedBlock
								? "pointer"
								: "inherit",
						}}
						onMouseOver={handleMouseOver}
						onClickCapture={(e) => {
							if (e.ctrlKey || e.metaKey || e.shiftKey) {
								e.stopPropagation();
								e.preventDefault();
								handleMultipleSelection(e);
							} else {
								designer.addBlockToSelected("clear");
								handleClickCapture(e);
							}
						}}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
});
