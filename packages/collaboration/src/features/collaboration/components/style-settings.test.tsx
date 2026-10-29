import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

function renderSettings() {
	render(
		<CollaborationSessionProvider initialState={stateWithProposal()}>
			<Harness />
		</CollaborationSessionProvider>,
	);
}

const readJson = (label: string) =>
	JSON.parse(screen.getByLabelText(label).textContent ?? "null");

afterEach(() => {
	cleanup();
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
		const summary = screen.getByLabelText("How you write (required)");
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
});
