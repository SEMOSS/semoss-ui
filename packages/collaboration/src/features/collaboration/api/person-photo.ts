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
