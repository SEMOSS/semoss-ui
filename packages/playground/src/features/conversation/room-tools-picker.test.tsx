import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MCPSelector } from "@semoss/shared";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk/react")>();
	return {
		...actual,
		usePixel: () => ({
			status: "SUCCESS",
			data: { engines: [], dependencies: [] },
		}),
		useIteratorPixel: (
			query: (limit: number, offset: number) => string,
		) => ({
			data: query(15, 0).includes("MyProjects")
				? []
				: [
						{
							id: "search",
							name: "Search",
							type: "FUNCTION",
							permission: "OWNER",
							description: "Find references",
							tags: [],
						},
					],
			isLoading: false,
			isError: false,
			hasMore: false,
			next: vi.fn(),
			reset: vi.fn(),
		}),
	};
});

beforeEach(() =>
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	),
);
afterEach(() => vi.unstubAllGlobals());

test("keeps inherited selections visible and immutable while allowing local selections", async () => {
	const onChange = vi.fn();
	render(
		<MCPSelector
			type="TOOLBOX"
			presentation="list"
			values={[
				{
					id: "inherited",
					name: "Agent tool",
					type: "PROJECT",
					fromWorkspace: true,
				},
				{
					id: "room",
					name: "Room files",
					type: "ROOM",
					fromRoom: true,
				},
			]}
			onChange={onChange}
		/>,
	);
	expect(screen.getByRole("checkbox", { name: /Agent tool/ })).toBeDisabled();
	expect(screen.getByRole("checkbox", { name: /Room files/ })).toBeDisabled();
	fireEvent.click(screen.getByRole("checkbox", { name: /Search/ }));
	expect(onChange).toHaveBeenCalledWith(
		expect.arrayContaining([
			expect.objectContaining({ id: "inherited", fromWorkspace: true }),
			expect.objectContaining({ id: "room", fromRoom: true }),
			expect.objectContaining({ id: "search" }),
		]),
	);
	fireEvent.change(screen.getByRole("textbox"), {
		target: { value: "Agent" },
	});
	await waitFor(() =>
		expect(
			screen.queryByRole("checkbox", { name: /Room files/ }),
		).toBeNull(),
	);
	expect(screen.getByRole("checkbox", { name: /Agent tool/ })).toBeDisabled();
});

test("locks changes during execution without hiding the current configuration", () => {
	const onChange = vi.fn();
	render(
		<MCPSelector
			type="TOOLBOX"
			presentation="list"
			disabled
			values={[
				{ id: "selected", name: "Selected tool", type: "PROJECT" },
			]}
			onChange={onChange}
		/>,
	);
	for (const checkbox of screen.getAllByRole("checkbox"))
		expect(checkbox).toBeDisabled();
	fireEvent.click(screen.getByRole("checkbox", { name: /Selected tool/ }));
	expect(onChange).not.toHaveBeenCalled();
});
