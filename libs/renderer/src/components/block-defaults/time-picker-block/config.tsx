import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { TimePickerBlock, type TimePickerBlockDef } from "./TimePickerBlock";

export const DefaultStyles: CSSProperties = {};

// Helper function to generate multi-select options for views
const getViewsOptions = () => {
	const views = [
		{ label: "Hours", value: "hours" },
		{ label: "Minutes", value: "minutes" },
		{ label: "Seconds", value: "seconds" },
	];

	return views;
};

// export the config for the block
export const config: BlockConfig<TimePickerBlockDef> = {
	widget: "timepicker",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: DefaultStyles,
		label: "Select Time",
		value: "",
		variant: "picker",
		ampm: true,
		format: "hh:mm a",
		disabled: false,
		required: false,
		fullWidth: true,
		placeholder: "",
		clearable: true,
		size: "small",
		views: ["hours", "minutes"],
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		onChange: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: TimePickerBlock,
};
