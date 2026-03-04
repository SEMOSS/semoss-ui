import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type BlockDef,
	EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	PathValue,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Button,
	Menu,
	Select,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

const StyledMainContainer = styled("div")<{
	display?: string;
	justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
	padding: "0.5rem",
}));

const StyledSubSection = styled("div")<{
	display?: string;
	justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "column",
	padding: "0.5rem",
	marginLeft: "2px",
}));

export const CustomizeDendrogramSymbol = observer(
	<D extends BlockDef = BlockDef>({ id }: { id: string }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [customizeSymbolUpdated, setCustomizeSymbolUpdated] =
			useState(false);
		const [customizeSymbol, setCustomizeSymbol] = useState({
			symbolShape: "circle",
			symbolSize: 12,
			symbolUrl: "",
		});
		const symbolData = [
			{
				label: "Circle",
				value: "circle",
			},
			{
				label: "Rectangle",
				value: "rect",
			},
			{
				label: "Round Rectagle",
				value: "roundRect",
			},
			{
				label: "Triangle",
				value: "triangle",
			},
			{
				label: "Arrow",
				value: "arrow",
			},
			{
				label: "Pin",
				value: "pin",
			},
			{
				label: "Diamond",
				value: "diamond",
			},
			{
				label: "None",
				value: "none",
			},
		];
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, "option");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, "option"]).get();

		function updateFields(fieldToUpdate, fieldUpdatedValue) {
			setCustomizeSymbolUpdated(false);
			setCustomizeSymbol({
				...customizeSymbol,
				[fieldToUpdate]: fieldUpdatedValue,
			});
		}

		useEffect(() => {
			const jsonData = JSON.parse(computedValue);
			const seriesIndex = jsonData["series"].findIndex((item) => {
				return item.type === "tree";
			});
			const customizeSymbolList = customizeSymbol;
			customizeSymbolList["symbolShape"] =
				jsonData["series"][seriesIndex]["symbol"];
			customizeSymbolList["symbolSize"] =
				jsonData["series"][seriesIndex]["symbolSize"];
			customizeSymbolList["symbolUrl"] =
				jsonData["series"][seriesIndex]["symbol"];
			setCustomizeSymbol((prevCustomizeList) => {
				return {
					...customizeSymbolList,
				};
			});
		}, []);

		useEffect(() => {
			const jsonData = JSON.parse(computedValue);
			const seriesIndex = jsonData["series"].findIndex((item) => {
				return item.type === "tree";
			});
			jsonData["series"][seriesIndex] = {
				...jsonData["series"][seriesIndex],
				["symbol"]: customizeSymbol.symbolShape,
				["symbolSize"]: customizeSymbol.symbolSize,
				["symbolUrl"]: customizeSymbol.symbolUrl,
			};
			runStateUpdateCustom(jsonData);
		}, [customizeSymbol]);

		function runStateUpdateCustom(option) {
			setTimeout(() => {
				try {
					setData("option", option);
				} catch (err) {
					console.log(err);
				}
			}, 300);
		}
		function resetToInitialState() {
			setCustomizeSymbol((prevCustomizeList) => {
				return {
					symbolShape: "circle",
					symbolSize: 12,
					symbolUrl: "",
				};
			});
			setCustomizeSymbolUpdated(false);
		}
		return (
			<StyledMainContainer>
				<StyledSubSection display="flex" justifyContent="space-around">
					<Typography variant="body2">Symbol Shape</Typography>
					<Select
						name="Symbol Shape"
						value={customizeSymbol.symbolShape}
						key={customizeSymbol.symbolShape}
						onChange={(e) => {
							updateFields("symbolShape", e.target.value);
						}}
						size="small"
					>
						{symbolData.length > 0 &&
							symbolData.map((item, index) => {
								return (
									<Menu.Item value={item.value} key={index}>
										{item.label}
									</Menu.Item>
								);
							})}
					</Select>
				</StyledSubSection>
				<StyledSubSection display="flex" justifyContent="space-around">
					<Typography variant="body2">Symbol Size</Typography>
					<TextField
						id="Symbol Size"
						size="small"
						type="number"
						value={customizeSymbol.symbolSize}
						onChange={(e) => {
							updateFields("symbolSize", e.target.value);
						}}
					/>
				</StyledSubSection>
				<StyledSubSection
					display="flex"
					justifyContent="end"
					style={{ flexDirection: "row" }}
				>
					<Button
						color="primary"
						variant="contained"
						onClick={resetToInitialState}
					>
						Reset
					</Button>
				</StyledSubSection>
			</StyledMainContainer>
		);
	},
);
