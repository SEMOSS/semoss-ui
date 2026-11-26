import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AgentDirectoryQuery } from "@/features/agents/api/use-agent-directory";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { Agent } from "@/types/agent";
import { ThreadAgentSelect } from "./thread-agent-select";

let query: AgentDirectoryQuery;
const directory = vi.fn();
vi.mock("@/features/agents/api/use-agent-directory", () => ({
	useAgentDirectory: (search: string) => {
		directory(search);
		return query;
	},
}));
// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// whose twin a listed agent is, read when the picker opens
const listTwins = vi.hoisted(() => vi.fn());
vi.mock("@/features/digital-twin/api/digital-twin", () => ({ listTwins }));

const listed = (id: string, name: string): Agent => ({
	id,
	name,
	description: "",
	instructions: "",
	skills: [],
	mcp: [],
	members: [],
});

beforeEach(() => {
	vi.clearAllMocks();
	listTwins.mockResolvedValue({ mine: [], shared: [] });
	query = {
		agents: [listed("research", "Research assistant")],
		error: null,
		hasMore: false,
		isLoading: false,
		isRefreshing: false,
		next: vi.fn(),
		reset: vi.fn(),
	};
});

it("searches agents, loads more, selects one, and goes back to the person's own twin", async () => {
	const onChange = vi.fn();
	query.hasMore = true;
	const { rerender } = render(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={onChange}
		/>,
	);
	await userEvent.click(
		screen.getByRole("combobox", { name: "Talking To: Your Digital Twin" }),
	);
	await userEvent.type(
		screen.getByRole("combobox", { name: "Search agents" }),
		"research",
	);
	await waitFor(() => expect(directory).toHaveBeenLastCalledWith("research"));
	await userEvent.click(
		screen.getByRole("option", { name: "Load more agents" }),
	);
	expect(query.next).toHaveBeenCalledOnce();
	await userEvent.click(
		screen.getByRole("option", { name: "Research assistant" }),
	);
	expect(onChange).toHaveBeenLastCalledWith("research");
	expect(screen.queryByRole("listbox")).toBeNull();
	rerender(
		<ThreadAgentSelect
			value="research"
			name="Research assistant"
			disabled={false}
			onChange={onChange}
		/>,
	);
	await userEvent.click(
		screen.getByRole("combobox", {
			name: "Talking To: Research assistant",
		}),
	);
	await userEvent.click(
		screen.getByRole("option", { name: "Your Digital Twin" }),
	);
	// no seeded agent is known here, so the twin is the blank choice
	expect(onChange).toHaveBeenLastCalledWith("");
});

it("shows loading, retry, and empty catalog states while retaining the selected name", async () => {
	query = { ...query, agents: [], isLoading: true };
	const props = {
		value: "unlisted",
		name: "An agent no longer listed",
		disabled: false,
		onChange: vi.fn(),
	};
	const { rerender } = render(<ThreadAgentSelect {...props} />);
	await userEvent.click(
		screen.getByRole("combobox", {
			name: "Talking To: An agent no longer listed",
		}),
	);
	expect(
		screen.getByRole("status", { name: "Loading agents" }),
	).toBeVisible();
	query = { ...query, isLoading: false, error: new Error("Offline") };
	rerender(<ThreadAgentSelect {...props} />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not load agents.",
	);
	await userEvent.click(screen.getByRole("button", { name: "Retry" }));
	expect(query.reset).toHaveBeenCalledOnce();
	query = { ...query, error: null };
	rerender(<ThreadAgentSelect {...props} />);
	expect(
		screen.getByRole("option", { name: "No matching agents" }),
	).toHaveAttribute("aria-disabled", "true");
	expect(props.onChange).not.toHaveBeenCalled();
});

it("supports keyboard selection and Escape dismissal with focus returned to the trigger", async () => {
	const onChange = vi.fn();
	render(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={onChange}
			compact
		/>,
	);
	const trigger = screen.getByRole("combobox", {
		name: "Talking To: Your Digital Twin",
	});
	trigger.focus();
	await userEvent.keyboard("{Enter}");
	expect(
		screen.getByRole("combobox", { name: "Search agents" }),
	).toHaveFocus();
	await userEvent.keyboard("{ArrowDown}{Enter}");
	expect(onChange).toHaveBeenCalledWith("research");
	await waitFor(() => expect(trigger).toHaveFocus());
	await userEvent.keyboard("{Enter}{Escape}");
	expect(screen.queryByRole("listbox")).toBeNull();
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("closes a disabled picker and does not reopen or accept a stale selection", async () => {
	const onChange = vi.fn();
	const { rerender } = render(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={onChange}
		/>,
	);
	await userEvent.click(
		screen.getByRole("combobox", { name: "Talking To: Your Digital Twin" }),
	);
	const option = screen.getByRole("option", { name: "Research assistant" });
	rerender(
		<ThreadAgentSelect value="" name="" disabled onChange={onChange} />,
	);
	expect(screen.queryByRole("listbox")).toBeNull();
	await userEvent.click(option);
	expect(onChange).not.toHaveBeenCalled();
	rerender(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={onChange}
		/>,
	);
	expect(screen.queryByRole("listbox")).toBeNull();
});

/** The picker as a signed-in person sees it: their twin has a name, and the seeded agent runs it. */
function renderForRobin(value: string, onChange = vi.fn()) {
	render(
		<CollaborationSessionProvider
			initialState={{
				...createInitialCollaborationState(),
				mainTwin: {
					name: "Robin's Digital Twin",
					avatar: "",
					agentId: "collaboration-agent",
				},
			}}
		>
			<ThreadAgentSelect
				value={value}
				name=""
				disabled={false}
				onChange={onChange}
			/>
		</CollaborationSessionProvider>,
	);
	return onChange;
}

it.each(["", "collaboration-agent"])(
	"leads with the person's own twin, selected for the value %j, and leaves it alone when it is chosen again",
	async (value) => {
		// the seeded agent is in the catalog under its own name
		query.agents = [
			listed("collaboration-agent", "Collaboration Agent"),
			listed("research", "Research assistant"),
		];
		const onChange = renderForRobin(value);
		await userEvent.click(
			screen.getByRole("combobox", {
				name: "Talking To: Robin's Digital Twin",
			}),
		);
		const options = screen.getAllByRole("option");
		// the name, what it is under the name, and that it is the one chosen
		expect(options[0]).toHaveTextContent(
			"Robin's Digital TwinYour Digital Twin · Selected",
		);
		// the seeded agent is that first row: it is not listed again under its own name
		expect(options.map((option) => option.textContent)).toEqual([
			"Robin's Digital TwinYour Digital Twin · Selected",
			"Research assistant",
		]);
		await userEvent.click(options[0]);
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.queryByRole("listbox")).toBeNull();
	},
);

it("sets the seeded agent when the twin is chosen over another agent, and counts only the other agents as matches", async () => {
	query.agents = [listed("collaboration-agent", "Collaboration Agent")];
	const onChange = renderForRobin("research");
	// the name the chat passes wins; with none, another agent is just an agent
	await userEvent.click(
		screen.getByRole("combobox", { name: "Talking To: Agent" }),
	);
	// only the seeded agent matched, and it is the first row already
	expect(
		screen.getByRole("option", { name: "No matching agents" }),
	).toHaveAttribute("aria-disabled", "true");
	const twin = screen.getByRole("option", { name: /Robin's Digital Twin/ });
	expect(twin).not.toHaveTextContent("Selected");
	await userEvent.click(twin);
	expect(onChange).toHaveBeenCalledExactlyOnceWith("collaboration-agent");
});

it("says whose twin a listed agent is, from one read each time the picker opens", async () => {
	query.agents = [
		listed("twin-mine", "Robin Hale Twin"),
		listed("twin-dana", "Renewals"),
		listed("twin-unknown", "Priya Shah Twin"),
		listed("research", "Research assistant"),
	];
	listTwins.mockResolvedValue({
		mine: [{ id: "twin-mine", name: "Robin Hale Twin" }],
		shared: [
			{ id: "twin-dana", name: "Renewals", ownerName: "Dana Ortiz" },
			{ id: "twin-unknown", name: "Priya Shah Twin" },
		],
	});
	render(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={vi.fn()}
		/>,
	);
	// closed, it reads nothing
	expect(listTwins).not.toHaveBeenCalled();
	const trigger = screen.getByRole("combobox", {
		name: "Talking To: Your Digital Twin",
	});
	await userEvent.click(trigger);
	const mine = await screen.findByTestId(
		"thread-agent-select-option-twin-mine",
	);
	expect(mine).toHaveRole("option");
	await waitFor(() =>
		expect(mine).toHaveAccessibleName(/Robin Hale Twin\s*A twin you share/),
	);
	const shared = screen.getByTestId("thread-agent-select-option-twin-dana");
	expect(shared).toHaveAccessibleName(/Renewals\s*Shared by Dana Ortiz/);
	expect(
		screen.getByTestId("thread-agent-select-option-twin-unknown"),
	).toHaveAccessibleName(/Priya Shah Twin\s*Shared with you/);
	// an agent that is no twin has no second line, and the twin's own row needs none under its default name
	expect(
		screen.getByRole("option", { name: "Research assistant" }),
	).toBeVisible();
	expect(
		screen.getByRole("option", { name: "Your Digital Twin · Selected" }),
	).toBeVisible();
	expect(listTwins).toHaveBeenCalledExactlyOnceWith(insight.actions);
	// closing reads nothing; opening again reads again, with what was found kept until the answer lands
	await userEvent.keyboard("{Escape}");
	expect(listTwins).toHaveBeenCalledOnce();
	listTwins.mockReturnValue(new Promise(() => undefined));
	await userEvent.click(trigger);
	await waitFor(() => expect(listTwins).toHaveBeenCalledTimes(2));
	expect(
		screen.getByTestId("thread-agent-select-option-twin-dana"),
	).toHaveAccessibleName(/Renewals\s*Shared by Dana Ortiz/);
});

it("lists the agents without a second line when whose twin each is cannot be read", async () => {
	query.agents = [listed("twin-dana", "Renewals")];
	listTwins.mockRejectedValue(new Error("Offline"));
	render(
		<ThreadAgentSelect
			value=""
			name=""
			disabled={false}
			onChange={vi.fn()}
		/>,
	);
	await userEvent.click(
		screen.getByRole("combobox", { name: "Talking To: Your Digital Twin" }),
	);
	await waitFor(() => expect(listTwins).toHaveBeenCalledOnce());
	expect(screen.getByRole("option", { name: "Renewals" })).toBeVisible();
	expect(screen.queryByRole("alert")).toBeNull();
});
