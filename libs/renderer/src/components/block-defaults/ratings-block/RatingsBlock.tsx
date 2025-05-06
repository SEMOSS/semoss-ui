import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

import { BlockDef, BlockComponent } from "../../../store";
import { useBlock } from "../../../hooks";

const StyledRating = styled(Rating)({
    "& .MuiRating-iconFilled": {
        color: "#ff6d75",
    },
    "& .MuiRating-iconHover": {
        color: "#ff3d47",
    },
});

const StyledBox = styled(Box)({
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
});

const StyledStarIcon = styled(StarIcon)({
    opacity: 0.55,
});

export interface RatingsBlockDef extends BlockDef<"ratings"> {
    widget: "ratings";
    data: {
        size: "small" | "large";
        type: "heart" | "star";
        value: number;
        max: number;
    };
    listeners: {
        preProcess: true;
        onChange: true;
    };
}

export const RatingsBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<RatingsBlockDef>(id);

    const { size, value, max, type } = data;

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    // Handle ratings button change
    const handleChange = (newValue: number) => {
        setData("value", newValue, true);
        listeners.onChange();
    };

    return (
        <StyledBox {...attrs}>
            {type === "heart" ? (
                <StyledRating
                    size={size}
                    value={value}
                    max={max}
                    onChange={(event, newValue) => {
                        handleChange(newValue);
                    }}
                    defaultValue={2}
                    icon={<FavoriteIcon fontSize="inherit" />}
                    emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
                />
            ) : (
                <Rating
                    size={size}
                    value={value}
                    max={max}
                    onChange={(event, newValue) => {
                        handleChange(newValue);
                    }}
                    defaultValue={2}
                    emptyIcon={<StyledStarIcon fontSize="inherit" />}
                />
            )}
        </StyledBox>
    );
});
