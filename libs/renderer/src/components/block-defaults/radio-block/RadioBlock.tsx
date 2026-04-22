import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@semoss/ui/next";
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (value: string) => {
		setData("value", value);
		listeners.onChange();
	};

	return (
		<div {...attrs} className="p-2">
			<fieldset disabled={data.disabled} className="w-full p-2">
				{data.label && (
					<legend className="mb-2 font-medium text-sm">
						{data.label}
						{data.required && (
							<span className="ml-0.5 text-destructive">*</span>
						)}
					</legend>
				)}
				<RadioGroup
					value={data.value}
					onValueChange={handleChange}
					disabled={data.disabled}
					className={
						data.direction === "row"
							? "flex flex-row gap-4"
							: "flex flex-col gap-2"
					}
				>
					{(data.options || []).map((option) => (
						<div
							key={option.value}
							className={`flex items-center gap-2${data.labelPlacement === "start" ? "flex-row-reverse" : ""}`}
						>
							<RadioGroupItem
								value={option.value}
								id={`radio-${id}-${option.value}`}
								style={data.style}
							/>
							<label
								htmlFor={`radio-${id}-${option.value}`}
								className="cursor-pointer text-sm"
							>
								{option.label}
							</label>
						</div>
					))}
				</RadioGroup>
			</fieldset>
		</div>
	);
});
