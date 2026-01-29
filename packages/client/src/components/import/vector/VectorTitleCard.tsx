import { useEffect, useRef, useState } from "react";
import { Box, Stack, styled, Tooltip, Typography } from "@semoss/ui";
import { formatToDataTestId } from "@/utility";

const StyledFormTypeVectorBox = styled(Box, {
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

const StyledInnerBox = styled("div")<{ isVector?: boolean }>(
	({ theme, isVector }) => ({
		display: "flex",
		alignItems: isVector ? "flex-start" : "center",
		gap: theme.spacing(1),
		flexDirection: isVector ? "column" : "row",
	}),
);

// Replaces image with a colored avatar containing initials
const StyledVectorAvatar = styled("div")<{ gradientBg: string }>(
	({ gradientBg }) => ({
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
		background: gradientBg,
		boxShadow:
			"0 0 0 1px rgba(0,0,0,0.08) inset, 0 2px 4px -1px rgba(0,0,0,0.12)",
		transition: "filter 0.25s ease",
		userSelect: "none",
		WebkitFontSmoothing: "antialiased",
		"&:hover": {
			filter: "brightness(1.03)",
		},
	}),
);

const StyledCardImage = styled("img")<{ isDatabase?: boolean }>(
	({ isDatabase }) => ({
		display: "flex",
		height: "30px",
		width: "30px",
		objectFit: "cover",
		borderRadius: isDatabase ? "8px" : "inherit",
	}),
);

const StyledCardVectorText = styled("p")({
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

function hashString(str: string): number {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
}

function pickGradient(name: string): string {
	// Subtle pastel gradient derived from hash: lower saturation + higher lightness.
	const base = hashString(name) % 360;
	const hue2 = (base + 35) % 360;
	const hue3 = (base + 70) % 360;
	return `linear-gradient(135deg, hsl(${base} 45% 88%), hsl(${hue2} 40% 84%), hsl(${hue3} 35% 80%))`;
}

function buildInitials(label: string): string {
	const tokens = label.split(/[\s-]+/).filter((t) => t.length > 0);
	const chars = tokens.map((t) => t[0]);
	return chars.slice(0, 3).join("");
}

interface Vector {
	name: string;
	display?: string;
	icon: string;
	disable?: boolean;
	description?: string;
	link?: string; // optional documentation link
}

interface VectorTileCardProps {
	vector: Vector;
	onModelSelect?: (vector: Vector) => void;
}

export const VectorTitleCard: React.FC<VectorTileCardProps> = ({
	vector,
	onModelSelect,
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);
	const label = vector.display || vector.name;

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
	// Dynamic gradient based on vector name for visual distinction
	const avatarGradient = pickGradient(vector.name);

	const cardContent = (
		<StyledFormTypeVectorBox
			disabled={vector.disable || false}
			onClick={() => {
				if (!vector.disable && onModelSelect) {
					onModelSelect(vector);
				}
			}}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${vector.name}-img`,
			)}
		>
			{vector.link && !vector.disable && (
				<DocsLinkButton
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							vector.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					aria-label={`Open documentation for ${label}`}
				>
					Docs
				</DocsLinkButton>
			)}
			<StyledInnerBox isVector={true}>
				<Stack direction="row" width={"100%"} spacing={1}>
					{vector.icon ? (
						<StyledCardImage src={vector.icon} alt={initials} />
					) : (
						<StyledVectorAvatar gradientBg={avatarGradient}>
							{initials}
						</StyledVectorAvatar>
					)}
					{vector.disable && (
						<StyledTypographyText variant="body1">
							Coming Soon
						</StyledTypographyText>
					)}
				</Stack>
				<TitleRow>
					<StyledCardVectorText ref={textRef}>
						{vector.display || vector.name}
					</StyledCardVectorText>
				</TitleRow>
				<DescriptionText component="p" variant="caption">
					{vector.description}
				</DescriptionText>
			</StyledInnerBox>
		</StyledFormTypeVectorBox>
	);

	return isTruncated ? (
		<Tooltip title={label} placement="bottom" arrow>
			<StyledCardContentSpan>{cardContent}</StyledCardContentSpan>
		</Tooltip>
	) : (
		cardContent
	);
};
