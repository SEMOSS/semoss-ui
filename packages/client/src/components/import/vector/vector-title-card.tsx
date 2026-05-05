import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import BRAIN from "@/assets/img/BRAIN.png";
import { formatToDataTestId } from "@/utility";

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

	const iconSrc = vector.icon || BRAIN;

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
		// biome-ignore lint/a11y/useSemanticElements: TODO
		<div
			className={cn(
				"flex min-h-[200px] w-full cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4 sm:w-[215px]",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				vector.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testid={formatToDataTestId(
				`importPageContent-connect-to-${vector.name}-img`,
			)}
			role="button"
			tabIndex={vector.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					<img
						src={iconSrc}
						alt={label}
						className="flex h-[30px] w-[30px] rounded-lg object-cover"
					/>
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
				<p className="mt-1 line-clamp-3 max-h-[calc(3*1.3em)] min-h-[calc(3*1.3em)] text-[11px] text-muted-foreground leading-[1.3]">
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
				<span className="block w-full sm:w-[215px]">{cardContent}</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	) : (
		cardContent
	);
};
