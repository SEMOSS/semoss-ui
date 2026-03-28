import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import AZURE_OPEN_AI from "@/assets/img/AZURE_OPEN_AI.svg";
import BEDROCK from "@/assets/img/BEDROCK.svg";
import BERT from "@/assets/img/BERT.png";
import BRAIN from "@/assets/img/BRAIN.png";
import CLAUDE_AI from "@/assets/img/CLAUDE_AI.svg";
import DOLLY_AI from "@/assets/img/DOLLY_AI.jpg";
import ELEUTHER_AI from "@/assets/img/ELEUTHER_AI.png";
import FALCON_AI from "@/assets/img/FALCON_AI.png";
import FLAN from "@/assets/img/FLAN.jpg";
import GEMINI_COLOR from "@/assets/img/GEMINI_COLOR.svg";
import HUGGINGFACE_COLOR from "@/assets/img/HUGGINGFACE_COLOR.svg";
import META_COLOR from "@/assets/img/META_COLOR.svg";
import MOSAIC from "@/assets/img/MOSAIC.png";
import NEMO from "@/assets/img/NEMO.png";
import OPEN_AI from "@/assets/img/OPEN_AI.svg";
import ORCA from "@/assets/img/ORCA.png";
import PERPLEXITY from "@/assets/img/PERPLEXITY.svg";
import REPLIT_CODE from "@/assets/img/REPLIT_CODE.png";
import STABILITY_AI from "@/assets/img/STABILITY_AI.png";
import VICUNA from "@/assets/img/VICUNA.jpg";
import { formatToDataTestId } from "@/utility";

const MODEL_ICON_BY_FILE_NAME: Record<string, string> = {
	"AZURE_OPEN_AI.svg": AZURE_OPEN_AI,
	"BEDROCK.svg": BEDROCK,
	"BERT.png": BERT,
	"BRAIN.png": BRAIN,
	"CLAUDE_AI.svg": CLAUDE_AI,
	"DOLLY_AI.jpg": DOLLY_AI,
	"ELEUTHER_AI.png": ELEUTHER_AI,
	"FALCON_AI.png": FALCON_AI,
	"FLAN.jpg": FLAN,
	"GEMINI_COLOR.svg": GEMINI_COLOR,
	"HUGGINGFACE_COLOR.svg": HUGGINGFACE_COLOR,
	"META_COLOR.svg": META_COLOR,
	"MOSAIC.png": MOSAIC,
	"NEMO.png": NEMO,
	"OPEN_AI.svg": OPEN_AI,
	"ORCA.png": ORCA,
	"PERPLEXITY.svg": PERPLEXITY,
	"REPLIT_CODE.png": REPLIT_CODE,
	"STABILITY_AI.png": STABILITY_AI,
	"VICUNA.jpg": VICUNA,
};

const resolveModelIcon = (icon?: string) => {
	if (!icon) return "";
	if (icon.startsWith("/src/assets/img/")) {
		const fileName = icon.split("/").pop() || "";
		return MODEL_ICON_BY_FILE_NAME[fileName] || "";
	}
	return icon;
};

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
	icon: string;
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
	const resolvedIcon = resolveModelIcon(model.icon);
	const hasIcon = Boolean(resolvedIcon);
	// Dynamic gradient based on model name for visual distinction
	const avatarGradient = pickGradient(model.name);

	const handleCardClick = () => {
		if (!model.disable && onModelSelect) {
			onModelSelect(model);
		}
	};

	const handleCardKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleCardClick();
		}
	};

	const cardContent = (
		// biome-ignore lint/a11y/useSemanticElements: legacy clickable card container
		<div
			className={cn(
				"flex min-h-[204px] w-full cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4 sm:w-[215px]",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				model.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${model.name}-img`,
			)}
			role="button"
			tabIndex={model.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					<div
						className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-lg font-semibold text-secondary-foreground text-sm uppercase shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset,0_2px_4px_-1px_rgba(0,0,0,0.12)] transition-[filter] duration-[250ms] [-webkit-font-smoothing:antialiased] hover:brightness-[1.03]"
						style={{ background: avatarGradient }}
					>
						{hasIcon ? (
							<img
								src={resolvedIcon}
								alt={label}
								className="h-8 w-8 object-contain"
							/>
						) : (
							initials
						)}
					</div>
					<div className="flex flex-wrap items-center gap-1">
						{model.disable && (
							<Badge variant="secondary">Coming Soon</Badge>
						)}
						{!model.disable && model.embedding && (
							<Badge
								variant="default"
								data-testId={formatToDataTestId(
									`importPageContent-${model.name}-embeddings-tag`,
								)}
							>
								Embedding
							</Badge>
						)}
						{!model.disable && model.image && (
							<Badge
								className="rounded-2xl border-none bg-primary/10 px-2.5 font-semibold text-[13px] text-primary"
								data-testId={formatToDataTestId(
									`importPageContent-${model.name}-image-tag`,
								)}
							>
								Image
							</Badge>
						)}
						{!model.disable && model.audio && (
							<Badge
								className="rounded-2xl border-none bg-primary/10 px-2.5 font-semibold text-[13px] text-primary"
								data-testId={formatToDataTestId(
									`importPageContent-${model.name}-audio-tag`,
								)}
							>
								Audio
							</Badge>
						)}
					</div>
				</div>
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-1 self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
					>
						{model.display || model.name}
					</p>
				</div>
				<p
					className="mt-1 line-clamp-3 text-[12px] text-muted-foreground leading-[1.3]"
					title={model.description || ""}
				>
					{model.description}
				</p>
			</div>
			{model.link && !model.disable && (
				<Button
					type="button"
					variant="link"
					className="mt-2 flex justify-end p-0 text-sm"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							model.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								model.link as string,
								"_blank",
								"noopener,noreferrer",
							);
						}
					}}
					aria-label={`Open documentation for ${label}`}
				>
					Docs
				</Button>
			)}
		</div>
	);

	return isTruncated ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="block w-full sm:w-[215px]">{cardContent}</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	) : (
		cardContent
	);
};
