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
		<div
			className="flex flex-col items-center justify-center"
			style={{
				width,
				height,
				paddingLeft: `${paddingX * 8}px`,
				paddingRight: `${paddingX * 8}px`,
				paddingTop: `${paddingY * 8}px`,
				paddingBottom: `${paddingY * 8}px`,
			}}
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
				<span className="select-none text-center font-medium text-muted-foreground text-sm">
					{name}
				</span>
			)}
		</div>
	);
};
