import type { ReactNode } from "react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	RadioGroupItem,
} from "@semoss/ui/next";

interface PermissionCardProps {
	/** Icon shown beside the title */
	icon: ReactNode;

	/** Name of the access level */
	title: string;

	/** What the access level allows */
	description: string;

	/** Role the radio item selects */
	value: string;
}

/**
 * One access level in an access request's radio group, with its icon, name
 * and description.
 */
export const PermissionCard = ({
	icon,
	title,
	description,
	value,
}: PermissionCardProps) => {
	return (
		<Card className="rounded-xl p-2">
			<CardHeader className="px-3 py-2">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex h-6 w-6 items-center justify-center text-muted-foreground">
							{icon}
						</div>
						<div className="space-y-1">
							<CardTitle className="text-base">{title}</CardTitle>
							<CardDescription className="text-sm">
								{description}
							</CardDescription>
						</div>
					</div>
					<RadioGroupItem value={value} />
				</div>
			</CardHeader>
		</Card>
	);
};
