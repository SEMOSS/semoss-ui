import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { ColorPickerSettings } from "../../../shared/ColorPickerSettings";
import {
	FontFamily,
	FontWeights,
	Title_Alignment,
} from "../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const TitleTool = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		// biome-ignore lint/style/useConst: reassigned
		let [value, setValue] = useState("");
		const [showTitle, setShowTitle] = useState(true);
		const [title, setTitle] = useState({
			name: "",
			alignment: "center",
			size: 8,
			weight: "normal",
			family: "",
			color: "#000000",
		});
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) return "";
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") return "";
				else if (typeof v === "string") return v;
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue, data]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				reInitializeFeatures(data.option);
			}
		}, [id]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				retainLocalState(data.option);
			}
		}, [showTitle]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const retainLocalState = (options: any) => {
			setTitle({
				name: options.title.text,
				alignment: options.title.left,
				size: options.title.textStyle.fontSize,
				weight: options.title.textStyle.fontWeight,
				family: options.title.textStyle.fontFamily,
				color: options.title.textStyle.color,
			});
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reInitializeFeatures = (options: any) => {
			setShowTitle(options.title.show ?? true);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function handleInputChange(titleKey: string, inputValue: any) {
			const option = JSON.parse(value);
			if (titleKey === "showTitle") {
				option.title.show = inputValue;
				setShowTitle(inputValue);
			} else if (titleKey === "titleName") {
				option.title.text = inputValue;
				setTitle((prev) => ({ ...prev, name: inputValue }));
			} else if (titleKey === "titleAlignment") {
				option.title.left = inputValue;
				setTitle((prev) => ({ ...prev, alignment: inputValue }));
			} else if (titleKey === "titleSize") {
				option.title.textStyle.fontSize = inputValue;
				setTitle((prev) => ({ ...prev, size: inputValue }));
			} else if (titleKey === "titleWeight") {
				option.title.textStyle.fontWeight = inputValue;
				setTitle((prev) => ({ ...prev, weight: inputValue }));
			} else if (titleKey === "titleFamily") {
				option.title.textStyle.fontFamily = inputValue;
				setTitle((prev) => ({ ...prev, family: inputValue }));
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		function handleReset() {
			const option = JSON.parse(value);
			option.title.show = option.reset.title.show;
			option.title.text = option.reset.title.text;
			option.title.left = option.reset.title.left;
			option.title.textStyle.fontSize =
				option.reset.title.textStyle.fontSize;
			option.title.textStyle.fontWeight =
				option.reset.title.textStyle.fontWeight;
			option.title.textStyle.fontFamily =
				option.reset.title.textStyle.fontFamily;
			option.title.textStyle.color = option.reset.title.textStyle.color;
			setData(path, option as PathValue<D["data"], typeof path>);
			retainLocalState(option);
		}

		return (
			<div className="flex flex-col">
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!showTitle}
						onCheckedChange={(checked: boolean) =>
							handleInputChange("showTitle", checked)
						}
					/>
					<span className="text-sm">Show Title</span>
				</div>
				{showTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Title Name
						</span>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="name"
							name="name"
							value={title?.name}
							onChange={(e) =>
								handleInputChange("titleName", e.target.value)
							}
						/>
					</div>
				)}
				{showTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Select Alignment
						</span>
						<Select
							value={title?.alignment}
							onValueChange={(val) =>
								handleInputChange("titleAlignment", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{Title_Alignment.map((label, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={label}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{showTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Text Size
						</span>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="size"
							name="size"
							value={title?.size}
							onChange={(e) =>
								handleInputChange("titleSize", e.target.value)
							}
						/>
					</div>
				)}
				{showTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Select Font Weight
						</span>
						<Select
							value={title?.weight}
							onValueChange={(val) =>
								handleInputChange("titleWeight", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{FontWeights.map((label, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={label}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{showTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Select Font Family
						</span>
						<Select
							value={title?.family}
							onValueChange={(val) =>
								handleInputChange("titleFamily", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{FontFamily.map((label, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={label}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{showTitle && (
					<ColorPickerSettings
						id={id}
						path="option.title.textStyle.color"
						colorValue={title.color}
						onChange={(e) => handleInputChange("titleColor", e)}
					/>
				)}
				{showTitle && (
					<div className="flex justify-end px-4 py-2">
						<Button onClick={handleReset}>Reset</Button>
					</div>
				)}
			</div>
		);
	},
);
