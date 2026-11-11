import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillsSettings } from "./skills-settings";

// one actions object and one pixel result, as the provider and hook give
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const skills = vi.hoisted(() => ({
	status: "SUCCESS",
	data: null as unknown,
	error: null as Error | null,
	refresh: vi.fn(),
	update: vi.fn(),
}));
const api = vi.hoisted(() => ({ setSkillInAssistant: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => insight,
	usePixel: () => skills,
}));
vi.mock("./skills-api", async (importOriginal) => ({
	...(await importOriginal<typeof import("./skills-api")>()),
	setSkillInAssistant: api.setSkillInAssistant,
}));

const SKILLS = [
	{
		id: "summary",
		name: "Client summary",
		description: "One section per client",
		inAssistant: true,
	},
	{ id: "tone", name: "Email tone", description: null, inAssistant: false },
];

afterEach(cleanup);
beforeEach(() => {
	skills.status = "SUCCESS";
	skills.data = { skills: SKILLS };
	skills.update.mockReset();
	api.setSkillInAssistant.mockReset();
});

describe("Settings > Skills", () => {
	it("turns a skill on for every chat", async () => {
		const user = userEvent.setup();
		render(<SkillsSettings />);
		expect(
			screen.getByRole("switch", {
				name: "Client summary Use in my chats",
			}),
		).toBeChecked();
		const tone = screen.getByRole("switch", {
			name: "Email tone Use in my chats",
		});
		expect(tone).not.toBeChecked();

		api.setSkillInAssistant.mockResolvedValue(undefined);
		await user.click(tone);
		expect(api.setSkillInAssistant).toHaveBeenCalledWith(
			insight.actions,
			"tone",
			true,
		);
		expect(skills.update).toHaveBeenCalledWith({
			skills: [SKILLS[0], { ...SKILLS[1], inAssistant: true }],
		});
	});

	it("says why a change did not save and keeps the list as it was", async () => {
		const user = userEvent.setup();
		render(<SkillsSettings />);
		api.setSkillInAssistant.mockRejectedValue(
			new Error("Pick one of your own skills"),
		);
		await user.click(
			screen.getByRole("switch", {
				name: "Client summary Use in my chats",
			}),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Pick one of your own skills",
		);
		expect(skills.update).not.toHaveBeenCalled();
	});

	it("tells an owner with no skills how to make one", () => {
		skills.data = { skills: [] };
		render(<SkillsSettings />);
		expect(screen.getByText(/No skills yet/)).toBeVisible();
	});
});
