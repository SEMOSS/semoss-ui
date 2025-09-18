export interface ChipData {
	key: number;
	label: string;
}

export interface ChipsArrayHandle {
  getChips: () => ChipData[];
}

export interface ChipsArrayProps {
  chips: ChipData[];
  onDelete: (chip: ChipData) => void;
}

export interface FilterComponentProps {
	resetKey?: string;
	mode?: string;
	listOptions?: string[];
	checkedValues?: string[];
	onApply: (value: any, mode: string) => void;
	onReset?: () => void;
	showSearch?: boolean;
	multi?: boolean;
	filterLabel?: string;
	sliderSensitivity?: number;
	color?: "primary" | "secondary" | "success" | "warning" | "error";
	size?: "small" | "medium" | "large";
}