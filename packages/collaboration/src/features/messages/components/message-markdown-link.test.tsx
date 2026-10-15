import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFilePanelType } from "@semoss/panels";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { animationClock } from "../test-utils/animation-clock";
import { MessageMarkdown } from "./message-markdown";

const captured: { workbench?: ReturnType<typeof useToolWorkbench> } = {};

function WorkbenchControls() {
	const workbench = useToolWorkbench();
	captured.workbench = workbench;
	return workbench.isOpen ? (
		<button type="button" onClick={workbench.closeWorkbench}>
			Back to conversation
		</button>
	) : null;
}

function view(text: string, insightId = "insight-1") {
	return (
		<ToolWorkbenchProvider
			roomId="room-1"
			insightId={insightId}
			tools={{}}
			pendingApprovals={[]}
			onApproveTool={vi.fn()}
			onRejectTool={vi.fn()}
		>
			<MessageMarkdown text={text} isStreaming={false} />
			<WorkbenchControls />
		</ToolWorkbenchProvider>
	);
}

function selectedPanel() {
	const layout = captured.workbench?.store.getState().layout;
	return layout?.selection.panel
		? layout.panels[layout.selection.panel]
		: undefined;
}

beforeEach(() => {
	captured.workbench = undefined;
	vi.stubGlobal(
		"matchMedia",
		vi.fn((media: string) => ({
			matches: false,
			media,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it.each(["docx", "xlsx", "pdf", "txt", "pptx"])(
	"opens a nested encoded %s filename in the current room's file panel",
	async (extension) => {
		const filename = `Résumé final.${extension}`;
		render(
			view(
				`[${filename}](room://outputs/${encodeURIComponent(filename)})`,
			),
		);
		await userEvent.click(
			screen.getByRole("button", {
				name: `${filename} (open room file)`,
			}),
		);
		expect(screen.getByText("Back to conversation")).toBeVisible();
		expect(selectedPanel()).toMatchObject({
			type: getFilePanelType(filename),
			config: {
				path: `/outputs/${filename}`,
				name: filename,
				mode: { type: "INSIGHT", insightId: "insight-1" },
			},
		});
		expect(selectedPanel()?.config).not.toHaveProperty("isolated");
	},
);

it("uses the rebound room insight for restored links", async () => {
	const text = "[summary.docx](room://summary.docx)";
	const { rerender } = render(view(text));
	await userEvent.click(screen.getByRole("button", { name: /summary.docx/ }));
	rerender(view(text, "insight-2"));
	await waitFor(() =>
		expect(selectedPanel()?.config?.mode).toEqual({
			type: "INSIGHT",
			insightId: "insight-2",
		}),
	);
	await userEvent.click(screen.getByRole("button", { name: /summary.docx/ }));
	const panels = Object.values(
		captured.workbench?.store.getState().layout.panels ?? {},
	).filter((panel) => panel.config?.path === "/summary.docx");
	expect(panels).toHaveLength(1);
});

it("supports keyboard activation and returns focus after closing the file dock", async () => {
	const clock = animationClock();
	const user = userEvent.setup();
	render(view("[summary.docx](room://summary.docx)"));
	await user.tab();
	const file = screen.getByRole("button", { name: /summary.docx/ });
	expect(file).toHaveFocus();
	await user.keyboard("{Enter}");
	expect(selectedPanel()?.config?.path).toBe("/summary.docx");
	await user.click(
		screen.getByRole("button", { name: "Back to conversation" }),
	);
	clock.advance(16);
	expect(file).toHaveFocus();
});

it.each([
	"room://../outside.docx",
	"room://%2e%2e/outside.docx",
	"room:///outside.docx",
	"room://folder/%2Foutside.docx",
	"room://folder%5Coutside.docx",
	"room://C:/outside.docx",
	"room://summary.docx?insightId=other",
	"room://summary.docx#fragment",
	"room://bad%zz.docx",
	"room://bad%00.docx",
	"room://folder/",
	"javascript:alert(1)",
	"room-download://summary.docx",
])("leaves an invalid or unsupported file link inert: %s", (href) => {
	render(view(`[File](<${href}>)`));
	expect(screen.getByText("File")).toBeVisible();
	expect(screen.queryByRole("link")).toBeNull();
	expect(screen.queryByRole("button")).toBeNull();
});

it("keeps external and relative anchors and does not use room URLs as image sources", () => {
	render(
		view(
			"[Web](https://example.com/report) [Email](mailto:reader@example.com) [Section](#summary) [Relative](/help) ![Preview](room://summary.png)",
		),
	);
	expect(screen.getByRole("link", { name: "Web" })).toHaveAttribute(
		"href",
		"https://example.com/report",
	);
	expect(screen.getByRole("link", { name: "Web" })).toHaveAttribute(
		"rel",
		"noopener noreferrer",
	);
	expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
		"href",
		"mailto:reader@example.com",
	);
	expect(screen.getByRole("link", { name: "Section" })).toHaveAttribute(
		"href",
		"#summary",
	);
	expect(screen.getByRole("link", { name: "Relative" })).toHaveAttribute(
		"href",
		"/help",
	);
	expect(screen.getByAltText("Preview").getAttribute("src")).toBeFalsy();
});

it("renders safely without a room workbench", () => {
	render(
		<MessageMarkdown
			text="[summary.docx](room://summary.docx)"
			isStreaming={false}
		/>,
	);
	expect(screen.getByText("summary.docx")).toBeVisible();
	expect(screen.queryByRole("button")).toBeNull();
});
