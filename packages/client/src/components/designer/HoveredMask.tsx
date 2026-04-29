import { observer } from "mobx-react-lite";
import { useLayoutEffect, useState } from "react";
import { useBlocks } from "@semoss/renderer";
import { useDesigner } from "@/hooks";
import { getBlockElement, getRelativeSize } from "@/stores";

interface HoveredMaskProps {
	/** Element to bind the mask to */
	screenEle: HTMLDivElement;
}

export const HoveredMask = observer((props: HoveredMaskProps) => {
	const { screenEle } = props;

	const [size, setSize] = useState<{
		top: number;
		left: number;
		height: number;
		width: number;
	} | null>(null);

	const { designer } = useDesigner();
	const { state } = useBlocks();
	const variableName = state.getAlias(designer.hovered);

	// biome-ignore lint/correctness/useExhaustiveDependencies: repositionMask depends on screenEle and designer.hovered
	useLayoutEffect(() => {
		const repositionMask = () => {
			const blockEle = getBlockElement(designer.hovered);
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
	}, [designer.hovered]);

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

	const hideHoveredMask =
		designer.hovered === designer.selected || designer.drag.active;

	return (
		<div
			style={{
				position: "absolute",
				top: `${size.top}px`,
				left: `${size.left}px`,
				height: `${size.height}px`,
				width: `${size.width}px`,
				zIndex: 20,
				opacity: hideHoveredMask ? 0 : 1,
				pointerEvents: "none",
				outlineWidth: "3px",
				outlineStyle: "dotted",
				outlineColor: "var(--primary)",
			}}
		>
			<div
				style={{
					display: "inline-flex",
					alignItems: "center",
					position: "absolute",
					top: "-24px",
					left: "-1px",
					height: "24px",
					paddingLeft: "8px",
					paddingRight: "8px",
					borderRadius: "4px",
					backgroundColor: "var(--primary)",
					color: "white",
					whiteSpace: "nowrap",
				}}
			>
				<span className="text-sm">
					{variableName
						? variableName
						: handleRename(designer.hovered)}
				</span>
			</div>
		</div>
	);
});
