import { act, fireEvent, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { WorkComposerSession } from "./work-composer-session";
import {
	useWorkComposerSession,
	WorkComposerStateProvider,
} from "./work-composer-state.context";

const owner = vi.hoisted(() => ({ insightId: "app-one" }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => owner }));

function ThreadProbe({ id }: { id: string }) {
	const session = useWorkComposerSession(id);
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
	);
	return (
		<>
			<output>{snapshot.mode ?? "fresh"}</output>
			<button type="button" onClick={() => session.setMode("draft")}>
				Open draft
			</button>
		</>
	);
}

it("retains thread choices beyond idle insight eviction and resets at the app boundary", () => {
	owner.insightId = "app-one";
	const view = (id: string) => (
		<WorkComposerStateProvider>
			<ThreadProbe key={id} id={id} />
		</WorkComposerStateProvider>
	);
	const { rerender, unmount } = render(view("original"));
	fireEvent.click(screen.getByRole("button", { name: "Open draft" }));
	for (let index = 0; index < 20; index++) {
		rerender(view(`other-${index}`));
		expect(screen.getByText("fresh")).toBeVisible();
	}
	// The UI store has no dependency on the 12-idle-insight cache.
	rerender(view("original"));
	expect(screen.getByText("draft")).toBeVisible();
	owner.insightId = "another-owner";
	rerender(view("original"));
	expect(screen.getByText("fresh")).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Open draft" }));
	unmount();
	render(view("original"));
	expect(screen.getByText("fresh")).toBeVisible();
});

it("keeps content and attachments during submission and ignores stale editor writes after success", async () => {
	const session = new WorkComposerSession();
	const file = new File(["data"], "notes.txt");
	const draft = { document: null, text: "Pending reply", files: [file] };
	session.setDraft(0, draft);
	session.setSelected(["source-file"]);
	let finish: () => void = () => undefined;
	const result = session.submit(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	expect(session.getSnapshot()).toMatchObject({
		draft,
		selected: ["source-file"],
		isSubmitting: true,
	});
	await expect(session.submit(async () => undefined)).rejects.toThrow(
		"already being submitted",
	);
	await act(async () => {
		finish();
		await result;
	});
	session.setDraft(0, draft);
	expect(session.getSnapshot()).toMatchObject({
		draft: { text: "", files: [] },
		selected: [],
		isSubmitting: false,
	});
});

it("clears a reconciled submission once, including reconciliation while the route was closed", () => {
	const session = new WorkComposerSession();
	const chat = {} as ThreadSession;
	session.reconcile(chat, 0);
	session.setDraft(0, {
		document: null,
		text: "Uncertain message",
		files: [],
	});
	session.reconcile(chat, 1);
	expect(session.getSnapshot().draft.text).toBe("");
	session.setDraft(1, { document: null, text: "Next message", files: [] });
	session.reconcile(chat, 1);
	expect(session.getSnapshot().draft.text).toBe("Next message");
	// A recreated backend session starts its own reconciliation counter.
	session.reconcile({} as ThreadSession, 0);
	expect(session.getSnapshot().draft.text).toBe("Next message");
});
