import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ENGINE_IMAGES } from "@/pages/import/import.constants";
import { formatToDataTestId } from "@/utility";

const normalizeEngineKey = (value?: string) =>
	(value || "").trim().replace(/\W+/g, "_").toUpperCase();

// Defensive provider->subtype translation used only as a last-resort tile fallback.
// Normal tile icon resolution should come from model.icon/modelBrand first.
const MODEL_PROVIDER_SUBTYPE_BY_NAME: Record<string, string> = {
	OpenAI: "OPEN_AI",
	"Google Gemini": "VERTEX",
	"Azure OpenAI": "AZURE_OPEN_AI",
	Anthropic: "CLAUDE",
	"AWS Bedrock": "BEDROCK",
	"NVIDIA NIM": "NEMO",
	"Self Hosted": "HUGGINGFACE",
	Perplexity: "PERPLEXITY",
	Embedded: "BRAIN",
};

const MODEL_SUBTYPE_BY_ICON_FILE_NAME: Record<string, string> = {
	"AZURE_OPEN_AI.svg": "AZURE_OPEN_AI",
	"BEDROCK.svg": "BEDROCK",
	"BRAIN.png": "BRAIN",
	"CLAUDE_AI.svg": "CLAUDE",
	"FALCON_AI.png": "FALCON",
	"FLAN.jpg": "FLAN_T5_LARGE",
	"GEMINI_COLOR.svg": "GEMINI",
	"HUGGINGFACE_COLOR.svg": "HUGGINGFACE",
	"META_COLOR.svg": "META",
	"MOSAIC.png": "MOSAIC_ML",
	"NEMO.png": "NEMO",
	"OPEN_AI.svg": "OPEN_AI",
	"ORCA.png": "ORCA",
	"PERPLEXITY.svg": "PERPLEXITY",
	"REPLIT_CODE.png": "REPLIT_CODE_MODEL",
	"STABILITY_AI.png": "STABLITY_AI",
};

const getModelIconBySubtype = (subtype?: string) => {
	if (!subtype) return "";
	const normalizedSubtype = normalizeEngineKey(subtype);

	const match = (ENGINE_IMAGES.MODEL || []).find((option) => {
		return normalizeEngineKey(option.name) === normalizedSubtype;
	});

	return match?.icon || "";
};

const FALLBACK_MODEL_ICON = getModelIconBySubtype("BRAIN");

const toKnownModelSubtype = (value?: string) => {
	const normalized = normalizeEngineKey(value);
	if (!normalized) return "";
	if (normalized === "GUANACO") return "HUGGINGFACE";
	return normalized;
};

const resolveModelIcon = (model: Model, provider?: string) => {
	const icon = model.icon;
	if (!icon) return FALLBACK_MODEL_ICON;

	if (!icon.startsWith("/src/assets/img/")) {
		return icon;
	}

	const fileName = icon.split("/").pop() || "";
	const subtypeFromFile = MODEL_SUBTYPE_BY_ICON_FILE_NAME[fileName] || "";
	const subtypeFromBrand = toKnownModelSubtype(model.modelBrand);
	const subtypeFromProvider = provider
		? MODEL_PROVIDER_SUBTYPE_BY_NAME[provider] || ""
		: "";

	return (
		getModelIconBySubtype(
			subtypeFromFile || subtypeFromBrand || subtypeFromProvider,
		) || FALLBACK_MODEL_ICON
	);
};

interface Model {
	name: string;
	display: string;
	icon: string;
	modelBrand?: string;
	disable?: boolean;
	description?: string;
	embedding: boolean;
	audio?: boolean;
	image?: boolean;
	link?: string; // optional documentation link
}

interface ModelTileCardProps {
	model: Model;
	provider?: string;
	onModelSelect?: (model: Model) => void;
}

export const ModelTileCard: React.FC<ModelTileCardProps> = ({
	model,
	provider,
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

	const resolvedIcon = resolveModelIcon(model, provider);
	const hasIcon = Boolean(resolvedIcon);
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
					<div className="flex h-10 w-10 shrink-0 items-center justify-center">
						{hasIcon ? (
							<div className="h-10 w-10 overflow-hidden rounded-lg">
								<img
									src={resolvedIcon}
									alt={label}
									className="h-full w-full object-cover"
								/>
							</div>
						) : (
							<div className="flex h-10 w-10 select-none items-center justify-center rounded-lg bg-muted font-semibold text-secondary-foreground text-sm uppercase shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset] [-webkit-font-smoothing:antialiased]">
								AI
							</div>
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
					className="mt-2 ml-auto h-auto w-fit self-end p-0 text-sm"
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
