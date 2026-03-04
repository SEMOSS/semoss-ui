import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	CellBackgroundSettings,
	GridBlockColumn,
	GridBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import {
	Autocomplete,
	Button,
	Checkbox,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettingsNew } from "../../../../settings/shared/ColorPickerSettingsNew";

export interface CellStylingProps<D extends BlockDef = GridBlockDef> {
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

export const CellStyling = observer(
	<D extends BlockDef = GridBlockDef>({ id, path }: CellStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const [gridStyle, setGridStyle] = useState<CellBackgroundSettings>({
			backgroundColor: "#ffffff",
			fontSize: "14",
			fontColor: "#000000",
			selectedColumn: [] as string[],
		});

		useEffect(() => {
			if (data.option?.cellBackgroundSettings) {
				setGridStyle(data.option.cellBackgroundSettings);
			}
		}, [data.option]);

		const handleColumnChange = (_, selected: GridBlockColumn[]) => {
			const newSelected = selected.map((col) => col.name);
			const newOption = {
				...data.option,
				cellBackgroundSettings: {
					...gridStyle,
					selectedColumn: newSelected,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				selectedColumns: newSelected,
			}));
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleColorChange = (newColor: string) => {
			const newOption = {
				...data.option,
				cellBackgroundSettings: {
					...gridStyle,
					backgroundColor: newColor,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				backgroundColor: newColor,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleFontColorChange = (newColor: string) => {
			const newOption = {
				...data.option,
				cellBackgroundSettings: {
					...gridStyle,
					fontColor: newColor,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				fontColor: newColor,
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
				cellBackgroundSettings: {
					...gridStyle,
					fontSize: newFontSize,
				},
			};
			setGridStyle((prev) => ({
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
				backgroundColor: "#ffffff",
				fontSize: "16",
				fontColor: "#000000",
				selectedColumn: [] as string[],
			};
			setGridStyle(defaultState);
			const newOption = {
				...data.option,
				cellBackgroundSettings: defaultState,
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
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Column
						</Typography>{" "}
					</label>
					<Autocomplete
						fullWidth
						multiple
						disableCloseOnSelect
						size="small"
						value={data.columns?.filter((c) =>
							gridStyle.selectedColumn.includes(c.name),
						)}
						onChange={handleColumnChange}
						options={data.columns || []}
						getOptionLabel={(option) =>
							typeof option === "object" && "name" in option
								? option.name
								: option
						}
						renderOption={renderOption}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Select column"
							/>
						)}
					/>
				</StyledFieldWrapper>
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
						value={gridStyle?.fontSize}
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
						path="option.cellBackgroundSettings.fontColor"
						colorValue={gridStyle.fontColor}
						onChange={handleFontColorChange}
					/>
				</StyledFieldWrapper>

				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Background Color
						</Typography>{" "}
					</label>
					<ColorPickerSettingsNew
						id={id}
						path="option.cellBackgroundSettings.backgroundColor"
						colorValue={gridStyle.backgroundColor}
						onChange={handleColorChange}
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
