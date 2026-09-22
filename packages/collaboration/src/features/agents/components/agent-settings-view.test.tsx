import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Agent } from "@/types/agent";
import { AgentSettings } from "./agent-settings-view";

const agent: Agent = {
	id: "draft-1",
	name: "Research agent",
	role: "",
	type: "Individual",
	icon: "compass",
	tone: "green",
	workspace: "Conversation",
	instructions: "Research carefully",
	skills: [],
	skillIds: [],
	databases: [],
	dataProducts: [],
	members: [],
	depth: 0,
	concurrency: 2,
	spawn: false,
	triggers: [],
};

describe("AgentSettings submission", () => {
	it("keeps the draft after a failed save and disables mutations while saving", async () => {
		const user = userEvent.setup();
		let rejectSave: (cause: Error) => void = () => undefined;
		const pending = new Promise<void>((_resolve, reject) => {
			rejectSave = reject;
		});
		const onSave = vi
			.fn()
			.mockReturnValueOnce(pending)
			.mockResolvedValueOnce(undefined);
		const onClose = vi.fn();
		const existingDescription = `  ${"Existing description. ".repeat(6)} `;
		render(
			<AgentSettings
				agent={{ ...agent, role: existingDescription }}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={onClose}
			/>,
		);
		await user.clear(
			screen.getByRole("textbox", { name: "Name (required)" }),
		);
		await user.type(
			screen.getByRole("textbox", { name: "Name (required)" }),
			"Updated agent",
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ role: existingDescription }),
		);
		expect(
			screen.getByRole("textbox", { name: "Name (required)" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Team" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Team" }));
		expect(
			screen.getByRole("spinbutton", { name: "Maximum spawn level" }),
		).toBeDisabled();
		await user.click(screen.getByRole("button", { name: "Profile" }));
		await act(async () => rejectSave(new Error("Settings failed")));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Settings failed",
		);
		expect(
			screen.getByRole("textbox", { name: "Name (required)" }),
		).toHaveValue("Updated agent");
		expect(onClose).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
	});

	it("keeps distinct skill ids when display names match", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AgentSettings
				agent={agent}
				agents={[]}
				skillOptions={[
					{ name: "Analysis", value: "skill-1", detail: "skill-1" },
					{ name: "Analysis", value: "skill-2", detail: "skill-2" },
				]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Capabilities" }));
		await user.click(
			screen.getByRole("checkbox", { name: "Analysis skill-2" }),
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					skillIds: ["skill-2"],
					skills: ["Analysis"],
				}),
			),
		);
	});

	it("rejects names the creation reactor cannot accept before calling save", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		render(
			<AgentSettings
				agent={{ ...agent, name: "123 Invalid" }}
				agents={[]}
				skillOptions={[]}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		await waitFor(() =>
			expect(
				screen
					.getAllByRole("alert")
					.some((alert) =>
						alert.textContent?.includes(
							"Start the name with a letter",
						),
					),
			).toBe(true),
		);
		expect(onSave).not.toHaveBeenCalled();
	});

	it.each(["Individual", "Team"] as const)(
		"allows optional team settings for an agent previously marked %s",
		async (type) => {
			const user = userEvent.setup();
			const onSave = vi.fn().mockResolvedValue(undefined);
			render(
				<AgentSettings
					agent={{ ...agent, type, concurrency: 10 }}
					agents={[]}
					skillOptions={[]}
					onSave={onSave}
					onClose={vi.fn()}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Team" }));
			const depth = screen.getByRole("spinbutton", {
				name: "Maximum spawn level",
			});
			await user.clear(depth);
			await user.type(depth, "4");
			const nesting = screen.getByRole("switch", {
				name: /Allow helpers to spawn subagents/,
			});
			expect(nesting).toBeChecked();
			await user.click(nesting);
			expect(depth).toHaveValue(1);
			await user.click(
				screen.getByRole("button", { name: "Save agent" }),
			);
			await waitFor(() =>
				expect(onSave).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "Individual",
						members: [],
						depth: 1,
						spawn: false,
						concurrency: 10,
					}),
				),
			);
		},
	);
});
