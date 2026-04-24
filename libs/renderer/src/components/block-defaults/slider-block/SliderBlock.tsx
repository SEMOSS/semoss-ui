import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	return (
		<div
			{...attrs}
			className="flex items-center"
			style={{ width: data.size, color: data.style.color }}
		>
			<Slider
				style={data.style}
				value={[Number(data.value) ?? 0]}
				step={Number(data.steps) > 0 ? Number(data.steps) : 1}
				min={Number(data.min)}
				max={Number(data.max)}
				onValueChange={(v) => {
					setData("value", v[0]);
					debouncedCallback();
				}}
			/>
		</div>
	);
});
