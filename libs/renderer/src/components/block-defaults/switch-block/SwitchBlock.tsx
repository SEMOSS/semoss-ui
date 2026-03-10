import {
	FormControlLabel,
	FormGroup,
	FormHelperText,
	Switch,
	styled,
	Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledContainer = styled("div")(({ theme }) => ({
	padding: theme.spacing(0.5),
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(0.5),
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
	fontSize: theme.typography.subtitle2.fontSize,
	fontWeight: theme.typography.subtitle2.fontWeight,
}));

export interface SwitchBlockDef extends BlockDef<"switch"> {
	widget: "switch";
	data: {
		style: CSSProperties;
		label: string;
		value: boolean;
		disabled: boolean;
		color:
			| "primary"
			| "secondary"
			| "default"
			| "error"
			| "info"
			| "success"
			| "warning";
		size: "small" | "medium";
		helperText: string;
		required: boolean;
		labelPlacement: "start" | "end" | "top" | "bottom";
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const SwitchBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<SwitchBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setData("value", event.target.checked);

		listeners.onChange();
	};

	const showLabel = data.label && data.label.trim() !== "";
	const showHelperText = data.helperText && data.helperText.trim() !== "";

	return (
		<StyledContainer {...attrs} style={data.style}>
			<FormGroup>
				{showLabel && !data.labelPlacement && (
					<StyledLabel>{data.label}</StyledLabel>
				)}

				{showLabel && data.labelPlacement ? (
					<FormControlLabel
						control={
							<Switch
								checked={data.value}
								onChange={handleChange}
								disabled={data.disabled}
								color={data.color}
								size={data.size}
								required={data.required}
							/>
						}
						label={data.label}
						labelPlacement={data.labelPlacement}
					/>
				) : (
					<Switch
						checked={data.value}
						onChange={handleChange}
						disabled={data.disabled}
						color={data.color}
						size={data.size}
						required={data.required}
					/>
				)}

				{showHelperText && (
					<FormHelperText>{data.helperText}</FormHelperText>
				)}
			</FormGroup>
		</StyledContainer>
	);
});
