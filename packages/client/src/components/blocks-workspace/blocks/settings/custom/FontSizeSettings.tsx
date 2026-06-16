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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * FontSizeSettings is its own component even though it is a simple select
 * Because we want to control both size and weight for certain typography types, ex headers
 */

interface FontSizeSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	sizePath: Paths<Block<D>["data"], 4>;
	weightPath: Paths<Block<D>["data"], 4>;
}

export const FontSizeSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		sizePath,
		weightPath,
	}: FontSizeSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);

		// track the value
		const [value, setValue] = useState("");

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "1rem";
				}

				const v = getValueByPath(data, sizePath);
				if (typeof v === "undefined") {
					return "1rem";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, sizePath]).get();

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
					setData(
						sizePath,
						value as PathValue<D["data"], typeof sizePath>,
					);
					if (["1rem", "1.125rem", "1.25rem"].includes(value)) {
						setData(
							weightPath,
							"inherit" as PathValue<
								D["data"],
								typeof weightPath
							>,
						);
					} else {
						setData(
							weightPath,
							"bold" as PathValue<D["data"], typeof weightPath>,
						);
					}
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label="Font Size">
				<Select
					value={value}
					onValueChange={(val) => {
						onChange(val);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={"1rem"}>Body</SelectItem>
						<SelectItem value={"1.125rem"}>
							<span style={{ fontSize: "1.125rem" }}>
								Subtitle 2
							</span>
						</SelectItem>
						<SelectItem value={"1.25rem"}>
							<span style={{ fontSize: "1.25rem" }}>
								Subtitle 1
							</span>
						</SelectItem>
						<SelectItem value={"1.5rem"}>
							<span
								style={{
									fontSize: "1.5rem",
									fontWeight: "bold",
								}}
							>
								Header 3
							</span>
						</SelectItem>
						<SelectItem value={"1.875rem"}>
							<span
								style={{
									fontSize: "1.875rem",
									fontWeight: "bold",
									padding: "2px 0",
								}}
							>
								Header 2
							</span>
						</SelectItem>
						<SelectItem value={"2.125rem"}>
							<span
								style={{
									fontSize: "2.125rem",
									fontWeight: "bold",
									padding: "2px 0",
								}}
							>
								Header 1
							</span>
						</SelectItem>
					</SelectContent>
				</Select>
			</BaseSettingSection>
		);
	},
);
