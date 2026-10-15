import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { AgentSelector } from "./agent-selector";

const catalog = vi.hoisted(() => ({
	data: [
		{
			project_id: "alpha",
			project_name: "Alpha",
			project_display_name: "Alpha researcher",
			user_permission: 1,
			description: "Research agent",
		},
	],
	isError: false,
	isLoading: false,
	hasMore: false,
	next: vi.fn(),
	reset: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({ useIteratorPixel: () => catalog }));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/shared", () => ({ AppCatalogAvatar: () => null }));
function Picker({ disabled = false }: { disabled?: boolean }) {
	const [value, setValue] = useState<{
		workspace_id: string;
		name?: string;
	} | null>(null);
	return (
		<AgentSelector
			value={value}
			onChange={setValue}
			allowDefaultAgent
			disabled={disabled}
		/>
	);
}
beforeEach(() => {
	catalog.isError = false;
	catalog.reset.mockClear();
});

test("keyboard selection includes Default agent and saved agents", async () => {
	const user = userEvent.setup();
	render(<Picker />);
	const defaultAgent = screen.getByRole("radio", {
		name: "room:modes.defaultAgent",
	});
	expect(defaultAgent).toBeChecked();
	act(() => defaultAgent.focus());
	await user.keyboard("{ArrowDown>}");
	await waitFor(() =>
		expect(
			screen.getByRole("radio", { name: /Alpha researcher/ }),
		).toBeChecked(),
	);
	await user.keyboard("{/ArrowDown}{ArrowUp>}");
	await waitFor(() => expect(defaultAgent).toBeChecked());
	await user.keyboard("{/ArrowUp}");
});

test("busy selections remain visible and disabled, and catalog errors can retry", () => {
	catalog.isError = true;
	render(<Picker disabled />);
	expect(
		screen.getByRole("radio", { name: /Alpha researcher/ }),
	).toBeDisabled();
	expect(screen.getByRole("textbox")).toBeDisabled();
	expect(screen.getByRole("alert")).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	expect(catalog.reset).toHaveBeenCalledTimes(1);
});
