import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INBOX_RESULT_COPY } from "./routine-copy";
import { RoutineResult } from "./routine-result";
import type { RoutineStatus } from "./routine-schema";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run: vi.fn() } }),
}));

const completedRun = {
	status: "completed",
	startedAt: "2026-10-15T12:00:00Z",
	finishedAt: "2026-10-15T12:01:00Z",
	roomId: "source-room",
	summary: "Historical **brief**",
	html: "<h1>Morning briefing</h1><table><tr><th>Priority</th><td>Plan the review</td></tr></table>",
	error: null,
} satisfies NonNullable<RoutineStatus["lastRun"]>;

/** Render the real email renderer and result panel, without a live service. */
async function showResult(
	lastRun: RoutineStatus["lastRun"] = completedRun,
): Promise<void> {
	await act(async () => {
		render(
			<MemoryRouter>
				<RoutineResult
					copy={INBOX_RESULT_COPY}
					routine={{
						id: "inbox-daily-brief",
						enabled: true,
						timezone: "UTC",
						lastRun,
					}}
				/>
			</MemoryRouter>,
		);
	});
}

afterEach(cleanup);

describe("RoutineResult email panel", () => {
	it("prefers the formatted email and keeps assistant actions outside its scrollable content", async () => {
		await showResult();
		const frame = screen.getByTitle("Latest brief email");
		expect(frame.getAttribute("srcdoc")).toContain(
			"<h1>Morning briefing</h1>",
		);
		expect(frame.getAttribute("srcdoc")).toContain(
			"<td>Plan the review</td>",
		);
		expect(screen.queryByText(/Historical/)).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Latest brief", level: 3 }),
		).toBeVisible();
		const content = screen.getByRole("article", {
			name: "Latest brief content",
		});
		expect(content).toHaveAttribute("tabindex", "0");
		expect(
			within(content).queryByRole("button", { name: "Ask Assistant" }),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "Ask Assistant" }),
		).toHaveAttribute("type", "button");
		expect(
			screen.queryByRole("link", { name: "Open session" }),
		).not.toBeInTheDocument();
	});

	it.each([undefined, null, "", " \n\t "])(
		"keeps the Markdown fallback for missing or blank HTML (%s)",
		async (html) => {
			await showResult({ ...completedRun, html });
			expect(screen.queryByTitle("Latest brief email")).toBeNull();
			expect(screen.getByText("brief").tagName).toBe("STRONG");
			expect(
				screen.getByRole("button", { name: "Ask Assistant" }),
			).toBeEnabled();
		},
	);

	it("isolates unsafe source markup and blocks remote images until requested", async () => {
		await showResult({
			...completedRun,
			html: '<h1>Safe title</h1><script>alert("bad")</script><form><input name="secret"></form><img src="https://example.com/track.png" onerror="alert(1)" alt="Logo"><a href="javascript:alert(1)">Unsafe link</a>',
		});
		const frame = screen.getByTitle("Latest brief email");
		expect(frame).toHaveAttribute(
			"sandbox",
			"allow-same-origin allow-popups allow-popups-to-escape-sandbox",
		);
		expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
		const source = frame.getAttribute("srcdoc") ?? "";
		expect(source).toContain("<h1>Safe title</h1>");
		expect(source).not.toMatch(
			/<script|<form|<input|<img|onerror|javascript:/,
		);
		expect(source).toContain("script-src 'none'");
		expect(source).toContain("img-src 'none'");
		await act(async () => {
			fireEvent.click(
				screen.getByRole("button", { name: "Load images" }),
			);
		});
		expect(frame.getAttribute("srcdoc")).toContain(
			'<img src="https://example.com/track.png"',
		);
	});

	it("displays an HTML-only output without offering a chat that requires a summary", async () => {
		await showResult({ ...completedRun, summary: null });
		expect(screen.getByTitle("Latest brief email")).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Ask Assistant" }),
		).toBeNull();
	});

	it("retains a delivery warning alongside the readable output", async () => {
		await showResult({
			...completedRun,
			error: "The email could not be delivered.",
		});
		expect(screen.getByRole("alert")).toHaveTextContent(
			"The email could not be delivered.",
		);
		expect(screen.getByTitle("Latest brief email")).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Ask Assistant" }),
		).toBeEnabled();
	});

	it.each([
		["empty", null, INBOX_RESULT_COPY.emptyTitle],
		[
			"running",
			{ ...completedRun, status: "running" },
			INBOX_RESULT_COPY.running,
		],
		[
			"failed",
			{ ...completedRun, status: "failed" },
			INBOX_RESULT_COPY.failed,
		],
	] satisfies [string, RoutineStatus["lastRun"], string][])(
		"keeps the %s state without showing stale HTML",
		async (_label, run, message) => {
			await showResult(run);
			expect(screen.getByText(message)).toBeVisible();
			expect(screen.queryByTitle("Latest brief email")).toBeNull();
			expect(
				screen.queryByRole("button", { name: "Ask Assistant" }),
			).toBeNull();
		},
	);
});
