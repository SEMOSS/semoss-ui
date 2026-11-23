import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ConversationTool } from "@/features/messages/types/message";
import { ToolCallCard } from "./tool-call-card";

const run = vi.fn();
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run } }),
}));
afterEach(() => {
	cleanup();
	run.mockReset();
});

const maya = {
	id: "00000000-0000-0000-0000-000000000001",
	name: "Maya Chen",
	title: "Engineering Manager",
	department: "Platform",
};
const sam = {
	id: "00000000-0000-0000-0000-000000000002",
	name: "Sam Ortiz",
	title: "Software Engineer",
};
const jordan = {
	id: "00000000-0000-0000-0000-000000000003",
	name: "Jordan Lee",
};
const alex = {
	id: "00000000-0000-0000-0000-000000000004",
	name: "Alex Rivera",
};
const chart = {
	status: "ok",
	person: maya,
	manager: alex,
	managerStatus: "complete",
	directReports: [sam],
	directReportsStatus: "complete",
	peers: [jordan],
	peersStatus: "complete",
};

function renderChart(output: unknown) {
	const tool: ConversationTool = {
		id: "call",
		name: "ShowOrgChart",
		title: "Show Org Chart",
		parentMessageId: "message",
		status: "COMPLETED",
		arguments: { query: "Maya Chen" },
		output: JSON.stringify(output),
		metadata: {
			SMSS_TOOL_KIND: "semoss_collaboration_tool",
			SMSS_MCP_UI: {
				component: "org-chart",
				resourceURI: "component://collaboration/tool?tool=ShowOrgChart",
			},
		},
	};
	render(<ToolCallCard tool={tool} />);
}

it("opens the saved chart inline, explores a peer by directory id, and goes back without another request", async () => {
	const user = userEvent.setup();
	renderChart(chart);
	expect(
		screen.getByRole("heading", { name: "Org Chart for Maya Chen" }),
	).toBeVisible();
	expect(screen.getByText("Platform")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Show org chart for Alex Rivera" }),
	).toBeVisible();
	expect(
		within(
			screen.getByRole("list", { name: "Direct reports of Maya Chen" }),
		).getByText("Sam Ortiz"),
	).toBeVisible();
	expect(
		screen
			.getByText("Also Reporting to Alex Rivera (1)")
			.closest("details"),
	).not.toHaveAttribute("open");
	expect(run).not.toHaveBeenCalled();
	await user.click(screen.getByText("Also Reporting to Alex Rivera (1)"));
	run.mockResolvedValueOnce({
		pixelReturn: [
			{
				output: {
					...chart,
					person: jordan,
					peers: [maya],
					directReports: [],
				},
			},
		],
	});
	await user.click(
		screen.getByRole("button", { name: "Show org chart for Jordan Lee" }),
	);
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'META | WorkShowOrgChart(personId=["00000000-0000-0000-0000-000000000003"]);',
	);
	expect(
		screen.getByRole("heading", { name: "Org Chart for Jordan Lee" }),
	).toHaveFocus();
	expect(screen.getByText("No direct reports listed.")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(
		screen.getByRole("heading", { name: "Org Chart for Maya Chen" }),
	).toHaveFocus();
	expect(run).toHaveBeenCalledTimes(1);
});

it("distinguishes same-name candidates and resolves a contact-only match by its selected address", async () => {
	const user = userEvent.setup();
	renderChart({
		status: "ambiguous",
		candidates: [
			{ ...sam, name: "Maya Chen", email: "one@example.org" },
			{ name: "Maya Chen", email: "two@example.org" },
		],
		candidatesTruncated: true,
	});
	expect(screen.getByText(/more matches/)).toBeVisible();
	run.mockResolvedValueOnce({
		pixelReturn: [
			{
				output: {
					status: "not_found",
					message: "No visible directory record for this address.",
				},
			},
		],
	});
	await user.click(screen.getByRole("button", { name: /two@example.org/ }));
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'META | WorkShowOrgChart(query=["two@example.org"]);',
	);
	expect(
		screen.getByText("No visible directory record for this address."),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(
		screen.getAllByRole("button", { name: /Show org chart/ }),
	).toHaveLength(2);
});

it("keeps partial and unreadable relationships distinct from an empty list and supports read-only people", async () => {
	renderChart({
		...chart,
		manager: null,
		managerStatus: "unavailable",
		directReports: [{ ...sam, navigable: false }],
		directReportsStatus: "partial",
		peers: [],
		peersStatus: "unavailable",
	});
	expect(
		screen.getByText("Manager information is unavailable."),
	).toBeVisible();
	expect(
		screen.getByText(
			"The directory returned a partial list of direct reports.",
		),
	).toBeVisible();
	expect(screen.getByText("Sam Ortiz")).toBeVisible();
	expect(screen.queryByRole("button", { name: /Sam Ortiz/ })).toBeNull();
	await userEvent.click(screen.getByText("Peers"));
	expect(screen.getByText("Peer information is unavailable.")).toBeVisible();
});

it("retries unavailable charts from valid directory data without creating an extra Back step", async () => {
	const user = userEvent.setup();
	renderChart({ status: "ok", person: { id: "bad" } });
	expect(screen.getByText("This org chart could not be read.")).toBeVisible();
	run.mockRejectedValueOnce(new Error("service down"));
	await user.click(screen.getByRole("button", { name: "Try Again" }));
	expect(
		screen.getByText("The directory could not be reached. Try again."),
	).toBeVisible();
	run.mockResolvedValueOnce({ pixelReturn: [{ output: chart }] });
	await user.click(screen.getByRole("button", { name: "Try Again" }));
	expect(
		screen.getByRole("heading", { name: "Org Chart for Maya Chen" }),
	).toHaveFocus();
	expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
});
