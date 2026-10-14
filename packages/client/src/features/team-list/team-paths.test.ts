import { describe, expect, it } from "vitest";
import {
	ADMIN_TEAMS_PATH,
	getAdminTeamPath,
	getManagedTeamPath,
	MANAGED_TEAMS_PATH,
} from "./team-paths";

describe("team paths", () => {
	it("puts a team's type and name in its admin path, encoded", () => {
		expect(getAdminTeamPath({ id: "Sales & Ops/EU", type: "CUSTOM" })).toBe(
			`${ADMIN_TEAMS_PATH}/CUSTOM/Sales%20%26%20Ops%2FEU`,
		);
		expect(getAdminTeamPath({ id: "Engineers", type: "MS AD" })).toBe(
			"/settings/team-permissions/MS%20AD/Engineers",
		);
	});

	it("puts only a custom team's name in its managed path, encoded", () => {
		expect(
			getManagedTeamPath({ id: "Sales & Ops/EU", type: "CUSTOM" }),
		).toBe(`${MANAGED_TEAMS_PATH}/Sales%20%26%20Ops%2FEU`);
		expect(MANAGED_TEAMS_PATH).toBe("/settings/managed-teams");
	});
});
