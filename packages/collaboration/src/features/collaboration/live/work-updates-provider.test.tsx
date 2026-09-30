import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { readWorkUpdates } from "./live-state";
import type { LiveSync } from "./live-sync";
import { useWorkUpdates } from "./work-updates.context";
import { WorkUpdatesProvider } from "./work-updates-provider";

vi.mock("./live-state", () => ({ readWorkUpdates: vi.fn() }));
function Harness() {
	const updates = useWorkUpdates();
	const { state, dispatch } = useCollaborationSession();
	const threadId = state.threads[0].id;
	return (
		<>
			<button type="button" onClick={updates?.refresh}>
				Refresh
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "workspace.step",
						threadId,
						operation: "remove",
						step: { id: "local-step-1" },
					})
				}
			>
				Remove
			</button>
			<output>
				{state.workspaces[threadId].steps
					.map((step) => step.text)
					.join(",")}
			</output>
			<p>{updates?.error}</p>
		</>
	);
}
it("deduplicates server echoes, ignores removed actions during a refresh, and releases its listener", async () => {
	const state = createInitialCollaborationState();
	const threadId = state.threads[0].id;
	state.workspaces[threadId].steps = [
		{
			id: "local-step-1",
			text: "Saved reminder",
			ownerId: "me",
			due: null,
			status: "open",
			kind: "task",
			isUserEdited: true,
		},
	];
	const updates = {
		threads: [state.threads[0]],
		items: [],
		workspaces: {
			[threadId]: {
				...state.workspaces[threadId],
				steps: [
					{
						...state.workspaces[threadId].steps[0],
						id: "server-step",
					},
				],
			},
		},
	};
	const sync: LiveSync = Object.assign(vi.fn(), {
		settled: async () => undefined,
		localId: (id: string) => (id === "server-step" ? "local-step-1" : id),
	});
	vi.mocked(readWorkUpdates).mockResolvedValueOnce(updates);
	const view = render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions} sync={sync}>
				<Harness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	fireEvent.click(screen.getByText("Refresh"));
	await waitFor(() => expect(readWorkUpdates).toHaveBeenCalledTimes(1));
	expect(screen.getByRole("status")).toHaveTextContent(/^Saved reminder$/);
	let finish: ((value: typeof updates) => void) | undefined;
	vi.mocked(readWorkUpdates).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	fireEvent.click(screen.getByText("Refresh"));
	await waitFor(() => expect(readWorkUpdates).toHaveBeenCalledTimes(2));
	fireEvent.click(screen.getByText("Refresh"));
	expect(readWorkUpdates).toHaveBeenCalledTimes(2);
	fireEvent.click(screen.getByText("Remove"));
	await act(async () => finish?.(updates));
	expect(screen.getByRole("status")).toBeEmptyDOMElement();
	view.unmount();
	fireEvent(window, new Event("focus"));
	expect(readWorkUpdates).toHaveBeenCalledTimes(2);
});
