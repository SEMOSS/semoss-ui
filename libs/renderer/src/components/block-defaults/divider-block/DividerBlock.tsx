import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Divider, styled } from "@mui/material";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
}));

export interface DividerBlockDef extends BlockDef<"divider"> {
    widget: "divider";
    data: {
        style: CSSProperties;
        variant: "fullWidth" | "inset" | "middle";
        orientation: "horizontal" | "vertical";
        textAlign: "center" | "right" | "left";
        flexItem: boolean;
        light: boolean;
        text: string;
        showText: boolean;
        show: string;
    };
    slots: never;
    listeners: {
        preProcess: true;
    };
}

export const DividerBlock: BlockComponent = observer(({ id }) => {
    try {
        const { attrs, data, listeners } = useBlock<DividerBlockDef>(id);

        useEffect(() => {
            if (listeners.preProcess) {
                listeners.preProcess();
            }
        }, []);

        // Determine if we should show text
        const hasText = data.showText && data.text?.trim().length > 0;

        return (
            <StyledContainer
                {...attrs}
                style={data.style}
                sx={{
                    minHeight:
                        data.orientation === "vertical" ? "50px" : "auto",
                }}
            >
                {hasText ? (
                    <Divider
                        variant={data.variant}
                        orientation={data.orientation}
                        textAlign={data.textAlign}
                        flexItem={data.flexItem}
                        light={data.light}
                    >
                        {data.text}
                    </Divider>
                ) : (
                    <Divider
                        variant={data.variant}
                        orientation={data.orientation}
                        textAlign={data.textAlign}
                        flexItem={data.flexItem}
                        light={data.light}
                    />
                )}
            </StyledContainer>
        );
    } catch (error) {
        console.error("Error in DividerBlock:", error);
        return <div>Error loading Divider component</div>;
    }
});
