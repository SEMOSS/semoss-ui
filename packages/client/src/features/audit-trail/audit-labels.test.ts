import { describe, expect, it } from "vitest";
import {
	AUDIT_STATUS_LABELS,
	auditLabel,
	describeAuditAction,
	describeAuditEvent,
	PERMISSION_EXPIRED_ACTION,
} from "./audit-labels";

describe("audit labels", () => {
	it("names events by their type, and a denied request as Access Denied", () => {
		expect(describeAuditEvent("USAGE_LIMIT_UPDATE", null, "SUCCESS")).toBe(
			"Usage Limit Changed",
		);
		expect(describeAuditEvent("DATABASE_WRITE", null, "FAILURE")).toBe(
			"Database Write",
		);
		expect(
			describeAuditEvent(
				"AUTHORIZATION_DENIED",
				"SetEngineGlobal",
				"DENIED",
			),
		).toBe("Access Denied");
		expect(describeAuditEvent("AUDIT_QUERY", "AUDIT_QUERY", "DENIED")).toBe(
			"Access Denied",
		);
	});

	it.each([
		["PROJECT_RENAME", "App Renamed"],
		["PROJECT_DISPLAY_NAME_UPDATE", "App Display Name Changed"],
		["PROJECT_GLOBAL_UPDATE", "App Made Public Or Private"],
		["PROJECT_DISCOVERABLE_UPDATE", "App Discoverability Changed"],
		["PROJECT_TEMPLATE_UPDATE", "App Template Setting Changed"],
		["PROJECT_METADATA_UPDATE", "App Metadata Changed"],
		["PROJECT_BLOCKS_UPDATE", "App Blocks Saved"],
		["PROJECT_REPLACE", "App Replaced By Upload"],
		["ENGINE_RENAME", "Engine Renamed"],
		["ENGINE_DISPLAY_NAME_UPDATE", "Engine Display Name Changed"],
		["ENGINE_GLOBAL_UPDATE", "Engine Made Public Or Private"],
		["ENGINE_DISCOVERABLE_UPDATE", "Engine Discoverability Changed"],
		["ENGINE_METADATA_UPDATE", "Engine Metadata Changed"],
		[
			"ENGINE_VISIBILITY_UPDATE",
			"Engine Shown Or Hidden In A User's Lists",
		],
	])("names the setting change %s %s", (eventType, label) => {
		expect(describeAuditEvent(eventType, null, "SUCCESS")).toBe(label);
	});

	it.each([
		["PROJECT_EXPORT", "App Exported"],
		["ENGINE_EXPORT", "Engine Exported"],
	])("names the export %s %s", (eventType, label) => {
		expect(describeAuditEvent(eventType, null, "SUCCESS")).toBe(label);
	});

	it("names an admin closing a user's agent room", () => {
		expect(describeAuditEvent("AGENT_ROOM_CLOSE", null, "SUCCESS")).toBe(
			"Agent Room Closed",
		);
	});

	it("names a grant removed at its end date Access Ended, without repeating the action", () => {
		expect(
			describeAuditEvent(
				"PERMISSION_DELETE",
				PERMISSION_EXPIRED_ACTION,
				"SUCCESS",
			),
		).toBe("Access Ended");
		expect(
			describeAuditAction("PERMISSION_DELETE", PERMISSION_EXPIRED_ACTION),
		).toBe("");
		expect(describeAuditAction("LOGIN", "LOGIN")).toBe("");
		expect(
			describeAuditAction("PERMISSION_BULK_GRANT", "GRANT_ALL_ENGINES"),
		).toBe("GRANT_ALL_ENGINES");
	});

	it("puts values with no label in words, and leaves missing values empty", () => {
		expect(auditLabel(AUDIT_STATUS_LABELS, "DENIED")).toBe("Denied");
		expect(auditLabel(AUDIT_STATUS_LABELS, "SOMETHING_NEW")).toBe(
			"Something New",
		);
		expect(auditLabel(AUDIT_STATUS_LABELS, null)).toBe("");
	});
});
