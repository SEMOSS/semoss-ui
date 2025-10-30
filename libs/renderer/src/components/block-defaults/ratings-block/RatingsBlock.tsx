import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StarIcon from "@mui/icons-material/Star";
import { styled } from "@mui/material";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledRating = styled(Rating)(({ theme }) => ({
	"& .MuiRating-iconFilled": {
		color: theme.palette.error[300],
	},
	"& .MuiRating-iconHover": {
		color: theme.palette.error[500],
	},
}));

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
