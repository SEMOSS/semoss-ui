import { styled, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { CircularProgress, InputAdornment } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledTextField = styled(TextField)({
	"& .MuiFormLabel-root.MuiInputLabel-root": {
		top: "auto",
		left: "auto",
	},
});

const StyledLoading = styled(CircularProgress)(({ theme }) => ({
	color: theme.palette.divider,
}));
export interface InputBlockDef extends BlockDef<"input"> {
	widget: "input";
	data: {
		style: CSSProperties;
		label: string;
		value: string | number;
		type: string;
		rows: number;
		multiline: boolean;
		required: boolean;
		disabled: boolean;
		hint?: string;
		loading?: boolean;
		show: string;
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

export const InputBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<InputBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 500);

	return (
		<StyledTextField
			size="small"
			value={
				data.value !== null && data.value !== undefined
					? data.value
					: ""
			}
			label={
				typeof data.label !== "string"
					? JSON.stringify(data.label)
					: data.label
			}
			rows={data.rows}
			multiline={data.rows > 1 && data.type === "text"}
			required={Boolean(data.required)}
			disabled={Boolean(data?.disabled || data?.loading)}
			helperText={data?.hint}
			style={{
				...data.style,
			}}
			InputProps={{
				startAdornment: (
					<InputAdornment position="end">
						{data?.loading ? <StyledLoading size={20} /> : null}
					</InputAdornment>
				),
			}}
			type={data.type}
			onChange={(e) => {
				const value = e.target.value;
				// update the value
				setData("value", value);
				debouncedCallback();
			}}
			{...attrs}
		/>
	);
});
