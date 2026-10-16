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
