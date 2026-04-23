import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	ChartTitleSettings,
	GridBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import { Button, Input } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { ColorPickerSettingsNew } from "../../../../settings/shared/ColorPickerSettingsNew";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const ChartTitle = observer(
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	<D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const [title, setTitle] = useState<ChartTitleSettings>({
			chartTitle: "",
			fontSize: "16",
			fontColor: "#000000",
		});

		useEffect(() => {
			if (data.option?.chartTitleSettings) {
				setTitle(data.option.chartTitleSettings);
			}
		}, [data.option]);

		const handleFontColorChange = (newColor: string) => {
			const newOption = {
				...data.option,
				chartTitleSettings: {
					...title,
					fontColor: newColor,
				},
			};
			setTitle((prev) => ({
				...prev,
				fontColor: newColor,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newFontSize = e.target.value;
			const newOption = {
				...data.option,
				chartTitleSettings: {
					...title,
					chartTitle: newFontSize,
				},
			};
			setTitle((prev) => ({
				...prev,
				chartTitle: newFontSize,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleFontSizeChange = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const newFontSize = e.target.value;
			const newOption = {
				...data.option,
				chartTitleSettings: {
					...title,
					fontSize: newFontSize,
				},
			};
			setTitle((prev) => ({
				...prev,
				fontSize: newFontSize,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const resetToInitialState = () => {
			const defaultState = {
				chartTitle: "",
				fontSize: "16",
				fontColor: "#000000",
			};
			setTitle(defaultState);
			const newOption = {
				...data.option,
				chartTitleSettings: defaultState,
			};
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		return (
			<div className="flex flex-col gap-2">
				{/* Grid Title */}
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">Title</p>
					</label>
					<Input
						value={title?.chartTitle}
						onChange={handleTitleChange}
					/>
				</div>

				{/* Font Size */}
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Font Size
						</p>
					</label>
					<Input
						value={title?.fontSize}
						onChange={handleFontSizeChange}
					/>
				</div>

				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Font Color
						</p>
					</label>
					<ColorPickerSettingsNew
						id={id}
						path="option.chartTitleSettings.fontColor"
						colorValue={title.fontColor}
						onChange={handleFontColorChange}
					/>
				</div>

				<div className="flex flex-row items-center justify-end py-2">
					<Button size="sm" onClick={resetToInitialState}>
						Reset
					</Button>
				</div>
			</div>
		);
	},
);
