import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "@semoss/sdk/react";
import { EnterpriseUsagePage } from "@/pages/settings/enterprise-usage.page";

vi.mock("echarts/core", () => ({
	use: vi.fn(),
	init: () => ({
		setOption: vi.fn(),
		on: vi.fn(),
		dispatchAction: vi.fn(),
		resize: vi.fn(),
		dispose: vi.fn(),
	}),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => true }));

const response = (data: unknown) =>
	new Response(JSON.stringify(data), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
const pixelResponse = (output: unknown, operationType = "MAP") =>
	response({
		insightID: "usage-session",
		pixelReturn: [
			{
				output,
				operationType: [operationType],
				isMeta: false,
				pixelExpression: "",
				pixelId: "1",
				timeToRun: 0,
			},
		],
	});
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			disconnect() {}
		},
	);
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	Env.update({ MODULE: "http://localhost/usage-session-fixture" });
});
afterEach(async () => {
	cleanup();
	await Promise.resolve();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("enterprise usage session", () => {
	it("uses the real SDK provider and waits for a shared insight before loading reports", async () => {
		let finishInitialization: (response: Response) => void = () => {
			throw new Error("Initialization Was Not Requested");
		};
		const initialization = new Promise<Response>((resolve) => {
			finishInitialization = resolve;
		});
		const reportRequests: URLSearchParams[] = [];
		fetchMock.mockImplementation(async (url, options) => {
			if (String(url).endsWith("/api/config"))
				return response({ logins: { NATIVE: { id: "admin" } } });
			const body = new URLSearchParams(String(options?.body));
			const pixel = body.get("expression") ?? "";
			if (pixel === "META | init") return initialization;
			if (pixel.startsWith("AdminGetEnterpriseUsage")) {
				reportRequests.push(body);
				return pixelResponse({
					rows: [
						{
							REQUESTS: 1,
							TOKENS: 20,
							MESSAGE_ROWS: 2,
							EVENTS: 1,
							FAILED: 0,
							KNOWN_OUTCOMES: 1,
							DAY: "2024-01-01",
							P95_MS: 20,
							RATINGS: 0,
							POSITIVE: 0,
						},
					],
				});
			}
			return pixelResponse(null);
		});
		render(
			<MemoryRouter>
				<EnterpriseUsagePage />
			</MemoryRouter>,
		);
		expect(
			screen.getByText("Loading Usage Session..."),
		).toBeInTheDocument();
		await waitFor(() =>
			expect(
				fetchMock.mock.calls.some(([, options]) =>
					String(options?.body).includes("init"),
				),
			).toBe(true),
		);
		expect(reportRequests).toHaveLength(0);
		finishInitialization(pixelResponse({}));
		expect(
			await screen.findByText("Platform Activity"),
		).toBeInTheDocument();
		await waitFor(() => expect(reportRequests).toHaveLength(4));
		expect(
			reportRequests.every(
				(request) => request.get("insightId") === "usage-session",
			),
		).toBe(true);
		expect(
			screen.queryByText("Loading Usage Session..."),
		).not.toBeInTheDocument();
	});

	it("shows initialization errors without mounting report queries", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const pixels: string[] = [];
		fetchMock.mockImplementation(async (url, options) => {
			if (String(url).endsWith("/api/config"))
				return response({ logins: { NATIVE: { id: "admin" } } });
			pixels.push(
				new URLSearchParams(String(options?.body)).get("expression") ??
					"",
			);
			return pixelResponse("Session Initialization Failed", "ERROR");
		});
		render(
			<MemoryRouter>
				<EnterpriseUsagePage />
			</MemoryRouter>,
		);
		expect(
			await screen.findByText("Usage Session Unavailable"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Session Initialization Failed/),
		).toBeInTheDocument();
		expect(
			pixels.some((pixel) => pixel.startsWith("AdminGetEnterpriseUsage")),
		).toBe(false);
	});
});
