import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	ChartTitleSettings,
	GridBlockColumn,
	GridBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import { Button, Checkbox, styled, TextField, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettingsNew } from "../../../../settings/shared/ColorPickerSettingsNew";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledFieldWrapper = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	gap: "8px",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
}));

const StyledAxisDiv = styled("div")<{
	display?: string;
	justifyContent?: string;
	gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
	padding: "8px 0",
	alignItems: "center",
	gap: gap ?? undefined,
}));

export const ChartTitle = observer(
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

		const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
		const checkedIcon = <CheckBoxIcon fontSize="small" />;
		const renderOption = (
			props: any,
			option: GridBlockColumn,
			{ selected }: any,
		) => {
			return (
				<li {...props}>
					<Checkbox checked={selected} />
					{option.name}
				</li>
			);
		};

		return (
			<StyledContainer>
				{/* Grid Title  */}
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Title
						</Typography>{" "}
					</label>
					<StyledTextField
						id="length"
						size="small"
						name="length"
						value={title?.chartTitle}
						onChange={handleTitleChange}
					/>
				</StyledFieldWrapper>

				{/* Font Size  */}
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Font Size
						</Typography>{" "}
					</label>
					<StyledTextField
						id="length"
						size="small"
						name="length"
						value={title?.fontSize}
						onChange={handleFontSizeChange}
					/>
				</StyledFieldWrapper>

				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Font Color
						</Typography>{" "}
					</label>
					<ColorPickerSettingsNew
						id={id}
						path="option.chartTitleSettings.fontColor"
						colorValue={title.fontColor}
						onChange={handleFontColorChange}
					/>
				</StyledFieldWrapper>

				<StyledAxisDiv display="flex" justifyContent="end">
					<Button
						size="small"
						color="primary"
						variant="contained"
						onClick={resetToInitialState}
					>
						Reset
					</Button>
				</StyledAxisDiv>
			</StyledContainer>
		);
	},
);
