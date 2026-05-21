import { observer } from "mobx-react-lite";
import { useLayoutEffect, useState } from "react";
import { useBlocks } from "@semoss/renderer";
import { useDesigner } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";
import { TextSettingsMask } from "./settings-mask/TextSettingsMask";

const STYLED_FONT_STYLE_INPUT_WIDTH = 232;
const STYLED_FONT_SIZE_INPUT_WIDTH = 168;

interface FontStyleSizeMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

export const BlockSettingsMask = observer((props: FontStyleSizeMaskProps) => {
	const { screenEle } = props;

	const [size, setSize] = useState<{
		top: number;
		left: number;
		height: number;
		width: number;
	} | null>(null);

	const { registry, state } = useBlocks();
	const { designer } = useDesigner();

	const block = state.getBlock(designer.selected);

	const isVisible =
		block && registry[block.widget] && block.widget !== "page";

	// biome-ignore lint/correctness/useExhaustiveDependencies: repositionMask depends on screenEle and designer.selected
	useLayoutEffect(() => {
		if (!isVisible || block.widget !== "text") {
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
	}, [designer.selected, isVisible]);

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
				STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH;
		const hasRightOverflow =
			screenElementSize.right === selectedElementSize.right &&
			selectedElementSize.width <
				STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH;

		const leftValue = size.left - 12;
		let left: string;
		if (hasRightOverflow) {
			left = `${
				leftValue -
				(
					STYLED_FONT_STYLE_INPUT_WIDTH +
						STYLED_FONT_SIZE_INPUT_WIDTH -
						selectedElementSize.width
				) +
				8
			}px`;
		} else if (hasLeftOverflow) {
			left = `${size.left - 8}px`;
		} else {
			left = `${leftValue}px`;
		}

		const top = size.top + size.height;

		return { top, left };
	};

	if (block.widget !== "text") {
		return null;
	}

	return (
		// biome-ignore lint/correctness/useUniqueElementIds: component-scoped anchor id
		<div
			id="delete-duplicate-mask"
			style={{
				position: "absolute",
				padding: "8px 0 0 16px",
				top: "0",
				right: "0",
				bottom: "0",
				left: "0",
				zIndex: 30,
				height: "fit-content",
				maxWidth: `${STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH}px`,
				minWidth: "fit-content",
				...getStyle(),
			}}
		>
			<TextSettingsMask />
		</div>
	);
});
