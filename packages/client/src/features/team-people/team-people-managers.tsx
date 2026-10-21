import { Spinner } from "@semoss/ui/next";
import type { GroupManager } from "@/api/teams";
import { AccessIdentity } from "@/features/bulk-access-management/access-identity";

export interface TeamPeopleManagersProps {
	/** The team's managers */
	managers: GroupManager[];
	/** Whether the managers are still being read */
	isLoading: boolean;
	/** Why the managers could not be read, or null */
	error: string | null;
}

/**
 * A custom team's managers, who decide who is in it. The caller reads them, so
 * a view that also needs them elsewhere reads them once.
 */
export const TeamPeopleManagers = ({
	managers,
	isLoading,
	error,
}: TeamPeopleManagersProps) => {
	if (error) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{error}
			</p>
		);
	}
	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				Loading managers...
			</div>
		);
	}
	if (managers.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				No one manages this team yet, so only platform admins choose its
				members.
			</p>
		);
	}
	return (
		<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
			{managers.map((manager) => (
				<li
					key={`${manager.type}:${manager.userid}`}
					className="px-3 py-2"
				>
					<AccessIdentity
						category="USER"
						type={manager.type}
						name={manager.name || manager.email || manager.userid}
						id={manager.userid}
						email={manager.email}
					/>
				</li>
			))}
		</ul>
	);
};
