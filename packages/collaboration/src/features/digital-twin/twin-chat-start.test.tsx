import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TwinChatStart } from "./twin-chat-start";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// the ask box opens a room of its own; where it shows is what this page decides
vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => <p>The ask box</p>,
}));

const answer = (output: unknown) => ({
	pixelReturn: [{ output, operationType: ["OPERATION"] }],
});
const twin = (config_json: unknown) => ({
	workspace_id: "twin-2",
	name: "Dana Ortiz Twin",
	system_prompt: "",
	config_json,
});

beforeEach(() => {
	insight.actions.run.mockReset();
});
afterEach(cleanup);

const renderStart = (agentId: string) =>
	render(
		<MemoryRouter>
			<TwinChatStart agentId={agentId} />
		</MemoryRouter>,
	);

it("shows who the twin is, its greeting as written, and the ask box", async () => {
	insight.actions.run.mockResolvedValue(
		answer(
			twin({
				greeting: "Ask me about the **renewal**.",
				greeting_enabled: true,
			}),
		),
	);
	renderStart("twin-2");
	expect(screen.getByText("Loading the Digital Twin…")).toBeInTheDocument();
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Dana Ortiz Twin",
		}),
	).toBeVisible();
	expect(insight.actions.run).toHaveBeenCalledExactlyOnceWith(
		'GetWorkspace(workspaceId=["twin-2"]);',
	);
	// Markdown, not its source
	expect(screen.getByText("renewal").tagName).toBe("STRONG");
	expect(screen.getByText(/an AI, not the person/)).toBeVisible();
	expect(screen.getByText("The ask box")).toBeVisible();
});

it("shows no greeting for a twin whose greeting is off", async () => {
	insight.actions.run.mockResolvedValue(
		answer(
			twin({ greeting: "A draft nobody sees", greeting_enabled: false }),
		),
	);
	renderStart("twin-2");
	expect(await screen.findByText("The ask box")).toBeVisible();
	expect(screen.queryByText("A draft nobody sees")).toBeNull();
});

it("says so instead of offering a chat with a twin the person cannot open", async () => {
	insight.actions.run.mockRejectedValue(
		new Error("User unauthorized to perform this operation"),
	);
	renderStart("twin-3");
	const alert = await screen.findByRole("alert");
	expect(alert).toHaveTextContent("This Digital Twin could not be opened");
	expect(alert).toHaveTextContent(
		"User unauthorized to perform this operation",
	);
	expect(screen.queryByText("The ask box")).toBeNull();
	expect(screen.getByRole("link", { name: "Digital Twins" })).toHaveAttribute(
		"href",
		"/twins",
	);
});

it("asks the server nothing for a link that names no twin", async () => {
	renderStart("");
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The link names no Digital Twin.",
	);
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(screen.queryByText("The ask box")).toBeNull();
});
