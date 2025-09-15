import { styled, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { CircularProgress, InputAdornment } from "@semoss/ui";
import { useBlock, useBlocks } from "../../../hooks";
import { ActionMessages } from "../../../store";
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
	const { state } = useBlocks();

		useEffect(() => {
			if (listeners.preProcess) {
				listeners.preProcess();
			}

			if (data && data.label && state) {
				const variableName = `${id}`;
				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: variableName,
						to: id,
						type: "block",
						cellId: undefined,
						value: String(data.value),
					},
				});
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
						{data?.loading ? <StyledLoading size={20} /> : <></>}
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
