import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TwinHub } from "./twin-hub";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));

const ROBIN = { project_id: "twin-1", project_name: "Robin Twin" };
const DANA = {
	project_id: "twin-2",
	project_name: "dana",
	project_display_name: "Dana Ortiz Twin",
};
/** The twins the server lists: the caller's own, then everyone's they can chat with. */
let twins: { mine: unknown; all: unknown };

beforeEach(() => {
	twins = { mine: [], all: [] };
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer = statement.includes("createdByMe=[true]")
			? twins.mine
			: twins.all;
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(cleanup);

const renderHub = () =>
	render(
		<MemoryRouter>
			<TwinHub />
		</MemoryRouter>,
	);

it("offers to create a twin to someone who has none, and says nothing is shared with them", async () => {
	renderHub();
	expect(screen.getByText("Loading Digital Twins…")).toBeInTheDocument();
	expect(
		await screen.findByRole("link", { name: "Create your Digital Twin" }),
	).toHaveAttribute("href", "/twins/mine");
	expect(
		screen.getByText(/No one has shared a Digital Twin with you yet/),
	).toBeVisible();
	expect(screen.queryByRole("link", { name: /Chat/ })).toBeNull();
});

it("shows the owner's twin with its three ways in, and each shared twin with its chat", async () => {
	twins = { mine: [ROBIN], all: [ROBIN, DANA] };
	renderHub();
	const mine = within(
		await screen.findByRole("region", { name: "Your Digital Twin" }),
	);
	expect(
		mine.getByRole("heading", { level: 3, name: "Robin Twin" }),
	).toBeVisible();
	expect(
		mine.getByRole("link", { name: "Manage: Robin Twin" }),
	).toHaveAttribute("href", "/twins/mine");
	expect(
		mine.getByRole("link", { name: "What it knows: Robin Twin" }),
	).toHaveAttribute("href", "/twins/mine/contents");
	expect(
		mine.getByRole("link", { name: "Chat: Robin Twin" }),
	).toHaveAttribute("href", "/twins/chat?agentId=twin-1");
	expect(
		screen.queryByRole("link", { name: "Create your Digital Twin" }),
	).toBeNull();

	// the owner's own twin is not listed again among the shared ones
	const shared = within(
		screen.getByRole("region", { name: "Shared with you" }),
	);
	expect(shared.getAllByRole("listitem")).toHaveLength(1);
	expect(
		shared.getByRole("link", { name: "Chat: Dana Ortiz Twin" }),
	).toHaveAttribute("href", "/twins/chat?agentId=twin-2");
	expect(shared.queryByRole("link", { name: /Manage/ })).toBeNull();
});

it("says when the twins could not be read, and reads again on request", async () => {
	twins.all = new Error("The server is restarting");
	renderHub();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting",
	);
	twins.all = [DANA];
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("link", { name: "Chat: Dana Ortiz Twin" }),
	).toBeVisible();
});
