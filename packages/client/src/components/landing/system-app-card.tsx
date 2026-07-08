import { ExternalLink } from "lucide-react";
import { Button, Card, P } from "@semoss/ui/next";

interface SystemAppCardProps extends React.HTMLAttributes<HTMLAnchorElement> {
	name: string;
	description: string;
	href: string;
	img: string;
	darkImg?: string;
}

/**
 * System App Card Component
 */
export const SystemAppCard = ({
	name,
	description,
	href,
	img,
	darkImg,
	...props
}: SystemAppCardProps) => {
	return (
		<a href={href} className="group block w-full outline-none" {...props}>
			<Card className="relative h-full min-h-[184px] cursor-pointer overflow-hidden p-0 shadow-sm hover:shadow-md group-focus:ring group-focus:ring-ring/50 group-focus:ring-inset">
				<div className="flex h-full flex-row">
					{/* Left content */}
					<div className="flex w-1/2 flex-col p-4">
						<div className="flex items-start justify-between">
							<h3 className="font-semibold text-lg">{name}</h3>
						</div>

						<P className="my-2 line-clamp-3 text-muted-foreground text-sm">
							{description}
						</P>

						<div className="mt-auto flex items-center gap-3">
							<Button
								variant="default"
								size="sm"
								className="flex items-center gap-2"
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									window.open(
										href,
										"_blank",
										"noopener,noreferrer",
									);
								}}
							>
								Open
								<ExternalLink className="size-4" />
							</Button>
						</div>
					</div>

					{/* Right illustration - fills right half on md+ and sits below on small */}
					<div className="relative w-1/2">
						<div className="absolute inset-0 h-full w-full overflow-hidden">
							<img
								src={img}
								alt={`${name} illustration`}
								className={`absolute inset-0 h-full w-full transform object-cover object-right ${darkImg ? "dark:hidden" : ""}`}
							/>
							{darkImg ? (
								<img
									src={darkImg}
									alt={`${name} illustration`}
									className="absolute inset-0 hidden h-full w-full transform object-cover object-right dark:block"
								/>
							) : null}
						</div>
					</div>
				</div>
			</Card>
		</a>
	);
};
