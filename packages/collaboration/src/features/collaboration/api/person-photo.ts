import type { ConnectorPerson } from "@semoss/connectors";
import { Env } from "@semoss/sdk";

/**
 * Direct URL to a person's Microsoft profile photo, read with the signed-in
 * user's own Microsoft login.
 *
 * The server answers 404 when there is no photo to show (outside contacts,
 * shared mailboxes, people without a photo, no Microsoft login), and the avatar
 * keeps its initials.
 *
 * @param email - The person's email address.
 */
export function personPhotoUrl(email: string): string {
	return `${Env.MODULE}/msgraph/photo?email=${encodeURIComponent(email)}`;
}

/**
 * The same for someone a viewer of `@semoss/connectors` names: by their
 * Microsoft user id where the viewer knows it, which finds them whatever
 * their address is, and by their address otherwise.
 *
 * @param person - Who the viewer's item is from.
 * @returns The URL, or undefined when the viewer knows neither.
 */
export function connectorPersonPhotoUrl(
	person: ConnectorPerson,
): string | undefined {
	if (person.userId)
		return `${Env.MODULE}/msgraph/photo?userId=${encodeURIComponent(person.userId)}`;
	return person.email ? personPhotoUrl(person.email) : undefined;
}
