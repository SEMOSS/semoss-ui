/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import { useEffect, useRef, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Storage } from "./storage-import.constants";

interface StorageTileCardProps {
	storage: Storage;
	onSelect?: (storage: Storage) => void;
}

export const StorageTitleCard: React.FC<StorageTileCardProps> = ({
	storage,
	onSelect,
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		if (textRef.current) {
			setIsTruncated(
				textRef.current.scrollWidth > textRef.current.clientWidth,
			);
		}
	}, [storage.name]);

	const cardContent = (
		<div
			data-testid={`storage-card-${storage.id}`}
			className={`flex min-h-[200px] w-full flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all sm:w-[215px] ${
				storage.disable
					? "cursor-auto opacity-60"
					: "cursor-pointer hover:border-primary hover:shadow-sm"
			}`}
			onClick={!storage.disable ? () => onSelect?.(storage) : undefined}
		>
			<div className="flex w-full items-start justify-between">
				<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
					<img
						src={storage.icon}
						alt={storage.name}
						className="h-6 w-6 rounded object-contain"
					/>
				</div>
				{storage.disable && (
					<span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs">
						Coming Soon
					</span>
				)}
			</div>

			<div className="flex w-full flex-col gap-1">
				<TooltipProvider>
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<p
								ref={textRef}
								data-testid={`storage-name-${storage.id}`}
								className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground text-sm"
							>
								{storage.name}
							</p>
						</TooltipTrigger>
						{isTruncated && (
							<TooltipContent side="top" className="max-w-xs">
								<p className="text-sm">{storage.name}</p>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
				<p className="line-clamp-2 text-muted-foreground text-xs">
					{storage.description || "Connect to storage service"}
				</p>
			</div>

			{!storage.disable ? (
				<button
					type="button"
					className="w-full px-0 py-0 text-left text-primary text-xs hover:text-primary/80"
					onClick={(e) => {
						e.stopPropagation();
						// Add docs navigation logic here if needed
					}}
				>
					Docs
				</button>
			) : (
				<div />
			)}
		</div>
	);

	return cardContent;
};
