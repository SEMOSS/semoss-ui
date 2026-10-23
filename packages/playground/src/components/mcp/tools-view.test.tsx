import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ToolViewProvider } from "@semoss/shared";
import type { RoomStore } from "@/stores/room/room.store";
import { ToolsView } from "./tools-view";

const pixel = vi.hoisted(() =>
	vi.fn(() => ({ status: "SUCCESS", data: { project_type: "CODE" } })),
);
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	usePixel: pixel,
}));
vi.mock("./tools-default-view", () => ({
	ToolsDefaultView: () => <span>Generic view</span>,
}));
vi.mock("@/features/tool-views/component-tool-view", () => ({
	ComponentToolView: () => <span>Native view</span>,
}));

function draw(ui: unknown, name = "RenamedTool") {
	const room = {
		roomId: "room",
		getTool: () => ({
			status: "SUCCESS",
			response: "Completed",
			parameters: {},
			json: {
				id: "call",
				name,
				_meta: { SMSS_MCP_EXECUTION: "auto", SMSS_MCP_UI: ui },
			},
		}),
	} as unknown as RoomStore;
	return render(
		<ToolViewProvider
			libraries={{ organization: { "mail-compose": () => null } }}
		>
			<ToolsView
				room={room}
				app="project"
				message="message"
				toolId="call"
			/>
		</ToolViewProvider>,
	);
}

beforeEach(() => pixel.mockClear());
afterEach(cleanup);

it("selects a registered flat URI independently of the tool name without looking up a project", () => {
	draw({
		resourceURI: "component://mail-compose?provider=google&intent=send",
	});
	expect(screen.getByText("Native view")).toBeVisible();
	expect(pixel).toHaveBeenCalledWith("", expect.any(Object));
	expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
});

it.each([
	undefined,
	null,
	{},
	{ component: "mail-compose" },
	{ resourceURI: 123 },
	{ resourceURI: "" },
	{ resourceURI: "component://unknown" },
	{ resourceURI: "component://mail/compose" },
	{ resourceURI: "component:/mail-compose" },
	{ resourceURI: " COMPONENT://mail-compose/ " },
])(
	"uses the generic view without project or iframe routing for missing and invalid resources %j",
	(ui) => {
		draw(ui, "GoogleGmailSendMail");
		expect(screen.getByText("Generic view")).toBeVisible();
		expect(pixel).toHaveBeenCalledWith("", expect.any(Object));
		expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
	},
);

it("keeps explicit system resources in their sibling app without a project lookup", () => {
	draw({ resourceURI: "system://automation/review" });
	expect(screen.getByTitle("Tool")).toHaveAttribute(
		"src",
		"../../automation/dist/review",
	);
	expect(pixel).toHaveBeenCalledWith("", expect.any(Object));
});

it("keeps explicit portal resources routed through their project's metadata", () => {
	draw({ resourceURI: "/review.html" });
	expect(pixel).toHaveBeenCalledWith(
		'ProjectInfo(project=["project"]);',
		expect.any(Object),
	);
	expect(screen.getByTitle("Tool").getAttribute("src")).toMatch(
		/\/public_home\/project\/portals\/review.html$/,
	);
});
