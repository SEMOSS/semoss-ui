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

interface Function {
	name: string;
	display?: string;
	icon: string;
	disable?: boolean;
	description?: string;
	link?: string; // optional documentation link
}

interface FunctionTileCardProps {
	selectedFunction: Function;
	onModelSelect?: (selectedFunction: Function) => void;
}

export const FunctionTitleCard = ({
	selectedFunction,
	onModelSelect,
}: FunctionTileCardProps) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);
	const label = selectedFunction.display || selectedFunction.name;

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

	const iconSrc = selectedFunction.icon || BRAIN;

	const handleCardClick = () => {
		if (!selectedFunction.disable && onModelSelect) {
			onModelSelect(selectedFunction);
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
				"flex min-h-[204px] w-full cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4 sm:w-[215px]",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				selectedFunction.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testId={formatToDataTestId(
				`importPageContent-connect-to-${selectedFunction.name}-img`,
			)}
			role="button"
			tabIndex={selectedFunction.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					<img
						src={iconSrc}
						alt={label}
						className="flex h-[30px] w-[30px] shrink-0 rounded-lg object-cover"
					/>
					<div className="flex flex-wrap items-center gap-1">
						{selectedFunction.disable && (
							<Badge variant="secondary">Coming Soon</Badge>
						)}
					</div>
				</div>
				<div className="flex w-full items-center gap-2">
					<p
						ref={textRef}
						className="mt-1 self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
					>
						{selectedFunction.display || selectedFunction.name}
					</p>
				</div>
				<p
					className="mt-1 line-clamp-3 text-[12px] text-muted-foreground leading-[1.3]"
					title={selectedFunction.description || ""}
				>
					{selectedFunction.description}
				</p>
			</div>
			{selectedFunction.link && !selectedFunction.disable && (
				<Button
					type="button"
					variant="link"
					className="mt-2 flex justify-end p-0 text-sm"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							selectedFunction.link as string,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								selectedFunction.link as string,
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
