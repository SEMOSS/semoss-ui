import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	GridBlockColumn,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	styled,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

/**
 * Used for any style settings that utilize a size number, ex width and height
 * Supports % and px units for size
 */

interface SizeSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

const SIZE_VALUE_TYPES = ["em", "px", "%"] as const;

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: "16px",
}));

const StyledFieldWrapper = styled("div")(() => ({
	display: "flex",
	flexDirection: "row",
	justifyContent: "center",
	alignItems: "center",
	gap: "16px",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
}));

export const GridResizeSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		path,
	}: SizeSettingsProps<D>) => {
		const { state } = useBlocks();
		const { data, setData } = useBlockSettings<D>(id);

		// track the value
		const [parsed, setParsed] = useState<{
			unit: "%" | "px" | "em" | "";
			amount: string;
		}>({
			unit: "",
			amount: "",
		});

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			const p: typeof parsed = {
				unit: "",
				amount: "",
			};

			// get the unit
			if (computedValue.includes("%")) {
				p.unit = "%";
			} else if (computedValue.includes("px")) {
				p.unit = "px";
			} else if (computedValue.includes("em")) {
				p.unit = "em";
			}

			// get the value
			if (p.unit) {
				p.amount = computedValue.replace(/\D+/g, "");
			} else {
				p.amount = computedValue;
			}

			setParsed(p);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (amount: string, unit: "%" | "px" | "em" | "") => {
			// updated the parsted value
			setParsed({
				amount: amount,
				unit: unit,
			});

			// get value with unit for setting data
			const v = unit ? amount + unit : amount;

			// clear the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(path, v as PathValue<D["data"], typeof path>);
					// emit event to resize the block on the screen
					state.dispatch({
						message: ActionMessages.DISPATCH_EVENT,
						payload: {
							name: "blockResized",
						},
					});
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<StyledContainer>
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							{label}
						</Typography>{" "}
					</label>
					<StyledTextField
						id="length"
						size="small"
						variant="outlined"
						autoComplete="off"
						value={parsed.amount}
						onChange={(e) => {
							// sync the data on change
							onChange(e.target.value, parsed.unit);
						}}
					/>
					<ToggleButtonGroup
						value={parsed.unit}
						exclusive
						size="small"
					>
						{SIZE_VALUE_TYPES.map((unit) => {
							return (
								<ToggleButton
									key={unit}
									value={unit}
									color={
										parsed.unit === unit
											? "primary"
											: undefined
									}
									onClick={() => {
										onChange(parsed.amount, unit);
									}}
								>
									{unit}
								</ToggleButton>
							);
						})}
					</ToggleButtonGroup>
				</StyledFieldWrapper>
			</StyledContainer>
		);
	},
);
