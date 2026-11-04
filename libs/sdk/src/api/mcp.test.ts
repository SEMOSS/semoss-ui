import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import { makeUserPixelMcp, runMcpTool } from "./mcp";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (pixelReturn: { output: unknown }[], errors: string[] = []) =>
	({
		errors: errors,
		insightId: "insight-1",
		pixelReturn: pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("makeUserPixelMcp", () => {
	it("writes each tool's reactor and metadata, stamped with the generator", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: { tools: [] } }]));

		await expect(
			makeUserPixelMcp({
				filePath: "/mcp/user.json",
				generator: "Connectors",
				tools: [
					{
						reactor: "ListMail",
						metadata: { SMSS_MCP_EXECUTION: "auto" },
					},
					{
						reactor: "SendMail",
						metadata: { SMSS_MCP_EXECUTION: "ask" },
					},
				],
			}),
		).resolves.toEqual({ tools: [] });
		expect(mockRunPixel).toHaveBeenCalledWith(
			'MakeUserPixelMCP(filePath=["/mcp/user.json"], reactor=["ListMail","SendMail"], mcpMetadata=[{"SMSS_MCP_EXECUTION":"auto"},{"SMSS_MCP_EXECUTION":"ask"}], generator=["Connectors"]);',
		);
	});

	it("names no reactors when there are no tools", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: null }]));

		await makeUserPixelMcp({
			filePath: "/mcp/user.json",
			generator: "Connectors",
			tools: [],
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'MakeUserPixelMCP(filePath=["/mcp/user.json"], generator=["Connectors"]);',
		);
	});

	it("fails when the backend refuses the write", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["Not allowed"]));

		await expect(
			makeUserPixelMcp({
				filePath: "/mcp/user.json",
				generator: "Connectors",
				tools: [],
			}),
		).rejects.toThrow("Not allowed");
	});
});

describe("runMcpTool", () => {
	const params = {
		project: "__room__",
		roomId: "room-1",
		name: "SendMail",
		paramValues: { to: "ada@example.com" },
	};

	it("runs the tool against the insight and returns its text", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: "sent" }]));

		await expect(runMcpTool(params, "insight-1")).resolves.toBe("sent");
		expect(mockRunPixel).toHaveBeenCalledWith(
			'RunMCPTool(project=["__room__"], roomId="room-1", function=["SendMail"], paramValues=[{"to":"ada@example.com"}]);',
			"insight-1",
		);
	});

	it("returns output that is not text as JSON, and no output as empty text", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: { id: 7 } }]));
		await expect(runMcpTool(params, "insight-1")).resolves.toBe('{"id":7}');

		mockRunPixel.mockResolvedValue(answer([{ output: undefined }]));
		await expect(runMcpTool(params, "insight-1")).resolves.toBe("");
	});

	it("fails when the tool fails or answers with nothing", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["Mail is down"]));
		await expect(runMcpTool(params, "insight-1")).rejects.toThrow(
			"Mail is down",
		);

		mockRunPixel.mockResolvedValue(answer([]));
		await expect(runMcpTool(params, "insight-1")).rejects.toThrow(
			"SendMail returned no result.",
		);
	});
});
