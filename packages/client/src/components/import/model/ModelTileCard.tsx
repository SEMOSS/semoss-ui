import { useEffect, useRef, useState } from "react";
import { Box, Stack, styled, Tooltip, Typography } from "@semoss/ui";
import { formatToDataTestId } from "@/utility";

const StyledFormTypeModelBox = styled(Box, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{
	disabled: boolean;
}>(({ disabled }) => {
	return {
		maxWidth: "215px",
		borderRadius: "8px",
		cursor: "pointer",
		display: "block",
		justifyContent: "center",
		alignItems: "center",
		border: "1px solid #C4C4C4",
		padding: "16px",
		backgroundColor: "#fff",
		opacity: disabled ? 0.6 : 1,

		"&:hover": {
			cursor: disabled ? "auto" : "pointer",
			border: disabled ? "1px solid #C4C4C4" : "1.5px solid #0471F0",
			backgroundColor: disabled ? "white" : "#F5F9FE",
		},
	};
});

const StyledInnerBox = styled("div")<{ isModel?: boolean }>(
	({ theme, isModel }) => ({
		display: "flex",
		alignItems: isModel ? "flex-start" : "center",
		gap: theme.spacing(1),
		flexDirection: isModel ? "column" : "row",
	}),
);

const StyledCardImage = styled("img")<{ isModel?: boolean }>(({ isModel }) => ({
	display: "flex",
	height: "30px",
	width: "30px",
	alignItems: "flex-start",
	gap: "10px",
	alignSelf: "stretch",
	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
	borderRadius: isModel ? "8px" : "inherit",
}));

const StyledCardModelText = styled("p")({
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	margin: "2px 0 0",
	alignSelf: "stretch",
	fontSize: "14px",
	fontWeight: "500",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	color: "#212121",
});

const StyledTypographyText = styled(Typography)((theme) => ({
	display: "flex",
	alignItems: "center",
	padding: "0 10px",
	backgroundColor: "#EBEBEB",
	borderRadius: "16px",
	marginLeft: "auto !important",
	fontSize: "13px",
	color: "#212121",
}));

interface ModelTileCardProps {
	model: {
		name: string;
		display: string;
		icon: string;
		embedding: boolean;
		disable?: boolean;
	};
	onModelSelect?: (model: any) => void;
}

export const ModelTileCard: React.FC<ModelTileCardProps> = ({
	model,
	onModelSelect,
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		const el = textRef.current;
		if (el) {
			setIsTruncated(el.scrollWidth > el.clientWidth);
		}
	}, [model.name]);

	const cardContent = (
		<StyledFormTypeModelBox
			disabled={model.disable || false}
			onClick={() => {
				if (!model.disable && onModelSelect) {
					onModelSelect(model);
				}
			}}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${model.name}-img`,
			)}
		>
			<StyledInnerBox isModel={true}>
				{model.disable ? (
					<Stack direction="row" width={"100%"} spacing={1}>
						<StyledCardImage isModel={true} src={model.icon} />
						<StyledTypographyText variant="body1">
							Coming Soon
						</StyledTypographyText>
					</Stack>
				) : (
					<StyledCardImage isModel={true} src={model.icon} />
				)}

				<StyledCardModelText ref={textRef}>
					{model.display || model.name}
				</StyledCardModelText>
			</StyledInnerBox>
		</StyledFormTypeModelBox>
	);

	return isTruncated ? (
		<Tooltip
			title={model.display || model.name}
			placement="bottom"
			arrow
			componentsProps={{
				tooltip: {
					sx: {
						backgroundColor: "#757575",
						fontFamily: "Inter",
						fontStyle: "normal",
						letterSpacing: "0.4px",
					},
				},
			}}
		>
			<span style={{ display: "block" }}>{cardContent}</span>
		</Tooltip>
	) : (
		cardContent
	);
};
