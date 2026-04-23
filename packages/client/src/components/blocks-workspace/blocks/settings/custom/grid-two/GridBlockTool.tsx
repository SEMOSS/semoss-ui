import { Image, Info } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { GridBlockDef, PathValue } from "@semoss/renderer";
import { Button, Checkbox } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { CellStyling } from "./operations/CellStyling";
import { ChartTitle } from "./operations/ChartTitle";
import { ColorByValue } from "./operations/ColorByValue";
import { GridResizeSettings } from "./operations/GridResizeSettings";
import { HeaderStyling } from "./operations/HeaderStyling";
import { RowSpanning } from "./operations/RowSpanning";
import { ColumnTextWrap } from "./operations/WrapTextSettings";

interface GridBlockToolProps {
	id: string;
}

export const GridBlockTool = observer<GridBlockToolProps>(({ id }) => {
	const { data, setData } = useBlockSettings<GridBlockDef>(id);
	const [selectedList, setSelectedList] = useState(""); // maintain the current selected list, for expansion and collapsing

	const resetToInitialState = () => {
		const defaultState = {
			width: "450px",
			height: "350px",
		};

		const newOption = {
			...data.style,
			...defaultState,
		};
		setData("style", newOption as PathValue<GridBlockDef["data"], "style">);
	};

	const toolSections = [
		{
			key: "generalchartsettings",
			label: "Header Styling",
			content: <HeaderStyling id={id} path={"option"} />,
			padded: true,
		},
		{
			key: "cellStylingSettings",
			label: "Cell Styling",
			content: <CellStyling id={id} path={"option"} />,
			padded: true,
		},
		{
			key: "titleSettings",
			label: "Title",
			content: <ChartTitle id={id} path={"option"} />,
			padded: true,
		},
		{
			key: "colorByValue",
			label: "Color By Value",
			content: <ColorByValue id={id} path={"option"} />,
			padded: false,
		},
		{
			key: "wrapText",
			label: "Wrap Text",
			content: <ColumnTextWrap id={id} path={"option"} />,
			padded: true,
		},
		{
			key: "rowSpanning",
			label: "Row Spanning",
			content: <RowSpanning id={id} path={"option"} />,
			padded: true,
		},
	];

	return (
		<div className="w-full">
			<div className="flex w-full flex-col">
				{toolSections.map(({ key, label, content, padded }) => (
					<div key={key}>
						<button
							type="button"
							className="flex w-full cursor-pointer items-center px-4 py-3 hover:bg-accent data-[selected=true]:bg-accent/50"
							data-selected={selectedList === key}
							onClick={() =>
								setSelectedList((prev) =>
									prev === key ? "" : key,
								)
							}
						>
							<Image className="mr-4 size-4 shrink-0" />
							<div className="flex items-center gap-2.5">
								<span className="text-sm">{label}</span>
								<Info className="size-4" />
							</div>
						</button>
						{selectedList === key && (
							<div
								className={
									padded
										? "block w-full px-4 py-2"
										: "block w-full px-0 py-2"
								}
							>
								{content}
							</div>
						)}
					</div>
				))}

				{/* Resizing */}
				<div>
					<button
						type="button"
						className="flex w-full cursor-pointer items-center px-4 py-3 hover:bg-accent data-[selected=true]:bg-accent/50"
						data-selected={selectedList === "resizing"}
						onClick={() =>
							setSelectedList((prev) =>
								prev === "resizing" ? "" : "resizing",
							)
						}
					>
						<Image className="mr-4 size-4 shrink-0" />
						<div className="flex items-center gap-2.5">
							<span className="text-sm">Resizing</span>
							<Info className="size-4" />
						</div>
					</button>
					{selectedList === "resizing" && (
						<div className="block w-full px-4 py-2">
							<div className="flex flex-col gap-1">
								<GridResizeSettings
									path={"style.height"}
									id={id}
									label={"Height"}
								/>
								<GridResizeSettings
									path={"style.width"}
									id={id}
									label={"Width"}
								/>
								<div className="flex justify-end">
									<Button
										size="sm"
										onClick={resetToInitialState}
									>
										Reset
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Export Settings */}
				<div>
					<button
						type="button"
						className="flex w-full cursor-pointer items-center px-4 py-3 hover:bg-accent data-[selected=true]:bg-accent/50"
						data-selected={selectedList === "export"}
						onClick={() =>
							setSelectedList((prev) =>
								prev === "export" ? "" : "export",
							)
						}
					>
						<Image className="mr-4 size-4 shrink-0" />
						<div className="flex items-center gap-2.5">
							<span className="text-sm">
								Export from Data Grid
							</span>
							<Info className="size-4" />
						</div>
					</button>
					{selectedList === "export" && (
						<div className="block w-full px-4 py-2">
							<div className="flex items-center gap-2 pl-3">
								{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
								<Checkbox
									id="enable-export"
									checked={data.option?.enableExport ?? false}
									onCheckedChange={(checked) => {
										const newOption = {
											...data.option,
											enableExport: !!checked,
										};
										setData(
											"option",
											newOption as PathValue<
												GridBlockDef["data"],
												"option"
											>,
										);
									}}
								/>
								<label
									htmlFor="enable-export"
									className="cursor-pointer text-sm"
								>
									Enable CSV Export
								</label>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});
