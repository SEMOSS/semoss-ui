import { Smile } from "lucide-react";
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
	Badge,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";
import { IconSelectSettings, inputOptions } from "./IconSelectSettings";

interface ChipSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	label: string;
	options?: Array<{ value: string; display: string }>;
	resizeOnSet?: boolean;
}

export const ChipSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		options,
		resizeOnSet = false,
	}: ChipSettingsProps<D>) => {
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

		const [ChipValue, setChipValue] = useState("");
		const [selectedChipType, setSelectedChipType] = useState("");

		const handleChipChange = (
			chip: string,
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			setChipValue(e.target.value);
			setData(chip.toLowerCase(), e.target.value);
		};

		return (
			<div className="w-full">
				<BaseSettingSection label={label}>
					<div className="flex w-full flex-col">
						<Select
							value={value}
							onValueChange={(newValue) => {
								onChange(newValue);
								setSelectedChipType(newValue);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{(options ?? []).map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										<div className="flex items-center gap-2">
											{option.value === "Chip" && (
												<Badge>{option.value}</Badge>
											)}
											{option.value === "Icon" && (
												<Badge>
													<Smile className="mr-1 size-3" />
													{option.value}
												</Badge>
											)}
											{option.value === "Avatar" && (
												<Badge>{option.value}</Badge>
											)}
											{option.value === "Link" && (
												<Badge>{option.value}</Badge>
											)}
											{![
												"Chip",
												"Icon",
												"Avatar",
												"Link",
											].includes(option.value) && (
												<Badge>{option.value}</Badge>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedChipType &&
							(selectedChipType === "Avatar" ||
								selectedChipType === "Link") && (
								<Input
									value={ChipValue}
									onChange={(e) =>
										handleChipChange(selectedChipType, e)
									}
									autoComplete="off"
									placeholder={`${selectedChipType} value`}
									className="mt-1 w-full"
								/>
							)}
						{selectedChipType && selectedChipType === "Icon" && (
							<div>
								<IconSelectSettings
									id={id}
									label="Icon"
									path="icon"
									options={inputOptions}
								/>
							</div>
						)}
					</div>
				</BaseSettingSection>
			</div>
		);
	},
);
