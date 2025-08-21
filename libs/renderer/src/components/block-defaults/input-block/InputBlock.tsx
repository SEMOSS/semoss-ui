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
		dateFormat?: string;
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

    // Render date/datetime picker for date type
    if (data.type === 'date') {
        const dateFormat = data.dateFormat || 'mm//dd/yyyy';
        let inputType = 'date';
        
        // Determine input type based on format
        if (dateFormat === 'YYYY-MM-DDTHH:mm:ssZ' || dateFormat === 'YYYYMMDDTHHmmss[Z]') {
            inputType = 'datetime-local';
        }
        
        // Convert value for datetime-local input
        let displayValue = data.value !== null && data.value !== undefined ? data.value : "";
        if (inputType === 'datetime-local' && displayValue) {
            if (typeof displayValue === 'string' && displayValue.includes('T')) {
                // Check if it's YYYYMMDDTHHmmss format (compact format like 20240101T123000Z)
                if (displayValue.match(/^\d{8}T\d{6}/)) {
                    const year = displayValue.substring(0, 4);
                    const month = displayValue.substring(4, 6);
                    const day = displayValue.substring(6, 8);
                    const hour = displayValue.substring(9, 11);
                    const minute = displayValue.substring(11, 13);
                    displayValue = `${year}-${month}-${day}T${hour}:${minute}`;
                } else {
                    // Standard ISO format (2024-01-01T12:30:00Z)
                    displayValue = displayValue.replace(/:\d{2}(\.\d{3})?Z?$/, '').substring(0, 16);
                }
            }
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
                type={inputType}
                onChange={(e) => {
                    let value = e.target.value;
                    
                    // For datetime-local inputs, convert back to original format
                    if (inputType === 'datetime-local' && value) {
                        if (dateFormat === 'YYYY-MM-DDTHH:mm:ssZ') {
                            // Convert to ISO format
                            if (value.length === 16) { // YYYY-MM-DDTHH:mm
                                value = value + ':00Z'; // Add seconds and timezone
                            }
                        } else if (dateFormat === 'YYYYMMDDTHHmmss[Z]') {
                            // Convert to compact format
                            if (value.length === 16) { // YYYY-MM-DDTHH:mm
                                const parts = value.split('T');
                                const datePart = parts[0].replace(/-/g, ''); // Remove dashes: 20240101
                                const timePart = parts[1].replace(':', '') + '00'; // Remove colon, add seconds: 123000
                                value = `${datePart}T${timePart}Z`;
                            }
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
