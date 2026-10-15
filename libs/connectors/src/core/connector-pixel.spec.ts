import { beforeEach, describe, expect, it, vi } from "vitest";

const runPixel = vi.fn();
vi.mock("@semoss/sdk", () => ({
	runPixel: (...args: unknown[]) => runPixel(...args),
}));

const {
	ConnectorSignInError,
	classifyConnectorError,
	getConnectorErrorKey,
	runConnectorPixel,
	toConnectorError,
} = await import("./connector-pixel");

beforeEach(() => {
	runPixel.mockReset();
});

describe("runConnectorPixel", () => {
	it("resolves to the reactor's output", async () => {
		runPixel.mockResolvedValue({
			pixelReturn: [
				{ output: { files: [] }, operationType: ["OPERATION"] },
			],
		});
		await expect(runConnectorPixel("X();", "i1")).resolves.toEqual({
			files: [],
		});
		expect(runPixel).toHaveBeenCalledWith("X();", "i1");
	});

	it("raises a sign in error for the backend's login required type", async () => {
		runPixel.mockResolvedValue({
			pixelReturn: [
				{
					output: {
						type: "MICROSOFT",
						message: "Please login to your Microsoft account",
					},
					operationType: ["ERROR", "LOGGIN_REQUIRED_ERROR"],
				},
			],
		});
		const error = await runConnectorPixel("X();", "i1").catch((e) => e);
		expect(error).toBeInstanceOf(ConnectorSignInError);
		expect(error.provider).toBe("MICROSOFT");
	});

	it("raises the backend's message for other errors", async () => {
		runPixel.mockResolvedValue({
			pixelReturn: [
				{ output: "Team ID is required", operationType: ["ERROR"] },
			],
		});
		await expect(runConnectorPixel("X();", "i1")).rejects.toThrow(
			"Team ID is required",
		);
	});
});

describe("classifyConnectorError", () => {
	it("treats Graph refusing the token as a sign in", () => {
		const info = classifyConnectorError(
			new Error(
				'An error occurred. Error message: GET request to https://graph.microsoft.com/v1.0/me returned HTTP 401. Response body: {"error":{}}',
			),
		);
		expect(info).toEqual({
			kind: "signIn",
			message:
				"An error occurred. Error message: GET request to https://graph.microsoft.com/v1.0/me returned HTTP 401",
		});
	});

	it("sorts access, missing, and throttled failures", () => {
		const kind = (status: number) =>
			classifyConnectorError(new Error(`x returned HTTP ${status}.`))
				.kind;
		expect(kind(403)).toBe("forbidden");
		expect(kind(404)).toBe("notFound");
		expect(kind(429)).toBe("throttled");
		expect(kind(500)).toBe("other");
	});

	it("maps every kind to a translation key", () => {
		expect(getConnectorErrorKey({ kind: "other", message: "m" })).toBe(
			"errors.other",
		);
		expect(
			getConnectorErrorKey(
				classifyConnectorError(
					new ConnectorSignInError("MICROSOFT", "m"),
				),
			),
		).toBe("errors.signIn");
	});
});

describe("toConnectorError", () => {
	it("reads the sign in details a Pixel hook reports as its message", () => {
		const error = toConnectorError(
			new Error(
				JSON.stringify({
					type: "MICROSOFT",
					message: "Please login to your Microsoft account",
				}),
			),
		);
		expect(error).toBeInstanceOf(ConnectorSignInError);
		expect(classifyConnectorError(error).kind).toBe("signIn");
	});

	it("leaves every other failure as it was", () => {
		const plain = new Error("returned HTTP 404");
		expect(toConnectorError(plain)).toBe(plain);
		const other = new Error(JSON.stringify({ code: 7 }));
		expect(toConnectorError(other)).toBe(other);
	});
});
