import { expect, it } from "vitest";
import { connectorPersonPhotoUrl } from "./person-photo";

it("asks for a viewer's person by their Microsoft user id first, and by their address otherwise", () => {
	// an id finds someone whatever their address is
	expect(
		connectorPersonPhotoUrl({
			userId: "8f3c1a2b-4d5e-4f60-9a7b-0c1d2e3f4a5b",
			email: "ana@test.com",
		}),
	).toMatch(/\/msgraph\/photo\?userId=8f3c1a2b-4d5e-4f60-9a7b-0c1d2e3f4a5b$/);
	expect(connectorPersonPhotoUrl({ email: "ana+work@test.com" })).toMatch(
		/\/msgraph\/photo\?email=ana%2Bwork%40test\.com$/,
	);
	// nobody to ask about: the avatar keeps its initials
	expect(connectorPersonPhotoUrl({})).toBeUndefined();
});
