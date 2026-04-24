import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Switch } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface SwitchBlockDef extends BlockDef<"switch"> {
	widget: "switch";
	data: {
		style: CSSProperties;
		label: string;
		value: boolean;
		disabled: boolean;
		color:
			| "primary"
			| "secondary"
			| "default"
			| "error"
			| "info"
			| "success"
			| "warning";
		size: "small" | "medium";
		helperText: string;
		required: boolean;
		labelPlacement: "start" | "end" | "top" | "bottom";
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

export const SwitchBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<SwitchBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (checked: boolean) => {
		setData("value", checked);
		listeners.onChange();
	};

	const showLabel = data.label && data.label.trim() !== "";
	const showHelperText = data.helperText && data.helperText.trim() !== "";
	const isLabelBefore =
		data.labelPlacement === "start" || data.labelPlacement === "top";
	const isColumn =
		data.labelPlacement === "top" || data.labelPlacement === "bottom";

	return (
		<div
			{...attrs}
			style={data.style}
			className="flex flex-col gap-0.5 p-0.5"
		>
			<div
				className={`flex items-center gap-2${isColumn ? "flex-col" : ""}`}
			>
				{showLabel && isLabelBefore && (
					<span className="font-medium text-sm">{data.label}</span>
				)}
				<Switch
					checked={data.value}
					onCheckedChange={handleChange}
					disabled={data.disabled}
					required={data.required}
				/>
				{showLabel && !isLabelBefore && (
					<span className="font-medium text-sm">{data.label}</span>
				)}
			</div>
			{showHelperText && (
				<span className="text-muted-foreground text-xs">
					{data.helperText}
				</span>
			)}
		</div>
	);
});
