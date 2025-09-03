import {
	Autocomplete,
	Stack,
	styled,
	TextField,
	Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import { CircularProgress, InputAdornment } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledLoading = styled(CircularProgress)(({ theme }) => ({
	color: theme.palette.divider,
}));

export interface SelectBlockDef extends BlockDef<"select"> {
	widget: "select";
	data: {
		multiple: boolean;
		style: CSSProperties;
		label: string;
		value: string | string[];
		required: boolean;
		disabled: boolean;
		options: string[];
		optionLabel?: string;
		optionSublabel?: string;
		optionValue?: string;
		hint?: string;
		loading?: boolean;
		show: boolean;
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
		onOpen: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<SelectBlockDef>(id);
	const [dropdownLoading, setDropdownLoading] = useState(false);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const stringifiedOptions: string[] = useMemo(() => {
		let arr = [];
		if (!data.options) {
			// NOOP
			return [];
		} else if (!Array.isArray(data?.options)) {
			if (typeof data.options === "string") {
				let opts: string = (data.options as string).trim();
				// If Python-style array, convert to valid JSON
				if (opts.startsWith("[") && opts.endsWith("]")) {
					// Replace single quotes with double quotes
					opts = opts.replace(/'/g, '"');
					// Remove spaces after commas
					opts = opts.replace(/,\s+/g, ",");
					try {
						arr = JSON.parse(opts);
					} catch (e) {
						// fallback: try to split manually
						arr = opts
							.slice(1, -1)
							.split(",")
							.map((s) => s.trim().replace(/^"|"$/g, ""));
					}
				}
			}
		} else {
			arr = data.options;
		}
		return arr.map((option) => {
			if (typeof option !== "string") {
				return JSON.stringify(option);
			} else {
				return option;
			}
		});
	}, [data.options]);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 500);

	// Ensure that value is always an array when multiple is true
	const value = useMemo(() => {
		if (data.multiple) {
			return Array.isArray(data.value) ? data.value : [];
		}
		return data.value || null;
	}, [data.multiple, data.value]);

	const handleOpen = () => {
		if (listeners?.onOpen) {
			setDropdownLoading(true);

			const result = listeners.onOpen();

			// Handle both sync and async versions safely
			Promise.resolve(result)
				.catch((e) => {
					console.error("onOpen error:", e);
				})
				.finally(() => {
					setDropdownLoading(false);
				});
		}
	};

	return (
		<Autocomplete
			fullWidth
			multiple={data.multiple}
			disableClearable
			options={stringifiedOptions}
			value={value}
			disabled={data?.disabled || data?.loading}
			onOpen={handleOpen}
			loading={dropdownLoading}
			loadingText={"Loading options..."}
			renderOption={(props, option: string) => {
				try {
					// Parse the option string into an object
					const parsedOption = JSON.parse(option);

					// Extract optionLabel and optionSublabel from the parsed object
					const optionLabel = parsedOption[data?.optionLabel];
					const optionSublabel = parsedOption[data?.optionSublabel];

					if (optionLabel && optionSublabel) {
						// Both labels are present, render them in a structured format
						return (
							<li {...props} style={{ whiteSpace: "pre-wrap" }}>
								<Stack direction={"column"}>
									<>{optionLabel}</>
									<Typography variant="caption">
										{optionSublabel}
									</Typography>
								</Stack>
							</li>
						);
					} else {
						// If one or both labels are missing, fall back to the whole option or a default message
						return <li {...props}>{optionLabel || option}</li>;
					}
				} catch (error) {
					return <li {...props}>{option}</li>;
				}
			}}
			getOptionLabel={(option: string) => {
				try {
					// More error handling and testing
					const isObj = JSON.parse(option)[data.optionLabel];

					if (isObj) {
						return isObj;
					}

					return option;
				} catch {
					return option;
				}
			}}
			onChange={(_, value) => {
				let parsedVal: string | string[];
				if (Array.isArray(value)) {
					parsedVal = value.flatMap((item) =>
						typeof item === "string" ? item : item,
					);
				} else {
					parsedVal = value;
				}
				setData("value", parsedVal);
				debouncedCallback();
			}}
			sx={{
				...data.style,
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					size="small"
					label={data.label}
					variant="outlined"
					required={data.required}
					disabled={data?.disabled || data?.loading}
					InputProps={{
						...params.InputProps,
						startAdornment: (
							<InputAdornment position="end">
								{data?.loading ? (
									<StyledLoading size={20} />
								) : (
									<></>
								)}
							</InputAdornment>
						),
					}}
					helperText={data?.hint}
				/>
			)}
			{...attrs}
		/>
	);
});
