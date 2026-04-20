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

export const ToggleButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } =
		useBlock<ToggleButtonBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	if (data.multiple) {
		return (
			<div {...attrs} className="w-fit p-1">
				<ToggleGroup
					type="multiple"
					disabled={data.disabled}
					value={Array.isArray(data.value) ? data.value : []}
					onValueChange={(newValue: string[]) => {
						if (data.mandatory && !newValue.length) return;
						setData("value", newValue);
						debouncedCallback();
					}}
				>
					{data.options.map((option, index) => (
						<ToggleGroupItem
							// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available for toggle options
							key={`${id}-${index}`}
							value={option.value}
						>
							{option.display}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
		);
	}

	return (
		<div {...attrs} className="w-fit p-1">
			<ToggleGroup
				type="single"
				disabled={data.disabled}
				value={typeof data.value === "string" ? data.value : ""}
				onValueChange={(newValue: string) => {
					if (data.mandatory && !newValue) return;
					setData("value", newValue);
					debouncedCallback();
				}}
			>
				{data.options.map((option, index) => (
					<ToggleGroupItem
						// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available for toggle options
						key={`${id}-${index}`}
						value={option.value}
					>
						{option.display}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
});
