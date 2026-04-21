import { Stack, styled, Typography } from "@semoss/ui";
import { formatToDataTestId } from "@/utility";

export interface BlockCardContentProps {
	name?: string;
	image?: string;
	width?: string | number;
	height?: string | number;
	paddingX?: number;
	paddingY?: number;
}

export const blockCardWidth = "133px";
export const blockCardHeight = "106px";

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.secondary.dark,
	userSelect: "none",
}));

export const BlockCardContent = (props: BlockCardContentProps) => {
	const {
		name = "",
		image,
		width = blockCardWidth,
		height = blockCardHeight,
		paddingX = 1,
		paddingY = 1.5,
	} = props;

	return (
		<Stack
			paddingX={paddingX}
			paddingY={paddingY}
			width={width}
			height={height}
			alignItems="center"
			justifyContent="center"
			data-testid={formatToDataTestId(
				`blockMenuCardContent-card-${name}`,
			)}
		>
			{image ? (
				<img
					draggable={false}
					src={image}
					width="100%"
					height="100%"
					alt=""
					aria-hidden="true"
				/>
			) : (
				<StyledTypography
					variant="body2"
					fontWeight="medium"
					align="center"
				>
					{name}
				</StyledTypography>
			)}
		</Stack>
	);
};
