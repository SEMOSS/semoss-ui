import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { OutsideStep } from "./onboarding-steps";

const people = [
	{
		id: "jane-1",
		name: "Jane Client",
		email: "jane.client@gmail.com",
		relationship: "external",
	},
	{
		id: "ana-1",
		name: "Ana Lima",
		email: "ana@deloitte.com",
		relationship: "colleague",
	},
	{
		id: "sam-1",
		name: "Sam Partner",
		email: "sam@partner.org",
		relationship: "external",
	},
];

function session(
	saveAccount = async (): Promise<Record<string, unknown>> => ({
		id: "account-1",
	}),
) {
	const onNext = vi.fn();
	const run = vi.fn(async (statement: string) => {
		let output: Record<string, unknown>;
		if (statement.startsWith("BrainSuggestAccounts(")) {
			output = { accounts: [] };
		} else if (statement.startsWith("BrainListPeople(")) {
			output = { items: people };
		} else if (statement.startsWith("BrainSaveAccount(")) {
			output = await saveAccount();
		} else if (statement.startsWith("BrainSavePerson(")) {
			output = {};
		} else {
			throw new Error(`Unexpected request: ${statement}`);
		}
		return { pixelReturn: [{ output, operationType: ["MAP"] }] };
	});
	const actions = { run } as unknown as InsightActions;
	render(
		<OutsideStep actions={actions} eyebrow="Step 5 of 8" onNext={onNext} />,
	);
	return { run, onNext };
}

const statements = (run: ReturnType<typeof vi.fn>, reactor: string) =>
	run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.startsWith(reactor));

afterEach(cleanup);

describe("onboarding outside", () => {
	it("keeps one outside person by exact email", async () => {
		const { run, onNext } = session();
		const user = userEvent.setup();
		await screen.findByText("No outside organisations found.");

		await user.type(
			screen.getByLabelText("Outside email to keep"),
			"Jane.Client@gmail.com{Enter}",
		);
		expect(
			await screen.findByRole("button", { name: "Keep Jane Client" }),
		).toHaveAttribute("aria-pressed", "true");

		await user.click(
			screen.getByRole("button", { name: /Keep 1 and continue/ }),
		);
		await waitFor(() => expect(onNext).toHaveBeenCalled());
		expect(statements(run, "BrainSaveAccount(")).toHaveLength(1);
		const [save] = statements(run, "BrainSavePerson(");
		expect(save).toContain("jane-1");
		expect(save).toContain("account-1");
		expect(save).toContain("following");
	});

	it("turns away colleagues and unknown addresses", async () => {
		const { run } = session();
		const user = userEvent.setup();
		await screen.findByText("No outside organisations found.");
		const input = screen.getByLabelText("Outside email to keep");

		await user.type(input, "ana@deloitte.com{Enter}");
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"is in your organization",
		);

		await user.clear(input);
		await user.type(input, "nobody@acme.com{Enter}");
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"No one with nobody@acme.com",
		);
		expect(
			screen.queryByRole("button", { name: /^Keep Ana/ }),
		).not.toBeInTheDocument();
		expect(statements(run, "BrainSaveAccount(")).toHaveLength(0);
	});

	it("gives each kept person one organization when Keep is retried after a failure", async () => {
		let made = 0;
		const { run, onNext } = session(async () => {
			made += 1;
			if (made === 2) throw new Error("Connection lost");
			return { id: `account-${made}` };
		});
		const user = userEvent.setup();
		await screen.findByText("No outside organisations found.");
		const input = screen.getByLabelText("Outside email to keep");
		await user.type(input, "jane.client@gmail.com{Enter}");
		await screen.findByRole("button", { name: "Keep Jane Client" });
		await user.type(input, "sam@partner.org{Enter}");
		await screen.findByRole("button", { name: "Keep Sam Partner" });

		const keep = screen.getByRole("button", {
			name: /Keep 2 and continue/,
		});
		await user.click(keep);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost",
		);
		await user.click(keep);
		await waitFor(() => expect(onNext).toHaveBeenCalled());
		// Jane was kept before the failure, so only Sam is saved again
		expect(statements(run, "BrainSaveAccount(")).toHaveLength(3);
		expect(
			statements(run, "BrainSavePerson(").filter((save) =>
				save.includes("jane-1"),
			),
		).toHaveLength(1);
	});
});
