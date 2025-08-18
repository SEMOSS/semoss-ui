import { InfoOutlined } from "@mui/icons-material";
import ImageIcon from "@mui/icons-material/Image";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { GridBlockDef, PathValue } from "@semoss/renderer";
import { Box, Button, List, Stack, styled } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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

const StyledItem = styled("div")(() => ({
	display: "block",
	width: "100%",
	padding: "0.5rem 1rem",
}));

const StyledItemWithoutPadding = styled("div")(() => ({
	display: "block",
	width: "100%",
	padding: "0.5rem 0",
}));

const StyledBox = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	gap: "10px",
}));

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

	return (
		<>
			<List style={{ width: "100%" }}>
				{/* Header Styling Section  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "generalchartsettings"
									? ""
									: "generalchartsettings",
							)
						}
						selected={selectedList === "generalchartsettings"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "generalchartsettings"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Header Styling" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "generalchartsettings" && (
						<StyledItem>
							<HeaderStyling id={id} path={"option"} />
						</StyledItem>
					)}
				</List.Item>

				{/* Cell Styling section */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "cellStylingSettings"
									? ""
									: "cellStylingSettings",
							)
						}
						selected={selectedList === "cellStylingSettings"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "cellStylingSettings"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Cell Styling" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "cellStylingSettings" && (
						<StyledItem>
							{/* <SelectInputSettings
                                id={id}
                                path={"show"}
                                label={"Show Block"}
                                options={[]}
                            />
                            <p>Some contents will show here</p> */}
							<CellStyling id={id} path={"option"} />
						</StyledItem>
					)}
				</List.Item>

				{/* Title section  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "titleSettings"
									? ""
									: "titleSettings",
							)
						}
						selected={selectedList === "titleSettings"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "titleSettings"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Title" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "titleSettings" && (
						<StyledItem>
							<ChartTitle id={id} path={"option"} />
						</StyledItem>
					)}
				</List.Item>

				{/* Color By Value  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "colorByValue"
									? ""
									: "colorByValue",
							)
						}
						selected={selectedList === "colorByValue"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "colorByValue"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Color By Value" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "colorByValue" && (
						<StyledItemWithoutPadding>
							<ColorByValue id={id} path={"option"} />
						</StyledItemWithoutPadding>
					)}
				</List.Item>

				{/* Text Wrap  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "wrapText" ? "" : "wrapText",
							)
						}
						selected={selectedList === "wrapText"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "wrapText"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Wrap Text" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "wrapText" && (
						<StyledItem>
							<ColumnTextWrap id={id} path={"option"} />
						</StyledItem>
					)}
				</List.Item>

				{/* Row Spanning  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "rowSpanning" ? "" : "rowSpanning",
							)
						}
						selected={selectedList === "rowSpanning"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "rowSpanning"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Row Spanning" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "rowSpanning" && (
						<StyledItem>
							{/* <ColumnTextWrap id={id} path={"option"} /> */}
							<RowSpanning id={id} path={"option"} />
						</StyledItem>
					)}
				</List.Item>

				{/* Resizing  */}
				<List.Item disablePadding style={{ display: "block" }}>
					<List.ItemButton
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "resizing" ? "" : "resizing",
							)
						}
						selected={selectedList === "resizing"}
					>
						<List.Icon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "resizing"
										? "primary"
										: "disabled"
								}
							/>
						</List.Icon>
						<StyledBox>
							<List.ItemText primary="Resizing" />
							<InfoOutlined color="disabled" />
						</StyledBox>
					</List.ItemButton>
					{selectedList === "resizing" && (
						<StyledItem>
							<Stack
								display="flex"
								flexDirection="column"
								gap={1}
							>
								<GridResizeSettings
									path={"style.height"}
									id={id}
									label={"Height"}
								></GridResizeSettings>
								<GridResizeSettings
									path={"style.width"}
									id={id}
									label={"Width"}
								></GridResizeSettings>
								<Stack display="flex" alignItems="end">
									<Button
										size="small"
										color="primary"
										variant="contained"
										onClick={resetToInitialState}
									>
										Reset
									</Button>
								</Stack>
							</Stack>
						</StyledItem>
					)}
				</List.Item>
			</List>
		</>
	);
});
