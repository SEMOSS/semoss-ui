import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { CollaborationState } from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { StyleSettings } from "./style-settings";

const learning = vi.hoisted(() => ({
	isLearning: false,
	step: "",
	error: null as string | null,
	start: vi.fn(async () => {}),
}));

const saveStyleNow = vi.hoisted(() => vi.fn());
const insight = vi.hoisted(() => ({ actions: {} }));

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
vi.mock("../live/style-api", () => ({ saveStyleNow }));
vi.mock("../live/use-style-learning", () => ({
	useStyleLearning: () => learning,
}));

function stateWithProposal(): CollaborationState {
	const base = createInitialCollaborationState();
	return {
		...base,
		liveProfile: {
			...base.profile,
			id: "me",
			style: {
				summary: "",
				source: "learned",
				confirmed: false,
				examples: [],
				variants: {},
				pending: {
					summary: "Short and friendly.",
					examples: ["Thanks, will do."],
					variants: {
						internal: {
							summary: "Casual with first names.",
							examples: [],
						},
					},
					learnedAt: "2026-10-29T10:00:00.000Z",
					sample: { emails: 12, chats: 3, windowDays: 30 },
				},
			},
		},
	};
}

function Harness() {
	const { state } = useCollaborationSession();
	const profile = state.liveProfile;
	if (!profile) return null;
	return (
		<>
			<StyleSettings profile={profile} />
			<output aria-label="Saved style">
				{JSON.stringify(profile.style)}
			</output>
		</>
	);
}

function confirmedState(): CollaborationState {
	const state = stateWithProposal();
	if (!state.liveProfile) throw new Error("Expected a live profile");
	state.liveProfile.style = {
		summary: "Short and friendly.",
		source: "you",
		confirmed: true,
		examples: [],
		variants: {},
		pending: null,
	};
	return state;
}

function renderSettings(initialState = stateWithProposal()) {
	render(
		<CollaborationSessionProvider initialState={initialState}>
			<Harness />
		</CollaborationSessionProvider>,
	);
}

const readJson = (label: string) =>
	JSON.parse(screen.getByLabelText(label).textContent ?? "null");

beforeEach(() => {
	// the server answers with the style it was sent
	saveStyleNow.mockImplementation(
		async (_actions: unknown, style: Record<string, unknown>) => ({
			pending: null,
			...style,
		}),
	);
});

afterEach(() => {
	cleanup();
	saveStyleNow.mockReset();
	learning.isLearning = false;
	learning.error = null;
	learning.start.mockClear();
});

describe("StyleSettings", () => {
	it("shows a proposal for review", () => {
		renderSettings();
		expect(
			screen.getByRole("button", { name: "Confirm this style" }),
		).toBeTruthy();
		expect(screen.getByText(/Learned from 12 sent emails/)).toBeTruthy();
		expect(readJson("Saved style").confirmed).toBe(false);
	});

	it("confirming the edited proposal keeps only the agreed style", async () => {
		const user = userEvent.setup();
		renderSettings();
		const summary = screen.getByRole("textbox", { name: "How you write" });
		await user.clear(summary);
		await user.type(summary, "Brief and warm.");
		await user.click(
			screen.getByRole("button", { name: "Confirm this style" }),
		);
		await waitFor(() =>
			expect(readJson("Saved style").confirmed).toBe(true),
		);
		const saved = readJson("Saved style");
		expect(saved.summary).toBe("Brief and warm.");
		expect(saved.source).toBe("learned");
		expect(saved.examples).toEqual(["Thanks, will do."]);
		expect(saved.variants.internal.summary).toBe(
			"Casual with first names.",
		);
		expect(saved.pending).toBeNull();
	});

	it("removing an example drops it from the confirmed style", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.click(
			screen.getByRole("button", { name: "Remove example 1" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Confirm this style" }),
		);
		await waitFor(() =>
			expect(readJson("Saved style").confirmed).toBe(true),
		);
		expect(readJson("Saved style").examples).toEqual([]);
	});

	it("discarding the proposal retains nothing from it", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.click(
			screen.getByRole("button", { name: "Discard proposal" }),
		);
		await waitFor(() => expect(readJson("Saved style").pending).toBeNull());
		const saved = readJson("Saved style");
		expect(saved.summary).toBe("");
		expect(saved.confirmed).toBe(false);
		expect(saved.examples).toEqual([]);
		expect(saved.variants).toEqual({});
		expect(screen.getByText(/Not confirmed yet/)).toBeTruthy();
	});

	it("starts learning from the button and shows progress and failures", async () => {
		const user = userEvent.setup();
		learning.error = "No text model is set";
		renderSettings();
		expect(screen.getByRole("alert").textContent).toContain(
			"No text model is set",
		);
		await user.click(
			screen.getByRole("button", { name: "Learn again from my writing" }),
		);
		expect(learning.start).toHaveBeenCalledTimes(1);
	});

	it("saves a style made only of an audience variant", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.clear(
			screen.getByRole("textbox", { name: "How you write" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Confirm this style" }),
		);
		await waitFor(() =>
			expect(readJson("Saved style").confirmed).toBe(true),
		);
		const saved = readJson("Saved style");
		expect(saved.summary).toBe("");
		expect(saved.variants.internal.summary).toBe(
			"Casual with first names.",
		);
	});

	it("resets the whole style after confirmation", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.click(screen.getByRole("button", { name: "Reset style" }));
		const dialog = await screen.findByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: "Reset style" }),
		);
		await waitFor(() => expect(readJson("Saved style").pending).toBeNull());
		expect(readJson("Saved style")).toMatchObject({
			summary: "",
			confirmed: false,
			examples: [],
			variants: {},
		});
		expect(screen.getByText(/Not confirmed yet/)).toBeTruthy();
	});

	it("keeps the style when the reset is cancelled", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.click(screen.getByRole("button", { name: "Reset style" }));
		const dialog = await screen.findByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);
		expect(readJson("Saved style").pending.summary).toBe(
			"Short and friendly.",
		);
	});

	it("treats saving an emptied confirmed style as a reset", async () => {
		const user = userEvent.setup();
		renderSettings(confirmedState());
		await user.clear(
			screen.getByRole("textbox", { name: "How you write" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Save and confirm style" }),
		);
		await waitFor(() =>
			expect(readJson("Saved style").confirmed).toBe(false),
		);
		expect(readJson("Saved style").examples).toEqual([]);
	});

	it("sends the whole style when confirming and shows the saved result", async () => {
		const user = userEvent.setup();
		renderSettings();
		await user.click(
			screen.getByRole("button", { name: "Confirm this style" }),
		);
		await waitFor(() => expect(saveStyleNow).toHaveBeenCalledTimes(1));
		expect(saveStyleNow.mock.calls[0][1]).toEqual({
			summary: "Short and friendly.",
			source: "learned",
			confirmed: true,
			examples: ["Thanks, will do."],
			variants: {
				internal: { summary: "Casual with first names.", examples: [] },
			},
			pending: null,
		});
	});

	it("keeps the proposal and the owner's edits when the save fails", async () => {
		const user = userEvent.setup();
		saveStyleNow.mockRejectedValue(new Error("Server unavailable"));
		renderSettings();
		const summary = screen.getByRole("textbox", { name: "How you write" });
		await user.clear(summary);
		await user.type(summary, "My edit");
		await user.click(
			screen.getByRole("button", { name: "Confirm this style" }),
		);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Server unavailable",
		);
		expect(readJson("Saved style").confirmed).toBe(false);
		expect(readJson("Saved style").pending.summary).toBe(
			"Short and friendly.",
		);
		expect(
			(
				screen.getByRole("textbox", {
					name: "How you write",
				}) as HTMLTextAreaElement
			).value,
		).toBe("My edit");
	});

	it("shows a failed reset instead of reporting success", async () => {
		const user = userEvent.setup();
		saveStyleNow.mockRejectedValue(new Error("Server unavailable"));
		renderSettings();
		await user.click(screen.getByRole("button", { name: "Reset style" }));
		const dialog = await screen.findByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: "Reset style" }),
		);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Server unavailable",
		);
		expect(readJson("Saved style").pending.summary).toBe(
			"Short and friendly.",
		);
	});
});
