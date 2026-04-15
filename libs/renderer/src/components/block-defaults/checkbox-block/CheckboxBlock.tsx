import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Checkbox } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface CheckboxBlockDef extends BlockDef<"checkbox"> {
	widget: "checkbox";
	data: {
		type: string;
		style: CSSProperties;
		value: boolean;
		label: string;
		disabled: boolean;
		show: string;
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

export const CheckboxBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<CheckboxBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	return (
		<div {...attrs} style={{ padding: "0.25rem" }}>
			<div className="flex items-center gap-2">
				<Checkbox
					style={{ ...data.style }}
					disabled={data.disabled}
					checked={data.value}
					onCheckedChange={(checked) => {
						setData("value", !!checked);
						debouncedCallback();
					}}
				/>
				<div>{data.label}</div>
			</div>
		</div>
	);
});
