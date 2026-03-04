import { useParams } from "react-router-dom";
import { Separator } from "@semoss/ui/next";
import {
	TeamEnginesTable,
	TeamMembersTable,
	TeamProjectsTable,
} from "@/components/teams";
import { TeamMembersProviderBanner } from "@/components/teams/team-members-provider-banner";

export const TeamSettingsDetailPage = () => {
	// pull :type and :id from the url
	const { type: rawType, id: rawId } = useParams<{
		type: string;
		id: string;
	}>();
	const type = rawType ? decodeURIComponent(rawType) : undefined;
	const id = rawId ? decodeURIComponent(rawId) : undefined;

	return (
		<div className="flex w-full flex-col gap-6 pb-4">
			<div className="flex w-full flex-col gap-6">
				{type && id && (
					<>
						{type === "CUSTOM" ? (
							<TeamMembersTable groupId={id} name="MEMBERS" />
						) : (
							<TeamMembersProviderBanner type={type} />
						)}
						<Separator className="bg-border/60" />
						<TeamProjectsTable
							groupId={id}
							groupType={type}
							name="PROJECTS"
						/>
						<Separator className="bg-border/60" />
						<TeamEnginesTable
							groupId={id}
							groupType={type}
							name="ENGINES"
						/>
					</>
				)}
			</div>
		</div>
	);
};
