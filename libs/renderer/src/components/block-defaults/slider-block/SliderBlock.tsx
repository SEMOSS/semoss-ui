import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import { Slider } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface SliderBlockDef extends BlockDef<"slider"> {
	widget: "slider";
	data: {
		type: "continuous" | "discrete";
		style: CSSProperties;
		value: number;
		steps: number;
		min: number;
		max: number;
		size: string;
		marks: Array<{ display: string; value: number }>;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const SliderBlock: BlockComponent = observer(({ id }) => {
	const { data, attrs, setData, listeners } = useBlock<SliderBlockDef>(id);
	const [showLabel, setShowLabel] = useState(false);
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	const min = Number(data.min);
	const max = Number(data.max);
	const val = Number(data.value) ?? 0;
	const percent = max > min ? ((val - min) / (max - min)) * 100 : 0;

	return (
		<div
			{...attrs}
			style={{
				display: "flex",
				alignItems: "center",
				width: data.size,
				...data.style,
			}}
		>
			<div
				style={{ position: "relative", width: "100%", paddingTop: "28px" }}
				onMouseEnter={() => setShowLabel(true)}
				onMouseLeave={() => { if (!dragging) setShowLabel(false); }}
			>
				{showLabel && (
					<div
						style={{
							position: "absolute",
							top: 0,
							left: `${percent}%`,
							transform: "translateX(-50%)",
							backgroundColor: "#1976d2",
							color: "#fff",
							fontSize: "11px",
							borderRadius: "4px",
							padding: "2px 6px",
							pointerEvents: "none",
							zIndex: 10,
							whiteSpace: "nowrap",
						}}
					>
						{val}
					</div>
				)}
				<style>{`
					#slider-wrapper-${id} [data-slot="slider-thumb"] {
						cursor: pointer !important;
					}
				`}</style>
				<div id={`slider-wrapper-${id}`}>
					<Slider
						value={[val]}
						min={min}
						max={max}
						step={Number(data.steps) > 0 ? Number(data.steps) : 1}
						onValueChange={(values) => {
							setData("value", values[0]);
							debouncedCallback();
						}}
						onPointerDown={() => { setDragging(true); setShowLabel(true); }}
						onPointerUp={() => { setDragging(false); }}
					/>
				</div>
			</div>
		</div>
	);
});
