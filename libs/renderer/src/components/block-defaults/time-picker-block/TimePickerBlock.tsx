import dayjs from "dayjs";
import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Button, cn, Input } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface TimePickerBlockDef extends BlockDef<"timepicker"> {
	widget: "timepicker";
	data: {
		style: CSSProperties;
		label: string;
		value: string; // ISO string
		variant: "field" | "picker" | "digital";
		ampm: boolean;
		format: string;
		disabled: boolean;
		required: boolean;
		fullWidth: boolean;
		placeholder: string;
		clearable: boolean;
		size: "small" | "medium";
		views: ("hours" | "minutes" | "seconds")[];
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

export const TimePickerBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } =
		useBlock<TimePickerBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (timeStr: string) => {
		setData("value", timeStr ? dayjs(timeStr, "HH:mm").toISOString() : "");
		listeners.onChange();
	};

	const inputValue = data.value ? dayjs(data.value).format("HH:mm") : "";

	return (
		<div
			{...attrs}
			style={data.style}
			className={cn("flex flex-col gap-1 p-0.5")}
		>
			{data.label && (
				<p className="font-semibold text-sm">{data.label}</p>
			)}
			<div
				className={cn(
					"flex items-center gap-1",
					data.fullWidth && "w-full",
				)}
			>
				<Input
					type="time"
					value={inputValue}
					onChange={(e) => handleChange(e.target.value)}
					disabled={data.disabled}
					required={data.required}
					placeholder={data.placeholder}
					className={cn(data.fullWidth && "w-full")}
				/>
				{data.clearable && inputValue && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => handleChange("")}
					>
						<X className="size-3" />
					</Button>
				)}
			</div>
		</div>
	);
});
