import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	P,
} from "@semoss/ui/next";
import { SystemAppImage } from "@/features/catalog-images/system-app-image";
import { formatToDataTestId } from "@/utility/general";

export interface SystemAppGridItemProps {
	/** test id of the app */
	id: string;

	/** Name of the app */
	name: string;

	/** Description of the app */
	description: string;

	/** External URL to open in a new tab */
	href: string;

	/** Display style - list row or grid card */
	gridStyle: "LIST" | "CARD";
}

/**
 * Card component for system apps (Playground, BI, Terminal).
 * Simplified variant with no favorites, info, or menu items. Opens the
 * target app in a new browser tab.
 */
export const SystemAppGridItem: React.FC<SystemAppGridItemProps> = ({
	id,
	name,
	description,
	href,
	gridStyle,
}) => {
	const tag = "SYSTEM";

	const icon = <SystemAppImage id={id} name={name} />;

	if (gridStyle === "LIST") {
		return (
			<HoverCard openDelay={300}>
				<HoverCardTrigger asChild>
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="group block w-full outline-none"
						data-testid={formatToDataTestId(
							`catalogGridItem-${id}`,
						)}
					>
						<Card className="flex h-auto w-full max-w-full cursor-pointer flex-col items-start justify-center gap-1.5 overflow-hidden rounded-lg p-3.5 hover:shadow-md group-focus:ring group-focus:ring-ring/50 group-focus:ring-inset">
							<div className="flex w-full min-w-0 items-center gap-3">
								<div className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-transparent p-1">
									{icon}
								</div>

								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<P
										className="truncate font-medium"
										title={name}
									>
										{name}
									</P>
									<div className="flex min-w-0 items-center gap-1">
										<div className="flex items-center gap-1 truncate text-muted-foreground text-xs">
											&nbsp;
										</div>
									</div>
								</div>

								<div className="flex shrink-0 flex-wrap items-center gap-1.5">
									<Badge
										variant="outline"
										title={tag}
										className="border-primary/20 bg-primary/10 text-primary"
									>
										<span className="px-2 font-medium text-xs">
											{tag}
										</span>
									</Badge>
								</div>
							</div>
						</Card>
					</a>
				</HoverCardTrigger>
				{description && (
					<HoverCardContent
						className="w-80"
						align="start"
						sideOffset={8}
					>
						<div className="flex flex-col gap-2">
							<P className="font-medium">{name}</P>
							<P className="text-muted-foreground text-sm leading-relaxed">
								{description}
							</P>
						</div>
					</HoverCardContent>
				)}
			</HoverCard>
		);
	}

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group block w-full outline-none"
			data-testid={formatToDataTestId(`catalogGridItem-${id}`)}
		>
			<Card className="flex h-full cursor-pointer flex-col gap-0 overflow-hidden p-0 hover:shadow-md group-focus:ring group-focus:ring-ring/50 group-focus:ring-inset">
				<CardHeader className="relative flex h-18 w-full items-center justify-center bg-muted pt-4">
					<div className="flex h-full w-full items-center justify-center">
						{icon}
					</div>
				</CardHeader>

				<CardContent className="flex flex-1 flex-col gap-2 p-4">
					<P className="truncate font-medium" title={name}>
						{name}
					</P>

					{description ? (
						<P className="line-clamp-2 min-h-10 text-muted-foreground text-sm">
							{description}
						</P>
					) : null}

					<div className="mt-auto">
						<div className="flex min-w-0 flex-wrap items-center gap-1.5">
							<Badge
								variant="outline"
								title={tag}
								className="border-primary/20 bg-primary/10 text-primary"
							>
								<span className="px-2 font-medium text-xs">
									{tag}
								</span>
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>
		</a>
	);
};
