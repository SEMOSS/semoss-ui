import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { WorkSettingsPanel } from "./work-settings-panel";
import { workSnapshot } from "./work-thread.test-fixtures";
import { WorkThreadContext } from "./work-thread-context";

vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: () => ({ agent: null, isLoading: false, error: null }),
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, error: null }),
}));
vi.mock("./thread-agent-select", () => ({
	ThreadAgentSelect: () => <button type="button">Agent</button>,
}));
vi.mock("@/features/agents/components/capability-picker", () => ({
	CapabilityPicker: () => null,
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => <button type="button">Model</button>,
}));
it("keeps unsaved settings on failure and across hidden panel changes, then retries and resets", async () => {
	const snapshot = workSnapshot();
	const saveSettings = vi
		.fn()
		.mockRejectedValueOnce(new Error("Save unavailable"))
		.mockImplementationOnce(async (_title, values) => {
			snapshot.settings = values;
		});
	const session = {
		saveSettings,
		getSnapshot: () => snapshot,
	} as unknown as ThreadSession;
	const panel = (hidden: boolean) => (
		<WorkThreadContext.Provider
			value={{
				session,
				snapshot,
				title: "Thread",
				contextPanel: {
					context: {
						threadId: "thread",
						contextRevision: "1",
						contextText: "{}",
					},
					submitted: null,
					children: null,
				},
			}}
		>
			<div hidden={hidden}>
				<WorkSettingsPanel />
			</div>
		</WorkThreadContext.Provider>
	);
	const { rerender } = render(panel(false));
	const input = screen.getByRole("textbox", {
		name: "Additional thread instructions",
	});
	fireEvent.change(input, { target: { value: "Use short replies" } });
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Save unavailable",
	);
	expect(input).toHaveValue("Use short replies");
	rerender(panel(true));
	rerender(panel(false));
	expect(input).toHaveValue("Use short replies");
	fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
	fireEvent.change(input, { target: { value: "Discard this edit" } });
	fireEvent.click(screen.getByRole("button", { name: "Reset" }));
	expect(input).toHaveValue("Use short replies");
});
