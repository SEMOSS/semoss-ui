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

	const isLabelStart = data.labelPlacement === "start";

	return (
		<div
			{...attrs}
			style={{
				padding: "0.25rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.25rem",
				...data.style,
			}}
		>
			{showLabel && !data.labelPlacement && (
				<div className="text-sm font-medium">{data.label}</div>
			)}

			<div
				className={`flex items-center ${isLabelStart ? "flex-row-reverse" : ""}`}
				style={{ gap: showLabel && data.labelPlacement ? "0.5rem" : "0" }}
			>
				<Switch
					checked={data.value}
					onCheckedChange={handleChange}
					disabled={data.disabled}
					size={data.size === "small" ? "sm" : "default"}
				/>
				{showLabel && data.labelPlacement && (
					<label className="text-sm cursor-pointer">{data.label}</label>
				)}
			</div>

			{showHelperText && (
				<div className="text-xs text-muted-foreground">{data.helperText}</div>
				)}
		</div>
	);
});
