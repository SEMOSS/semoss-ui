import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AgentDirectoryQuery } from "@/features/agents/api/use-agent-directory";
import { ThreadAgentSelect } from "./thread-agent-select";

let query: AgentDirectoryQuery;
const directory = vi.fn();
vi.mock("@/features/agents/api/use-agent-directory", () => ({
	useAgentDirectory: (search: string) => {
		directory(search);
		return query;
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	query = {
		agents: [
			{
				id: "research",
				name: "Research assistant",
				description: "",
				instructions: "",
				skills: [],
				mcp: [],
				members: [],
			},
		],
		error: null,
		hasMore: false,
		isLoading: false,
		isRefreshing: false,
		next: vi.fn(),
		reset: vi.fn(),
	};
});

it("searches agents, loads more, selects one, and clears to Assistant", async () => {
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
		screen.getByRole("combobox", { name: "Agent: Assistant" }),
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
		screen.getByRole("combobox", { name: "Agent: Research assistant" }),
	);
	await userEvent.click(screen.getByRole("option", { name: "Assistant" }));
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
			name: "Agent: An agent no longer listed",
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
	const trigger = screen.getByRole("combobox", { name: "Agent: Assistant" });
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
		screen.getByRole("combobox", { name: "Agent: Assistant" }),
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
