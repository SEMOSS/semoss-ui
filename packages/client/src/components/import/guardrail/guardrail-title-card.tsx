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

interface Guardrail {
	name: string;
	display?: string;
	icon: string;
	disable?: boolean;
	description?: string;
	link?: string; // optional documentation link
}

interface GuardrailTileCardProps {
	guardrail: Guardrail;
	onGuardrailSelect?: (guardrail: Guardrail) => void;
}

export const GuardrailTitleCard: React.FC<GuardrailTileCardProps> = ({
	guardrail,
	onGuardrailSelect,
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);
	const label = guardrail.display || guardrail.name;

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
	// Dynamic gradient based on guardrail name for visual distinction
	const avatarGradient = pickGradient(guardrail.name);

	const handleCardClick = () => {
		if (!guardrail.disable && onGuardrailSelect) {
			onGuardrailSelect(guardrail);
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
				"relative flex min-h-[200px] w-full cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4 sm:w-[215px]",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				guardrail.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${guardrail.name}-img`,
			)}
			role="button"
			tabIndex={guardrail.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					{guardrail.icon ? (
						<img
							src={guardrail.icon}
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
					{guardrail.disable && (
						<Badge variant="secondary">Coming Soon</Badge>
					)}
				</div>
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-0.5 self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
					>
						{guardrail.display || guardrail.name}
					</p>
				</div>
				<p
					className="mt-1 line-clamp-3 text-[11px] text-muted-foreground leading-[1.3]"
					title={guardrail.description || ""}
				>
					{guardrail.description}
				</p>
			</div>
			{guardrail.link && !guardrail.disable && (
				<Button
					type="button"
					variant="link"
					className="mt-2 flex justify-end p-0 text-[12px]"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							guardrail.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								guardrail.link as string,
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
