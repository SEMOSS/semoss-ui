import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import { Button, cn } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { formatToDataTestId } from "@/utility";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * Used when buttons are thematically be grouped together and point to the same
 * underlying style path, ex text align
 */

interface ButtonGroupSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label for setting
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Button options
	 */
	options: Array<{
		value: string;
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		icon: any;
		title: string;
		isDefault: boolean;
	}>;
}

export const ButtonGroupSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		options,
	}: ButtonGroupSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);

		// track the value
		const [value, setValue] = useState("");

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label}>
				<div className="flex">
					{Array.from(options, (option, i) => {
						const isActive =
							value === option.value ||
							(option.isDefault ? !value : false);
						return (
							<Button
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								key={i}
								variant="ghost"
								size="icon-sm"
								className={cn(isActive && "text-primary")}
								onClick={() => onChange(option.value)}
								title={option.title}
								data-testid={formatToDataTestId(
									`buttonGroupSettings-${label}-${option.value}-btn`,
								)}
							>
								<option.icon />
							</Button>
						);
					})}
				</div>
			</BaseSettingSection>
		);
	},
);
