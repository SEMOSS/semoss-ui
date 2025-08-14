import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	GridBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import { Switch, styled, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
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

export const RowSpanning = observer(
	<D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const [rowSpanning, setRowSpanning] = useState(false);

		useEffect(() => {
			if (data.option?.rowSpanning !== rowSpanning) {
				setRowSpanning(data.option.rowSpanning);
			}
		}, [data.option]);

		const handleInputChange = (checked: boolean) => {
			const newOption = {
				...data.option,
				rowSpanning: checked,
			};
			setRowSpanning(checked);

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		return (
			<StyledContainer>
				<StyledAxisDiv
					display="flex"
					gap="8px"
					style={{ marginTop: "8px" }}
				>
					<Switch
						size="small"
						checked={rowSpanning}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(e.target.checked)
						}
						title="Show Row Spanning"
					/>
					<Typography variant="body2" color="secondary">
						Show Row Spanning
					</Typography>
				</StyledAxisDiv>
			</StyledContainer>
		);
	},
);
