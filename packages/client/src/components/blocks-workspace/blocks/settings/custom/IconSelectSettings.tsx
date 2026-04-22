import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { iconMap } from "../../constants";
import { BaseSettingSection } from "../BaseSettingSection";

interface IconSelectSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	label: string;
	options: Array<{ value: string; display: string }>;
	/** Whether we should dispatch an event to the designer to update the frame around the block */
	resizeOnSet?: boolean;
}

export const inputOptions = Object.keys(iconMap).map((key) => ({
	value: key,
	display: key,
}));

export const IconSelectSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		options,
		resizeOnSet = false,
	}: IconSelectSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		// track the value
		const [value, setValue] = useState("");

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
			// set the value
			setValue(value);

			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(path, value as PathValue<D["data"], typeof path>);
					if (resizeOnSet) {
						// emit event to resize the block on the screen
						state.dispatch({
							message: ActionMessages.DISPATCH_EVENT,
							payload: {
								name: "blockResized",
							},
						});
					}
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		const displayIcon = (key: string) => {
			const Icon = iconMap[key];
			return <Icon />;
		};

		return (
			<BaseSettingSection label={label}>
				<Select
					value={value}
					onValueChange={(val) => {
						onChange(val);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select icon" />
					</SelectTrigger>
					<SelectContent>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									{displayIcon(option.value)}
									{option.display}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</BaseSettingSection>
		);
	},
);
