/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */

import { useEffect, useRef, useState } from "react";

interface DatabaseCardProps {
	/** The database type: its name, its logo, and whether it can be picked yet. */
	database: { name: string; icon: string; disable: boolean };
	/** Called when the card is clicked, unless the database type is disabled. */
	onSelect: () => void;
}

/**
 * A database type on the Connect to Database page. A disabled type reads
 * Coming Soon, and a name too long for the card shows in full on hover.
 */
export const DatabaseCard = ({ database, onSelect }: DatabaseCardProps) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		if (textRef.current) {
			setIsTruncated(
				textRef.current.scrollWidth > textRef.current.clientWidth,
			);
		}
	}, []);

	const cardContent = (
		<div
			data-testid={`database-card-${database.name}`}
			className={`flex w-full flex-col items-start justify-start gap-2 rounded-lg border border-border bg-card p-4 transition-all sm:w-[215px] ${
				database.disable
					? "cursor-auto opacity-60"
					: "cursor-pointer hover:border-[1.5px] hover:border-primary hover:bg-accent/50"
			}
            `}
			onClick={!database.disable ? onSelect : undefined}
		>
			{database.disable ? (
				<div className="flex w-full flex-row items-center gap-2">
					<img
						src={database.icon}
						alt={database.name}
						className="h-[30px] w-[30px] rounded-lg object-cover"
					/>
					<span className="ml-auto whitespace-nowrap rounded-2xl bg-muted px-2.5 py-1 text-[13px] text-muted-foreground">
						Coming Soon
					</span>
				</div>
			) : (
				<img
					src={database.icon}
					alt={database.name}
					className="h-[30px] w-[30px] rounded-lg object-cover"
				/>
			)}
			<p
				ref={textRef}
				data-testid={`database-name-${database.name}`}
				className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-card-foreground text-sm"
			>
				{database.name}
			</p>
		</div>
	);

	return isTruncated ? (
		<div className="group relative block w-full sm:w-[215px]">
			{cardContent}
			<div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden rounded-md bg-popover px-3 py-1.5 text-popover-foreground text-sm shadow-md group-hover:block">
				{database.name}
			</div>
		</div>
	) : (
		cardContent
	);
};
