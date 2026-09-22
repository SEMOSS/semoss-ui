import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { toolCardTriggerId } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbenchProvider } from "./tool-workbench-provider";

const tool: ConversationTool = {
	id: "tool-1",
	name: "search",
	title: "Search",
	arguments: {},
	status: "RUNNING",
};

function Harness() {
	const workbench = useToolWorkbench();
	return (
		<>
			<span data-testid="inline">
				{String(workbench.isToolInline(tool.id))}
			</span>
			<span data-testid="workbench">
				{String(workbench.isOpen && workbench.activeToolId === tool.id)}
			</span>
			<span data-testid="mode">
				{workbench.getToolDisplayMode(tool.id)}
			</span>
			<button id={toolCardTriggerId(tool.id)} type="button">
				Transcript tool
			</button>
			<button type="button" onClick={() => workbench.openInline(tool.id)}>
				Inline
			</button>
			<button
				type="button"
				onClick={() => workbench.openWorkbench(tool.id)}
			>
				Workbench
			</button>
			<button type="button" onClick={workbench.closeWorkbench}>
				Hide workbench
			</button>
			<button type="button" onClick={() => workbench.closeTool(tool.id)}>
				Close tool
			</button>
		</>
	);
}

describe("ToolWorkbenchProvider", () => {
	it("moves a tool between hidden, inline, and workbench without duplication", async () => {
		render(
			<ToolWorkbenchProvider
				roomId="room-1"
				tools={{ [tool.id]: tool }}
				pendingActions={[]}
				onDecideAction={vi.fn()}
			>
				<Harness />
			</ToolWorkbenchProvider>,
		);

		expect(screen.getByTestId("inline").textContent).toBe("false");
		expect(screen.getByTestId("workbench").textContent).toBe("false");
		expect(screen.getByTestId("mode").textContent).toBe("hidden");

		fireEvent.click(screen.getByRole("button", { name: "Inline" }));
		expect(screen.getByTestId("inline").textContent).toBe("true");
		expect(screen.getByTestId("workbench").textContent).toBe("false");
		expect(screen.getByTestId("mode").textContent).toBe("inline");
		await waitFor(() =>
			expect(document.activeElement?.textContent).toBe("Transcript tool"),
		);

		fireEvent.click(screen.getByRole("button", { name: "Workbench" }));
		expect(screen.getByTestId("inline").textContent).toBe("false");
		expect(screen.getByTestId("workbench").textContent).toBe("true");
		expect(screen.getByTestId("mode").textContent).toBe("workbench");

		fireEvent.click(screen.getByRole("button", { name: "Hide workbench" }));
		expect(screen.getByTestId("workbench").textContent).toBe("false");
		// Hiding the dock keeps its tabs and their per-tool placement.
		expect(screen.getByTestId("mode").textContent).toBe("workbench");

		fireEvent.click(screen.getByRole("button", { name: "Workbench" }));
		expect(screen.getByTestId("workbench").textContent).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
		expect(screen.getByTestId("inline").textContent).toBe("false");
		expect(screen.getByTestId("workbench").textContent).toBe("false");
		expect(screen.getByTestId("mode").textContent).toBe("hidden");
	});
});
