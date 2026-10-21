import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitAssistantToolResult } from "./assistant-tools";

const transport = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk", () => ({ runPixel: transport }));
beforeEach(() => {
	transport.mockReset();
	transport.mockResolvedValue({
		errors: [],
		pixelReturn: [{ output: "ok" }],
	});
});
describe("embedded result API", () => {
	it.each(["success", "error", "cancelled"] as const)(
		"submits %s without an execution decision",
		async (status) => {
			await submitAssistantToolResult("insight", "action", {
				status,
				response: 'done "once"',
			});
			const pixel = transport.mock.calls[0][0];
			expect(pixel).toContain(
				`decision=["${status === "cancelled" ? "reject" : "respond"}"]`,
			);
			expect(pixel).toContain(`mcpToolStatus=["${status}"]`);
			expect(pixel).toContain('mcpToolResult=["done \\"once\\""]');
			expect(pixel).not.toMatch(/decision=\["(approve|edit)"\]/);
			expect(transport.mock.calls[0][1]).toBe("insight");
		},
	);
	it("surfaces backend refusal for retry", async () => {
		transport.mockResolvedValue({ errors: ["Unavailable"] });
		await expect(
			submitAssistantToolResult("insight", "action", {
				status: "success",
				response: "done",
			}),
		).rejects.toThrow("Unavailable");
	});
	it("records the UI's executed parameters with an approval response", async () => {
		await submitAssistantToolResult("insight", "action", {
			response: '{"META":692.48}',
			status: "success",
			executedParameters: { symbol: "META" },
		});
		expect(transport.mock.calls[0][0]).toContain(
			'paramValues=[{"symbol":"META"}]',
		);
	});
});
