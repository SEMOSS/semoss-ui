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
		position: "relative",
		minHeight: "200px", // uniform card height assumption

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

// Replaces image with a colored avatar containing initials
const StyledModelAvatar = styled("div")<{ bg: string }>(({ bg }) => ({
	display: "flex",
	height: "40px",
	width: "40px",
	alignItems: "center",
	justifyContent: "center",
	fontWeight: 600,
	fontSize: "14px",
	color: "#212121",
	borderRadius: "8px",
	textTransform: "uppercase",
	backgroundColor: bg,
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

const StyledTypographyText = styled(Typography)(() => ({
	display: "flex",
	alignItems: "center",
	padding: "0 10px",
	backgroundColor: "#EBEBEB",
	borderRadius: "16px",
	marginLeft: "auto !important",
	fontSize: "13px",
	color: "#212121",
}));

const ModelTypeTile = styled(Typography)(() => ({
	display: "flex",
	alignItems: "center",
	padding: "0 10px",
	backgroundColor: "#E8F4FF",
	borderRadius: "16px",
	marginLeft: "auto !important",
	fontSize: "13px",
	color: "#0471F0",
	fontWeight: 600,
}));

const TitleRow = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	width: "100%",
	gap: theme.spacing(1),
}));

const StyledCardContentSpan = styled("span")(() => ({
	display: "block",
}));

const DocsLinkButton = styled("button")(() => ({
	position: "absolute",
	bottom: 8,
	right: 8,
	background: "transparent",
	border: "none",
	padding: 0,
	fontSize: "12px",
	cursor: "pointer",
	color: "#0471F0",
	opacity: 0.75,
	textDecoration: "underline",
	"&:hover": {
		opacity: 1,
	},
}));

const DescriptionText = styled(Typography)(() => ({
	fontSize: "11px",
	lineHeight: 1.3,
	color: "#555",
	marginTop: "4px",
	// Height should exactly match 3 lines to avoid cutting a partial line.
	minHeight: "calc(3 * 1.3em)",
	maxHeight: "calc(3 * 1.3em)",
	overflow: "hidden",
	display: "-webkit-box",
	WebkitLineClamp: 3,
	WebkitBoxOrient: "vertical",
}));

const COLOR_PALETTE = [
	"#E8F4FF",
	"#FDEBD2",
	"#E6F7E9",
	"#F5E8FF",
	"#FFF4E6",
	"#E8F9F9",
	"#F9E6EB",
];

function hashString(str: string): number {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
}

function pickColor(name: string): string {
	return COLOR_PALETTE[hashString(name) % COLOR_PALETTE.length];
}

function buildInitials(label: string): string {
	const tokens = label.split(/[\s-]+/).filter((t) => t.length > 0);
	const chars = tokens.map((t) => t[0]);
	return chars.slice(0, 3).join("");
}

interface Model {
	name: string;
	display: string;
	icon: string; // kept for backward compatibility though no longer rendered
	disable?: boolean;
	description?: string;
	embedding: boolean;
	audio?: boolean;
	image?: boolean;
	link?: string; // optional documentation link
}

interface ModelTileCardProps {
	model: Model;
	onModelSelect?: (model: Model) => void;
}

export const ModelTileCard: React.FC<ModelTileCardProps> = ({
	model,
	onModelSelect,
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);
	const label = model.display || model.name;

	useEffect(() => {
		const checkTruncated = () => {
			const el = textRef.current;
			if (el) {
				setIsTruncated(el.scrollWidth > el.clientWidth);
			}
		};

		// initial check
		checkTruncated();

		// recheck on window resize
		window.addEventListener("resize", checkTruncated);
		return () => {
			window.removeEventListener("resize", checkTruncated);
		};
	}, []);

	const initials = buildInitials(label);
	const avatarColor = pickColor(model.name);

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
			{model.link && !model.disable && (
				<DocsLinkButton
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							model.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					aria-label={`Open documentation for ${label}`}
				>
					Docs
				</DocsLinkButton>
			)}
			<StyledInnerBox isModel={true}>
				<Stack direction="row" width={"100%"} spacing={1}>
					<StyledModelAvatar bg={avatarColor}>
						{initials}
					</StyledModelAvatar>
					{model.disable && (
						<StyledTypographyText variant="body1">
							Coming Soon
						</StyledTypographyText>
					)}
					{!model.disable && model.embedding && (
						<ModelTypeTile
							variant="body1"
							data-testId={formatToDataTestId(
								`importPageContent-${model.name}-embeddings-tag`,
							)}
						>
							Embeddings
						</ModelTypeTile>
					)}
					{!model.disable && model.image && (
						<ModelTypeTile
							variant="body1"
							data-testId={formatToDataTestId(
								`importPageContent-${model.name}-image-tag`,
							)}
						>
							Image
						</ModelTypeTile>
					)}
					{!model.disable && model.audio && (
						<ModelTypeTile
							variant="body1"
							data-testId={formatToDataTestId(
								`importPageContent-${model.name}-audio-tag`,
							)}
						>
							Audio
						</ModelTypeTile>
					)}
				</Stack>
				<TitleRow>
					<StyledCardModelText ref={textRef}>
						{model.display || model.name}
					</StyledCardModelText>
				</TitleRow>
				<DescriptionText component="p" variant="caption">
					{model.description}
				</DescriptionText>
			</StyledInnerBox>
		</StyledFormTypeModelBox>
	);

	return isTruncated ? (
		<Tooltip title={label} placement="bottom" arrow>
			<StyledCardContentSpan>{cardContent}</StyledCardContentSpan>
		</Tooltip>
	) : (
		cardContent
	);
};
