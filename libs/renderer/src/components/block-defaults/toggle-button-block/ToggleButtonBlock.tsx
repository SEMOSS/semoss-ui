import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ToggleButtonBlockDef extends BlockDef<"toggle-button"> {
	widget: "toggle-button";
	data: {
		disabled: boolean;
		color: "primary" | "secondary";
		size: "small" | "medium" | "large";
		options: Array<{ value: string; display: string }>;
		value: string | Array<string>;
		mandatory: boolean;
		multiple: boolean;
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

const mapSize = (size: "small" | "medium" | "large") => {
	const sizeMap = {
		small: "sm",
		medium: "default",
		large: "lg",
	};
	return sizeMap[size] || "default";
};

export const ToggleButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } =
		useBlock<ToggleButtonBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	const handleChange = (newValue: string | string[]) => {
		if (data.mandatory) {
			if (Array.isArray(newValue)) {
				if (newValue.length) {
					setData("value", newValue);
					debouncedCallback();
				}
			} else {
				if (newValue !== null) {
					setData("value", newValue);
					debouncedCallback();
				}
			}
		} else {
			setData("value", newValue);
			debouncedCallback();
		}
	};

	const items = Array.from(data.options, (option, index) => (
		<ToggleGroupItem
			key={`${id}-${index}`}
			value={option.value}
		>
			{option.display}
		</ToggleGroupItem>
	));

	return (
		<div {...attrs} className="w-fit p-1">
			{data.multiple ? (
				<ToggleGroup
					type="multiple"
					variant="outline"
					value={
						Array.isArray(data.value)
							? data.value
							: data.value
								? [data.value]
								: []
					}
					onValueChange={(newValue: string[]) => handleChange(newValue)}
					disabled={data.disabled}
					size={mapSize(data.size)}
				>
					{items}
				</ToggleGroup>
			) : (
				<ToggleGroup
					type="single"
					variant="outline"
					value={
						typeof data.value === "string"
							? data.value
							: ""
					}
					onValueChange={(newValue: string) => handleChange(newValue)}
					disabled={data.disabled}
					size={mapSize(data.size)}
				>
					{items}
				</ToggleGroup>
			)}
		</div>
	);
});
