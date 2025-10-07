import { Checkbox, styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Box } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface CheckboxBlockDef extends BlockDef<"checkbox"> {
	widget: "checkbox";
	data: {
		style: CSSProperties;
		value: boolean;
		label: string;
		required: boolean;
		disabled: boolean;
		show: string;
	};
	listeners: {
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const StyledContainer = styled("div")(({ theme }) => ({
	padding: theme.spacing(0.5),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
	padding: theme.spacing(0),
}));

export const CheckboxBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<CheckboxBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	return (
		<StyledContainer {...attrs}>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<StyledCheckbox
					style={{ ...data.style }}
					disabled={data.disabled}
					checked={data.value}
					onChange={(e) => {
						const value = e.target.checked;
						setData("value", value);
						debouncedCallback();
					}}
				/>
				<Box>{data.label}</Box>
			</Box>
		</StyledContainer>
	);
});
