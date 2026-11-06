import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getMcpTools } from "@semoss/sdk";
import { ToolboxRow } from "./toolbox-row";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, args?: Record<string, unknown>) =>
			args ? [key, ...Object.values(args)].join(" ") : key,
	}),
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getMcpTools: vi.fn(),
}));

const mockGetMcpTools = vi.mocked(getMcpTools);
const toolbox = { id: "web", name: "Web Search", type: "PROJECT" as const };

beforeEach(() => {
	mockGetMcpTools.mockReset();
});

const renderRow = (onRemove?: () => void) =>
	render(
		<ul>
			<ToolboxRow toolbox={toolbox} onRemove={onRemove} />
		</ul>,
	);

const toggle = () => screen.getByRole("button", { name: /Web Search/ });

test("reads its tools only once it is first opened, and shows what each does", async () => {
	mockGetMcpTools.mockResolvedValue({
		tools: [
			{
				name: "search_web",
				title: "Search the Web",
				description: "Searches the web.",
				_meta: { SMSS_MCP_EXECUTION: "ask" },
			},
		],
	});
	renderRow();
	expect(mockGetMcpTools).not.toHaveBeenCalled();

	fireEvent.click(toggle());
	const tool = await screen.findByRole("button", { name: /Search the Web/ });
	expect(mockGetMcpTools).toHaveBeenCalledWith({
		id: "web",
		type: "PROJECT",
	});
	// the mode sits in the row's mode column, outside its toggle
	expect(tool.closest("li")).toHaveTextContent("defaultTools.modes.ask");
	expect(toggle()).toHaveTextContent("1");

	fireEvent.click(tool);
	expect(screen.getByText("Searches the web.")).toBeVisible();

	// closing and opening again keeps the tools it read
	fireEvent.click(toggle());
	fireEvent.click(toggle());
	expect(mockGetMcpTools).toHaveBeenCalledTimes(1);
});

test("says when its tools cannot be read, and reads them again on Retry", async () => {
	mockGetMcpTools.mockRejectedValueOnce(new Error("No access"));
	mockGetMcpTools.mockResolvedValueOnce({ tools: [] });
	renderRow();

	fireEvent.click(toggle());
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"chatTools:sections.toolbox.error",
	);
	fireEvent.click(
		screen.getByRole("button", { name: "common:buttons.retry" }),
	);
	expect(
		await screen.findByText("chatTools:sections.toolbox.empty"),
	).toBeVisible();
	expect(mockGetMcpTools).toHaveBeenCalledTimes(2);
});

test("offers removal only when it can be removed", () => {
	const onRemove = vi.fn();
	const { unmount } = renderRow(onRemove);
	fireEvent.click(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Web Search",
		}),
	);
	expect(onRemove).toHaveBeenCalledTimes(1);
	expect(mockGetMcpTools).not.toHaveBeenCalled();
	unmount();

	renderRow();
	expect(
		screen.queryByRole("button", { name: /removeSelection/ }),
	).toBeNull();
});
