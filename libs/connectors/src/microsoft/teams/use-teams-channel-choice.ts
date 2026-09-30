import { useState } from "react";
import {
	type ConnectorQuery,
	useConnectorQuery,
} from "../../core/use-connector-query";
import { parseChannels, parseTeams } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsChannel, TeamsTeam } from "../microsoft.types";

/** What {@link useTeamsChannelChoice} returns. */
export interface TeamsChannelChoice {
	/** The teams the user belongs to. */
	teamsQuery: ConnectorQuery<TeamsTeam[]>;
	/** The chosen team's channels. */
	channelsQuery: ConnectorQuery<TeamsChannel[]>;
	/** The chosen team: the one picked, or else the first. */
	team: TeamsTeam | null;
	/** The chosen channel: the one picked in this team, or else the first. */
	channel: TeamsChannel | null;
	/** Pick a team. Its first channel is chosen until another is picked. */
	chooseTeam: (teamId: string) => void;
	/** Pick a channel of the chosen team. */
	chooseChannel: (channelId: string) => void;
}

/**
 * The team and channel a Teams viewer shows. Until the user picks, the first
 * team and its first channel are shown, so the viewer has something to show
 * as soon as it opens.
 *
 * @return The choice and the reads behind it.
 */
export const useTeamsChannelChoice = (): TeamsChannelChoice => {
	const teamsQuery = useConnectorQuery(
		MICROSOFT_PIXELS.teamsListTeams(),
		parseTeams,
	);
	const [pickedTeamId, setPickedTeamId] = useState<string | null>(null);
	const [pickedChannel, setPickedChannel] = useState<{
		teamId: string;
		channelId: string;
	} | null>(null);

	const teams = teamsQuery.data ?? [];
	const team =
		teams.find((candidate) => candidate.id === pickedTeamId) ??
		teams[0] ??
		null;

	const channelsQuery = useConnectorQuery(
		team ? MICROSOFT_PIXELS.teamsListChannels(team.id) : null,
		parseChannels,
	);
	const channels = channelsQuery.data ?? [];
	const picked =
		team && pickedChannel?.teamId === team.id
			? channels.find(
					(candidate) => candidate.id === pickedChannel.channelId,
				)
			: undefined;
	const channel = picked ?? channels[0] ?? null;

	return {
		teamsQuery: teamsQuery,
		channelsQuery: channelsQuery,
		team: team,
		channel: channel,
		chooseTeam: setPickedTeamId,
		chooseChannel: (channelId) => {
			if (team) {
				setPickedChannel({ teamId: team.id, channelId: channelId });
			}
		},
	};
};
