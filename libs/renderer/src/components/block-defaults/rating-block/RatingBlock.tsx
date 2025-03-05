import { observer } from "mobx-react-lite";
import { CSSProperties } from "react";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Rating, Typography, styled } from "@mui/material";

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
    fontSize: "14px",
    fontWeight: 500,
}));

export interface RatingBlockDef extends BlockDef<"rating"> {
    widget: "rating";
    data: {
        style: CSSProperties;
        label: string;
        value: number;
        precision: number;
        max: number;
        size: "small" | "medium" | "large";
        readOnly: boolean;
        disabled: boolean;
        highlightSelectedOnly: boolean;
    };
    slots: never;
    listeners: {
        onChange: true;
    };
}

export const RatingBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<RatingBlockDef>(id);

    const handleChange = (
        _event: React.SyntheticEvent,
        newValue: number | null,
    ) => {
        setData("value", newValue || 0);
    };

    return (
        <StyledContainer {...attrs} style={data.style}>
            {data.label && <StyledLabel>{data.label}</StyledLabel>}
            <Rating
                name={`rating-${id}`}
                value={data.value}
                onChange={handleChange}
                precision={data.precision}
                max={data.max}
                size={data.size}
                readOnly={data.readOnly}
                disabled={data.disabled}
                highlightSelectedOnly={data.highlightSelectedOnly}
            />
        </StyledContainer>
    );
});
