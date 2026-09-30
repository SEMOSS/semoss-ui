import { useTranslation } from "@semoss/i18n";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
} from "@semoss/ui/next";
import type { TeamsChannelChoice } from "./use-teams-channel-choice";

/** Props for {@link TeamsChannelPicker}. */
export interface TeamsChannelPickerProps {
	/** The choice to show and change. */
	choice: TeamsChannelChoice;
}

/** Pick the team, then the channel, a Teams viewer shows. */
export const TeamsChannelPicker = ({ choice }: TeamsChannelPickerProps) => {
	const { t } = useTranslation("connectors");
	const teams = choice.teamsQuery.data ?? [];
	const channels = choice.channelsQuery.data ?? [];

	return (
		<div className="flex min-w-0 @xs:flex-row flex-col gap-2">
			<Select
				value={choice.team?.id ?? ""}
				onValueChange={choice.chooseTeam}
			>
				<SelectTrigger
					size="sm"
					className="h-8 min-w-0 flex-1 bg-background shadow-none"
					aria-label={t("teams.team")}
				>
					<SelectValue placeholder={t("teams.chooseTeam")} />
				</SelectTrigger>
				<SelectContent>
					{teams.map((team) => (
						<SelectItem key={team.id} value={team.id}>
							{team.displayName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{choice.channelsQuery.status === "loading" ? (
				<Skeleton className="h-8 min-w-0 flex-1" />
			) : (
				<Select
					value={choice.channel?.id ?? ""}
					disabled={channels.length === 0}
					onValueChange={choice.chooseChannel}
				>
					<SelectTrigger
						size="sm"
						className="h-8 min-w-0 flex-1 bg-background shadow-none"
						aria-label={t("teams.channel")}
					>
						<SelectValue placeholder={t("teams.chooseChannel")} />
					</SelectTrigger>
					<SelectContent>
						{channels.map((channel) => (
							<SelectItem key={channel.id} value={channel.id}>
								{channel.displayName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
};
