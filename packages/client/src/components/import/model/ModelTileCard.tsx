/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatToDataTestId } from "@/utility";

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
		// biome-ignore lint/a11y/useKeyWithClickEvents: <Usage of div is required here>
		<div
			className={cn(
				"flex min-h-[200px] max-w-[215px] cursor-pointer flex-col justify-center rounded-lg border border-input bg-card p-4",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				model.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={() => {
				if (!model.disable && onModelSelect) {
					onModelSelect(model);
				}
			}}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${model.name}-img`,
			)}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					<div
						className="flex h-10 w-10 select-none items-center justify-center rounded-lg font-semibold text-secondary-foreground text-sm uppercase shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset,0_2px_4px_-1px_rgba(0,0,0,0.12)] transition-[filter] duration-[250ms] [-webkit-font-smoothing:antialiased] hover:brightness-[1.03]"
						style={{ background: avatarGradient }}
					>
						{initials}
					</div>
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
							className="ml-auto rounded-2xl border-none bg-primary/10 px-2.5 font-semibold text-[13px] text-primary"
							data-testId={formatToDataTestId(
								`importPageContent-${model.name}-image-tag`,
							)}
						>
							Image
						</Badge>
					)}
					{!model.disable && model.audio && (
						<Badge
							className="ml-auto rounded-2xl border-none bg-primary/10 px-2.5 font-semibold text-[13px] text-primary"
							data-testId={formatToDataTestId(
								`importPageContent-${model.name}-audio-tag`,
							)}
						>
							Audio
						</Badge>
					)}
				</div>
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-[2px] self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
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
					className="flex justify-end text-sm"
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
				</Button>
			)}
		</div>
	);

	return isTruncated ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="block">{cardContent}</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	) : (
		cardContent
	);
};
