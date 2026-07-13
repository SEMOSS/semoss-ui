import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AgentSelector } from "./agent-selector";

//Placeholder for a mock function calls
const navigateMock = vi.fn();

let iteratorState: {
	data: Array<{
		project_id: string;
		project_display_name?: string;
		project_name: string;
		user_permission?: number;
		description?: string;
	}>;
	isLoading: boolean;
	hasMore: boolean;
	next: ReturnType<typeof vi.fn>;
};

vi.mock("react-router-dom", async () => {
	const actual =
		await vi.importActual<typeof import("react-router-dom")>(
			"react-router-dom",
		);
	//Whenever useNavigate is invoked, use the fake navigateMock instead which contains
	//args, values, counts etc
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

vi.mock("@semoss/i18n", () => {
	return {
		useTranslation: () => ({
			t: (key: string, options?: { defaultValue?: string }) =>
				options?.defaultValue ?? key,
		}),
	};
});

vi.mock("@semoss/sdk/react", () => {
	return {
		useIteratorPixel: () => iteratorState,
	};
});

vi.mock("@semoss/shared", () => {
	return {
		AppCatalogAvatar: ({ name }: { name: string }) => (
			<div data-testid="app-avatar">{name}</div>
		),
	};
});

vi.mock("@semoss/ui/next", async () => {
	const actual =
		await vi.importActual<typeof import("@semoss/ui/next")>(
			"@semoss/ui/next",
		);
	//Whenever useInfiniteScroll is invoked, we don't actually scroll, rather
	//it just uses setScroll as a mock that holds.
	return {
		...actual,
		useDebouncedValue: (value: string) => value,
		useInfiniteScroll: () => ({
			setScroll: vi.fn(),
		}),
	};
});

beforeEach(() => {
	//Clean up navigateMock inputs
	navigateMock.mockReset();
	//data holds all the card info
	iteratorState = {
		data: [],
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	};
});

test("shows empty state when no agents are returned", () => {
	//Dont actually call onChange, rather keep tracks of it
	const onChange = vi.fn();

	render(<AgentSelector value={null} onChange={onChange} />);

	expect(screen.getByText("selector.noAgentsFound")).toBeInTheDocument();
	expect(onChange).not.toHaveBeenCalled();
});

test("clicking an agent card calls onChange with workspace ref", () => {
	const onChange = vi.fn();

	iteratorState.data = [
		{
			project_id: "ws-1",
			project_display_name: "My Agent",
			project_name: "My Agent",
			user_permission: 1,
			description: "Agent description",
		},
	];

	render(<AgentSelector value={null} onChange={onChange} />);

	//Clicks the agent card
	fireEvent.click(
		screen.getByText("My Agent", {
			selector: ".wrap-break-word",
		}),
	);

	expect(onChange).toHaveBeenCalledTimes(1);
	//The agent is selected with onChange
	expect(onChange).toHaveBeenCalledWith({
		workspace_id: "ws-1",
		name: "My Agent",
	});
});

test("clicking selected agent card toggles selection off", () => {
	const onChange = vi.fn();

	iteratorState.data = [
		{
			project_id: "ws-1",
			project_display_name: "My Agent",
			project_name: "My Agent",
			user_permission: 2,
		},
	];

	//Agent preselect
	render(
		<AgentSelector
			value={{ workspace_id: "ws-1", name: "My Agent" }}
			onChange={onChange}
		/>,
	);

	//De-selectes agent by re-clicking
	fireEvent.click(
		screen.getByText("My Agent", {
			selector: ".wrap-break-word",
		}),
	);

	expect(onChange).toHaveBeenCalledTimes(1);

	//Should change the selected agent as null
	expect(onChange).toHaveBeenCalledWith(null);
});

test("clicking create button opens new agent page in a new tab", () => {
	const onChange = vi.fn();
	//Spys on any window opens
	const openSpy = vi
		.spyOn(window, "open")
		.mockImplementation(() => null as unknown as Window);

	render(<AgentSelector value={null} onChange={onChange} />);

	//Clicks the plus botton
	fireEvent.click(screen.getByTestId("agent-selector--create-btn"));

	expect(openSpy).toHaveBeenCalledTimes(1);

	//Open window gets invoked with thew new tab of agent/new
	expect(openSpy).toHaveBeenCalledWith("#/agent/new", "_blank");

	openSpy.mockRestore();
});

test("clicking open-agent icon uses in-app navigation", () => {
	const onChange = vi.fn();

	iteratorState.data = [
		{
			project_id: "ws-2",
			project_display_name: "Another Agent",
			project_name: "Another Agent",
			user_permission: 3,
		},
	];

	render(<AgentSelector value={null} onChange={onChange} />);

	const openLinks = screen.getAllByRole("link");
	fireEvent.click(openLinks[0]);

	expect(navigateMock).toHaveBeenCalledTimes(1);
	expect(navigateMock).toHaveBeenCalledWith("/agent/ws-2");
	expect(onChange).not.toHaveBeenCalled();
});
