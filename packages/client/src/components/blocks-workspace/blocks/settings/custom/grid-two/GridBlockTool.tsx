import { InfoOutlined } from "@mui/icons-material";
import ImageIcon from "@mui/icons-material/Image";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { GridBlockDef, PathValue } from "@semoss/renderer";
import {
	BoxTwo,
	Button,
	List,
	ListItemButtonTwo,
	ListItemIcon,
	ListItemText,
	ListItemTwo,
	Stack,
	styled,
} from "@semoss/ui";
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
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "generalchartsettings"
									? ""
									: "generalchartsettings",
							)
						}
						selected={selectedList === "generalchartsettings"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "generalchartsettings"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Header Styling" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
					{selectedList === "generalchartsettings" && (
						<StyledItem>
							<HeaderStyling id={id} path={"option"} />
						</StyledItem>
					)}
				</ListItemTwo>

				{/* Cell Styling section */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "cellStylingSettings"
									? ""
									: "cellStylingSettings",
							)
						}
						selected={selectedList === "cellStylingSettings"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "cellStylingSettings"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Cell Styling" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
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
				</ListItemTwo>

				{/* Title section  */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "titleSettings"
									? ""
									: "titleSettings",
							)
						}
						selected={selectedList === "titleSettings"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "titleSettings"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Title" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
					{selectedList === "titleSettings" && (
						<StyledItem>
							<ChartTitle id={id} path={"option"} />
						</StyledItem>
					)}
				</ListItemTwo>

				{/* Color By Value  */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "colorByValue"
									? ""
									: "colorByValue",
							)
						}
						selected={selectedList === "colorByValue"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "colorByValue"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Color By Value" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
					{selectedList === "colorByValue" && (
						<StyledItemWithoutPadding>
							<ColorByValue id={id} path={"option"} />
						</StyledItemWithoutPadding>
					)}
				</ListItemTwo>

				{/* Text Wrap  */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "wrapText" ? "" : "wrapText",
							)
						}
						selected={selectedList === "wrapText"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "wrapText"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Wrap Text" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
					{selectedList === "wrapText" && (
						<StyledItem>
							<ColumnTextWrap id={id} path={"option"} />
						</StyledItem>
					)}
				</ListItemTwo>

				{/* Row Spanning  */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "rowSpanning" ? "" : "rowSpanning",
							)
						}
						selected={selectedList === "rowSpanning"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "rowSpanning"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Row Spanning" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
					{selectedList === "rowSpanning" && (
						<StyledItem>
							{/* <ColumnTextWrap id={id} path={"option"} /> */}
							<RowSpanning id={id} path={"option"} />
						</StyledItem>
					)}
				</ListItemTwo>

				{/* Resizing  */}
				<ListItemTwo disablePadding style={{ display: "block" }}>
					<ListItemButtonTwo
						onClick={(e) =>
							setSelectedList((prevList) =>
								prevList === "resizing" ? "" : "resizing",
							)
						}
						selected={selectedList === "resizing"}
					>
						<ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "resizing"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<BoxTwo display="flex" alignItems="center" gap={1}>
							<ListItemText primary="Resizing" />
							<InfoOutlined color="disabled" />
						</BoxTwo>
					</ListItemButtonTwo>
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
				</ListItemTwo>
			</List>
		</>
	);
});
