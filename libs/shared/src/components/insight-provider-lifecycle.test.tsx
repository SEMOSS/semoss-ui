import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Config, Env, Session } from "@semoss/sdk";
import { InsightProvider, useInsight } from "@semoss/sdk/react";

const listeners = new Set<() => void>();
const pixels: { expression: string; insightId: string | null }[] = [];
let snapshot: ReturnType<typeof Session.getSnapshot> = {
	status: "AUTHENTICATED",
	user: null,
	error: null,
};

const moveSession = (status: typeof snapshot.status) => {
	snapshot = { ...snapshot, status };
	for (const listener of listeners) listener();
};

const InsightState = () => {
	const { insightId, isReady, error } = useInsight();
	return (
		<output>{error?.message ?? (isReady ? insightId : "loading")}</output>
	);
};

describe("InsightProvider lifecycle", () => {
	beforeEach(() => {
		Config.reset();
		Session.logins.reset();
		listeners.clear();
		pixels.length = 0;
		snapshot = { status: "AUTHENTICATED", user: null, error: null };
		Env.update({
			MODULE: "http://localhost/Monolith",
			APP: "",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			BEARER_TOKEN: "",
			TOOL: null,
		});
		vi.spyOn(Session, "getSnapshot").mockImplementation(() => snapshot);
		vi.spyOn(Session, "subscribe").mockImplementation((listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		});
		vi.spyOn(globalThis, "fetch").mockImplementation(
			async (input, options) => {
				if (String(input).endsWith("/api/config")) {
					return Response.json({
						logins: { NATIVE: "Test" },
						loginDetails: {},
						availableProviders: [],
						theme: {},
					});
				}
				if (
					!String(input).endsWith("/api/engine/runPixel") ||
					typeof options?.body !== "string"
				) {
					throw new Error(`Unexpected request: ${String(input)}`);
				}
				const body = new URLSearchParams(options.body);
				const expression = body.get("expression");
				if (!expression) throw new Error("Missing pixel expression");
				const insightId = body.get("insightId");
				pixels.push({ expression, insightId });
				return Response.json({
					insightID: insightId || "created-insight",
					pixelReturn: [],
				});
			},
		);
	});

	afterEach(() => {
		cleanup();
		listeners.clear();
		Config.reset();
		vi.restoreAllMocks();
	});

	it("does not subscribe a non-owning provider or create workspaces after a later login", async () => {
		const view = render(
			<InsightProvider
				options={{ insightId: "adopted-room" }}
				destroyOnUnmount={false}
			>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("adopted-room");
		expect(Session.subscribe).not.toHaveBeenCalled();

		view.unmount();
		const retained = listeners.size;
		await act(async () => {
			moveSession("UNAUTHENTICATED");
			moveSession("AUTHENTICATED");
		});

		expect(retained).toBe(0);
		expect(pixels).toEqual([]);
	});

	it("does not retain providers from previously visited rooms", async () => {
		const view = render(
			<InsightProvider
				key="first"
				options={{ insightId: "first-room" }}
				destroyOnUnmount={false}
			>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("first-room");
		view.rerender(
			<InsightProvider
				key="second"
				options={{ insightId: "second-room" }}
				destroyOnUnmount={false}
			>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("second-room");

		expect(Session.subscribe).not.toHaveBeenCalled();
		view.unmount();
		expect(listeners.size).toBe(0);
		expect(pixels).toEqual([]);
	});

	it("adopts a different insight without adding session subscriptions", async () => {
		const view = render(
			<InsightProvider
				options={{ insightId: "first-room" }}
				destroyOnUnmount={false}
			>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("first-room");
		view.rerender(
			<InsightProvider
				options={{ insightId: "second-room" }}
				destroyOnUnmount={false}
			>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("second-room");

		expect(Session.subscribe).not.toHaveBeenCalled();
		view.unmount();
		expect(listeners.size).toBe(0);
		expect(pixels).toEqual([]);
	});

	it("preserves adopted workspaces across Strict Mode setup and cleanup", async () => {
		const view = render(
			<StrictMode>
				<InsightProvider
					options={{ insightId: "strict-room" }}
					destroyOnUnmount={false}
				>
					<InsightState />
				</InsightProvider>
			</StrictMode>,
		);
		await screen.findByText("strict-room");
		expect(Session.subscribe).not.toHaveBeenCalled();

		view.unmount();

		expect(listeners.size).toBe(0);
		expect(pixels).toEqual([]);
	});

	it("still drops the backend insight when the provider owns it", async () => {
		const view = render(
			<InsightProvider options={{ insightId: "owned-insight" }}>
				<InsightState />
			</InsightProvider>,
		);
		await screen.findByText("owned-insight");
		await act(async () => view.unmount());

		expect(listeners.size).toBe(0);
		await waitFor(() =>
			expect(pixels).toEqual([
				{ expression: "DropInsight()", insightId: "owned-insight" },
			]),
		);
	});
});
