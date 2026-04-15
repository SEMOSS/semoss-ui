import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface FlipCardBlockDef extends BlockDef<"flip-card"> {
	widget: "flip-card";
	data: {
		style: CSSProperties;
		isFlipped: boolean;
		frontBgColor: "#ffffff";
		backBgColor: "#ffffff";
		show: string;
	};
	slots: {
		front: true;
		back: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const sharedFaceStyles: CSSProperties = {
	position: "absolute",
	width: "100%",
	height: "100%",
	backfaceVisibility: "hidden",
	WebkitBackfaceVisibility: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

export const FlipCardBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<FlipCardBlockDef>(id);
	const { state } = useBlocks();

	const isStatic = state.mode === "static";
	const { ...withoutDimensions } = data.style;

	const [flipped, setFlipped] = useState(false);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const isFlipped = isStatic ? data.isFlipped : flipped;

	return (
		<div
			onMouseEnter={() => setFlipped(true)}
			onMouseLeave={() => setFlipped(false)}
			style={{
				...data.style,
				width: data.style.width || "300px",
				height: data.style.height || "200px",
				perspective: "1000px",
				border: "none",
			}}
			{...attrs}
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					position: "relative",
					transformStyle: "preserve-3d",
					transition: "transform 0.6s",
					transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
				}}
			>
				<div
					style={{
						...sharedFaceStyles,
						...withoutDimensions,
						backgroundColor: data.frontBgColor,
						zIndex: 2,
					}}
				>
					<Slot slot={slots.front}></Slot>
				</div>
				<div
					style={{
						...sharedFaceStyles,
						...withoutDimensions,
						backgroundColor: data.backBgColor,
						transform: "rotateY(180deg)",
					}}
				>
					<Slot slot={slots.back}></Slot>
				</div>
			</div>
		</div>
	);
});
