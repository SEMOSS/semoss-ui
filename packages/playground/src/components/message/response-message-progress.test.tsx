import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AgentRunProgress } from "@semoss/sdk";
import { ResponseMessageProgress } from "./response-message-progress";

const progress: AgentRunProgress = {
	phase: "editing",
	activity: "model",
	currentTool: null,
	maxTurns: 40,
	turnsCompleted: 36,
	turnsRemaining: 4,
	modelCalls: 37,
	modelTimeMs: 242783,
	toolTimeMs: 900,
	toolWallTimeMs: 721,
	elapsedMs: 259684,
	toolCalls: 36,
	toolFailures: 2,
	repeatedFailures: [
		{
			tool: "EditFile",
			target: "build-deck.js",
			count: 2,
			error: "Text did not match",
		},
	],
};

describe("ResponseMessageProgress", () => {
	it("separates model waiting from tool wall time and exposes repeated failures", () => {
		render(<ResponseMessageProgress progress={progress} error={null} />);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Editing files · Waiting for model · 4 of 40 tool rounds remaining",
		);
		expect(screen.getByText("Model: 4 min 2 s (37 calls)")).toBeVisible();
		expect(screen.getByText("Tools: 0.7 s (36 calls)")).toBeVisible();
		expect(
			screen.getByText(
				/EditFile failed 2 times on build-deck.js: Text did not match/,
			),
		).toBeVisible();
	});

	it("retains measured time and the actual error on failure", () => {
		render(
			<ResponseMessageProgress
				progress={{ ...progress, phase: "failed", activity: "idle" }}
				error="Model request rejected: tool parser unavailable"
			/>,
		);
		expect(screen.getByRole("status")).toHaveTextContent("Failed");
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Model request rejected: tool parser unavailable",
		);
		expect(screen.getByText("Model: 4 min 2 s (37 calls)")).toBeVisible();
	});

	it("leaves legacy runs without telemetry empty", () => {
		const { container } = render(
			<ResponseMessageProgress progress={null} error={null} />,
		);
		expect(container).toBeEmptyDOMElement();
	});
});
