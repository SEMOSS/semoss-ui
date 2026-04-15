import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Label, RadioGroup, RadioGroupItem } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface RadioBlockDef extends BlockDef<"radio"> {
	widget: "radio";
	data: {
		style: CSSProperties;
		value: string;
		label: string;
		options: Array<{ label: string; value: string }>;
		size: "small" | "medium";
		direction: "row" | "column";
		color:
			| "primary"
			| "secondary"
			| "error"
			| "info"
			| "success"
			| "warning"
			| "default";
		labelPlacement: "start" | "end" | "top" | "bottom";
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

export const RadioBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<RadioBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	// Handle radio button change
	const handleChange = (value: string) => {
		setData("value", value);
		listeners.onChange();
	};

	return (
		<div {...attrs} style={{ padding: "0.25rem", ...data.style }}>
			{data.label && <Label className="mb-4 text-base">{data.label}</Label>}
			<RadioGroup
				value={data.value}
				onValueChange={handleChange}
				disabled={data.disabled}
				className={data.direction === "row" ? "flex gap-4" : "grid gap-3"}
			>
				{(data.options || []).map((option) => (
					<div
						key={option.value}
						className={`flex items-center gap-2 ${
							data.labelPlacement === "start" ? "flex-row-reverse" : ""
						}`}
					>
						<RadioGroupItem value={option.value} id={option.value} className="size-5 [&_svg]:size-3" style={{ borderColor: "#2563eb", borderWidth: "2px" }} />
						<Label htmlFor={option.value} className="cursor-pointer text-sm">
							{option.label}
						</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	);
});
