import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Checkbox } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface CheckboxBlockDef extends BlockDef<"checkbox"> {
	widget: "checkbox";
	data: {
		style: CSSProperties;
		value: boolean;
		label: string;
		required: boolean;
		disabled: boolean;
		show: string;
	};
	listeners: {
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const CheckboxBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<CheckboxBlockDef>(id);

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
		<div {...attrs} className="p-0.5">
			<div className="flex items-center gap-2">
				<Checkbox
					style={data.style}
					disabled={data.disabled}
					checked={data.value}
					onCheckedChange={(checked) => {
						setData("value", Boolean(checked));
						debouncedCallback();
					}}
				/>
				{data.label && <span className="text-sm">{data.label}</span>}
			</div>
		</div>
	);
});
