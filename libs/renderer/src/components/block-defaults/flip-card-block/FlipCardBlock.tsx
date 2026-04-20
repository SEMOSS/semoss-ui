import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { Card, CardContent } from "@semoss/ui/next";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

const sharedFaceStyles: CSSProperties = {
	position: "absolute",
	width: "100%",
	height: "100%",
	backfaceVisibility: "hidden",
	WebkitBackfaceVisibility: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

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

export const FlipCardBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<FlipCardBlockDef>(id);
	const { state } = useBlocks();

	const isStatic = state.mode === "static";
	const { ...withoutDimensions } = data.style;

	const [flipped, setFlipped] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const containerStyle: CSSProperties = {
		...data.style,
		width: data.style.width || "300px",
		height: data.style.height || "200px",
		perspective: "1000px",
		border: "none",
	};

	const flipperStyle: CSSProperties = {
		width: "100%",
		height: "100%",
		position: "relative",
		transformStyle: "preserve-3d",
		transition: "transform 0.6s",
		transform: (isStatic ? data.isFlipped : flipped)
			? "rotateY(180deg)"
			: "rotateY(0deg)",
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: interactive div with click handler
		<div
			onMouseEnter={() => setFlipped(true)}
			onMouseLeave={() => setFlipped(false)}
			style={containerStyle}
			{...attrs}
		>
			<div style={flipperStyle}>
				<Card
					style={{
						...sharedFaceStyles,
						...withoutDimensions,
						backgroundColor: data.frontBgColor,
						zIndex: 2,
					}}
				>
					<CardContent className="h-full p-0">
						<Slot slot={slots.front}></Slot>
					</CardContent>
				</Card>
				<Card
					style={{
						...sharedFaceStyles,
						...withoutDimensions,
						backgroundColor: data.backBgColor,
						transform: "rotateY(180deg)",
					}}
				>
					<CardContent className="h-full p-0">
						<Slot slot={slots.back}></Slot>
					</CardContent>
				</Card>
			</div>
		</div>
	);
});
