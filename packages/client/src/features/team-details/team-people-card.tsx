import { type MembersSource, MembersTable } from "@semoss/shared";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@semoss/ui/next";

export interface TeamPeopleCardProps {
	/** The card's title, such as "Members" */
	title: string;
	/** What the people in the card do for the team */
	description: string;
	/** Where the shared members table reads, adds and removes the people */
	source: MembersSource;
	/** Whether the admin endpoints and options are used */
	adminMode?: boolean;
	/** Whether people can be added from the organization's directory */
	isDirectoryAvailable?: boolean;
}

/**
 * A team's members or managers, in a card like the team's projects and engines,
 * through the shared members table.
 */
export const TeamPeopleCard = ({
	title,
	description,
	source,
	adminMode = false,
	isDirectoryAvailable = false,
}: TeamPeopleCardProps) => (
	<Card>
		<CardHeader>
			<CardTitle>{title}</CardTitle>
			<CardDescription>{description}</CardDescription>
		</CardHeader>
		<CardContent>
			<MembersTable
				source={source}
				adminMode={adminMode}
				isDirectoryAvailable={isDirectoryAvailable}
			/>
		</CardContent>
	</Card>
);
