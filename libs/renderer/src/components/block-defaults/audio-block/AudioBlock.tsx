import { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";

import { styled } from "@semoss/ui";

const StyledLabel = styled("span")(({ theme }) => ({
    marginBottom: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "4px",
}));

export interface AudioBlockDef extends BlockDef<"audio-player"> {
    widget: "audio-player";
    data: {
        label: string;
        autoplay: boolean;
        controls: boolean;
        loop: boolean;
        source: string;
        show: string;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
}));

export const AudioBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<AudioBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    return (
        <StyledContainer {...attrs}>
            <StyledLabel>{data.label}</StyledLabel>
            <audio
                controls={data.controls}
                autoPlay={data.autoplay}
                loop={data.loop}
                src={data.source}
            ></audio>
        </StyledContainer>
    );
});
