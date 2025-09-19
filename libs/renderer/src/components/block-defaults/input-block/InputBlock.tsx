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

	// Render date picker for date type (mm/dd/yyyy format)

	if (data.type === "date") {
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
				type="date"
				onChange={(e) => {
					const value = e.target.value;

					// update the value

					setData("value", value);

					debouncedCallback();
				}}
				{...attrs}
			/>
		);
	}

	// Render datetime picker for datetime type (YYYY-MM-DDTHH:mm:ss format)

	if (data.type === "datetime") {
		// Convert value for datetime-local input

		let displayValue =
			data.value !== null && data.value !== undefined ? data.value : "";

		if (
			displayValue &&
			typeof displayValue === "string" &&
			displayValue.includes("T")
		) {
			// Handle format like '2025-07-29T10:00:00' - remove timezone if present and ensure proper format

			displayValue = displayValue.replace(/Z?$/, "").substring(0, 16);
		}

		return (
			<StyledTextField
				size="small"
				value={displayValue}
				label={
					typeof data.label !== "string"
						? JSON.stringify(data.label)
						: data.label
				}
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
				type="datetime-local"
				onChange={(e) => {
					let value = e.target.value;

					// For datetime-local inputs, convert to format: YYYY-MM-DDTHH:mm:ss

					if (value) {
						// Convert to the required format: 2025-07-29T10:00:00

						if (value.length === 16) {
							// YYYY-MM-DDTHH:mm

							value = value + ":00"; // Add seconds without timezone
						}
					}

					// update the value

					setData("value", value);

					debouncedCallback();
				}}
				{...attrs}
			/>
		);
	}

	// Render regular text field for other types

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
