import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { InsightReadyGate } from "./insight-ready-gate";

const mocks = vi.hoisted(() => ({
	insight: {
		isInitialized: false,
		isReady: false,
		error: null as Error | null,
	},
}));

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => mocks.insight }));

afterEach(() => {
	cleanup();
	mocks.insight = { isInitialized: false, isReady: false, error: null };
});

const renderGate = (loadingFallback?: string) =>
	render(
		<InsightReadyGate
			errorFallback={<p>Failed</p>}
			loadingFallback={
				loadingFallback ? <p>{loadingFallback}</p> : undefined
			}
		>
			<p>Page</p>
		</InsightReadyGate>,
	);

it("waits while the insight is made", () => {
	renderGate("Loading");
	expect(screen.getByText("Loading")).toBeTruthy();
	expect(screen.queryByText("Page")).toBeNull();
});

it("renders the views once the insight is ready", () => {
	mocks.insight.isInitialized = true;
	mocks.insight.isReady = true;
	renderGate();
	expect(screen.getByText("Page")).toBeTruthy();
});

it.each([
	["an error", { error: new Error("No insight") }],
	["setup that ended without one", { isInitialized: true }],
])("shows the error fallback after %s", (_name, insight) => {
	mocks.insight = { ...mocks.insight, ...insight };
	renderGate();
	expect(screen.getByText("Failed")).toBeTruthy();
	expect(screen.queryByText("Page")).toBeNull();
});
