import { CSSProperties, useState } from "react";
import { observer } from "mobx-react-lite";
import { Card, styled } from "@semoss/ui";

import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

const CardContainer = styled("div")<{ cssStyle: CSSProperties }>(
    ({ cssStyle }) => ({
        ...cssStyle,
        width: cssStyle.width || "300px",
        height: cssStyle.height || "200px",
        perspective: "1000px",
        border: "none",
    }),
);

const CardFlipper = styled("div")<{ flipped: boolean }>(({ flipped }) => ({
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform 0.6s",
    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
}));

const sharedFaceStyles: CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

const FrontCard = styled(Card)({
    ...sharedFaceStyles,
    zIndex: 2,
});

const BackCard = styled(Card)({
    ...sharedFaceStyles,
    transform: "rotateY(180deg)",
});

export interface FlipCardBlockDef extends BlockDef<"flip-card"> {
    widget: "flip-card";
    data: {
        style: CSSProperties;
        isFlipped: boolean;
        frontBgColor: "#ffffff";
        backBgColor: "#ffffff";
        show: string;
    };
    slots: {
        front: true;
        back: true;
    };
}

export const FlipCardBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<FlipCardBlockDef>(id);
    const { state } = useBlocks();

    const isStatic = state.mode === "static";
    const { width, height, padding, margin, ...withoutDimensions } = data.style;

    const [flipped, setFlipped] = useState(false);

    return (
        <CardContainer
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
            cssStyle={data.style}
            {...attrs}
        >
            <CardFlipper flipped={isStatic ? data.isFlipped : flipped}>
                <FrontCard
                    style={{
                        ...withoutDimensions,
                        backgroundColor: data.frontBgColor,
                    }}
                >
                    <Slot slot={slots.front}></Slot>
                </FrontCard>
                <BackCard
                    style={{
                        ...withoutDimensions,
                        backgroundColor: data.backBgColor,
                    }}
                >
                    <Slot slot={slots.back}></Slot>
                </BackCard>
            </CardFlipper>
        </CardContainer>
    );
});
