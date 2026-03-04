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

	const handleCardClick = () => {
		if (!vector.disable && onModelSelect) {
			onModelSelect(vector);
		}
	};

	const handleCardKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleCardClick();
		}
	};

	const cardContent = (
		// biome-ignore lint/a11y/useSemanticElements: <explanation>
		<div
			className={cn(
				"flex min-h-[200px] max-w-[215px] cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				vector.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${vector.name}-img`,
			)}
			role="button"
			tabIndex={vector.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					{vector.icon ? (
						<img
							src={vector.icon}
							alt={initials}
							className="flex h-[30px] w-[30px] rounded-lg object-cover"
						/>
					) : (
						<div
							className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-lg font-semibold text-secondary-foreground text-sm uppercase shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset,0_2px_4px_-1px_rgba(0,0,0,0.12)] transition-[filter] duration-[250ms] [-webkit-font-smoothing:antialiased] hover:brightness-[1.03]"
							style={{ background: avatarGradient }}
						>
							{initials}
						</div>
					)}
					{vector.disable && (
						<Badge variant="secondary">Coming Soon</Badge>
					)}
				</div>
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-0.5 self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
					>
						{vector.display || vector.name}
					</p>
				</div>
				<p className="mt-1 line-clamp-3 min-h-[calc(3*1.3em)] max-h-[calc(3*1.3em)] text-[11px] text-muted-foreground leading-[1.3]">
					{vector.description}
				</p>
			</div>
			{vector.link && !vector.disable && (
				<Button
					type="button"
					variant="link"
					className="mt-2 flex justify-end p-0 text-sm"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							vector.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								vector.link as string,
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
				<span className="block">{cardContent}</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	) : (
		cardContent
	);
};
