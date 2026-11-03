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
	/** The explicitly chosen team, or null before selection. */
	team: TeamsTeam | null;
	/** The explicitly chosen channel in this team, or null before selection. */
	channel: TeamsChannel | null;
	/** Pick a team without automatically choosing one of its channels. */
	chooseTeam: (teamId: string) => void;
	/** Pick a channel of the chosen team. */
	chooseChannel: (channelId: string) => void;
	/** Open a team and channel together after browsing the picker. */
	chooseLocation: (teamId: string, channelId: string) => void;
}

/**
 * The team and channel a Teams viewer shows. Start without a selection so
 * opening a viewer never navigates into an arbitrary team's first channel.
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
		teams.find((candidate) => candidate.id === pickedTeamId) ?? null;

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
	const channel = picked ?? null;

	return {
		teamsQuery: teamsQuery,
		channelsQuery: channelsQuery,
		team: team,
		channel: channel,
		chooseTeam: setPickedTeamId,
		chooseLocation: (teamId, channelId) => {
			setPickedTeamId(teamId);
			setPickedChannel({ teamId, channelId });
		},
		chooseChannel: (channelId) => {
			if (team) {
				setPickedChannel({ teamId: team.id, channelId: channelId });
			}
		},
	};
};
