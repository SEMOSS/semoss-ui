import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Checkbox, styled } from "@mui/material";

import { useBlock } from "../../../hooks";
import { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { debounced } from "../../../utility";

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
            <StyledCheckbox
                style={{
                    ...data.style,
                }}
                disabled={data.disabled}
                checked={data.value}
                onChange={(e) => {
                    const value = e.target.checked;
                    // update the value
                    setData("value", value);
                    debouncedCallback();
                }}
            />
        </StyledContainer>
    );
});
