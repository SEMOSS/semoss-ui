import { Badge } from "@semoss/ui/next";
import type { Person } from "../state/collaboration.types";

/** The person's settings that hold in every topic, for rows that also show topic settings. */
export function PersonGlobalBadges({ person }: { person: Person }) {
	return (
		<>
			{person.vip && (
				<Badge variant="secondary" className="ml-2">
					VIP everywhere
				</Badge>
			)}
			{person.neverIngest && (
				<Badge variant="outline" className="ml-2">
					Excluded everywhere
				</Badge>
			)}
		</>
	);
}
