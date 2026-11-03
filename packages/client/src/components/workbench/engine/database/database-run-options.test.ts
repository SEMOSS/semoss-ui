import { describe, expect, it } from "vitest";
import {
	DATABASE_RUN_OPTIONS_SCHEMA,
	TIMEOUT_PROBLEM,
} from "./database-run-options";

describe("database run options", () => {
	it("runs one statement at a time by default, with no timeout", () => {
		expect(DATABASE_RUN_OPTIONS_SCHEMA.parse({})).toEqual({
			isOneTransaction: false,
			timeoutSeconds: undefined,
		});
	});

	it("takes a whole number of seconds in one transaction", () => {
		expect(
			DATABASE_RUN_OPTIONS_SCHEMA.parse({
				isOneTransaction: true,
				timeout: " 30 ",
			}),
		).toEqual({ isOneTransaction: true, timeoutSeconds: 30 });
		expect(
			DATABASE_RUN_OPTIONS_SCHEMA.parse({
				isOneTransaction: true,
				timeout: "",
			}),
		).toEqual({ isOneTransaction: true, timeoutSeconds: undefined });
	});

	it.each(["0", "-5", "1.5", "ten", "2147483648"])(
		"refuses a timeout of %s in one transaction",
		(timeout) => {
			const result = DATABASE_RUN_OPTIONS_SCHEMA.safeParse({
				isOneTransaction: true,
				timeout,
			});

			expect(result.success).toBe(false);
			expect(result.error?.issues[0]).toMatchObject({
				path: ["timeout"],
				message: TIMEOUT_PROBLEM,
			});
		},
	);

	it("ignores the timeout when each statement commits on its own", () => {
		expect(
			DATABASE_RUN_OPTIONS_SCHEMA.parse({
				isOneTransaction: false,
				timeout: "ten",
			}),
		).toEqual({ isOneTransaction: false, timeoutSeconds: undefined });
	});
});
