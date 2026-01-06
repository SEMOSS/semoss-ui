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
const StyledModelAvatar = styled("div")<{ gradientBg: string }>(
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

	// Special case: "Others" tile should always show a single 'O'
	const isOthers = model.name === "Others";
	const initials = isOthers ? "O" : buildInitials(label);
	// Dynamic gradient based on model name for visual distinction
	const avatarGradient = pickGradient(model.name);

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
					<StyledModelAvatar gradientBg={avatarGradient}>
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
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-[2px] self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#212121] text-sm leading-[143%] tracking-[0.17px]"
					>
						{model.display || model.name}
					</p>
				</div>
				<p
					className="mt-1 line-clamp-3 text-[#555] text-[12px] leading-[1.3]"
					title={model.description || ""}
				>
					{model.description}
				</p>
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
