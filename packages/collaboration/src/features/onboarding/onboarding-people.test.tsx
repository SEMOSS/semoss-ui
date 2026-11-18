import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { PeopleStep } from "./onboarding-steps";
import { deferred } from "./topic-review.test-fixtures";

const person = {
	id: "person-1",
	name: "Ana Lima",
	email: "ana@example.com",
	relationship: "colleague",
	follow: "following",
	strength: 80,
	vip: true,
};

const automated = {
	id: "automated-1",
	name: "Platform Notifications",
	email: "notifications@example.com",
	relationship: "automated",
	automated: true,
	strength: 90,
};

const owner = {
	id: "owner-1",
	name: "Owner",
	email: "owner@example.com",
	relationship: "self",
};

function session({
	hasAutomated = true,
	failCorrection = false,
	selfEmail = "owner@example.com",
	search,
}: {
	hasAutomated?: boolean;
	failCorrection?: boolean;
	selfEmail?: string;
	/** Answers a people search by its query. */
	search?: (query: string) => Promise<unknown[]>;
} = {}) {
	const run = vi.fn(async (statement: string) => {
		let output: Record<string, unknown>;
		if (statement.startsWith("BrainListPeople(")) {
			const query = statement.match(/query=\["([^"]*)"\]/)?.[1];
			output = {
				items:
					query !== undefined
						? ((await search?.(query)) ?? [])
						: statement.includes('relationship=["self"]')
							? [owner]
							: statement.includes('relationship=["automated"]')
								? hasAutomated
									? [automated]
									: []
								: statement.includes('follow=["suggested"]')
									? []
									: [person],
			};
		} else if (statement.startsWith("BrainSavePerson(")) {
			if (failCorrection) throw new Error("Unable to update sender");
			output = {};
		} else {
			throw new Error(`Unexpected request: ${statement}`);
		}
		return { pixelReturn: [{ output, operationType: ["MAP"] }] };
	});
	const actions = { run } as unknown as InsightActions;
	render(
		<PeopleStep
			actions={actions}
			eyebrow="Step 4 of 8"
			onNext={vi.fn()}
			selfEmail={selfEmail}
			managerId="person-1"
		/>,
	);
	return { run };
}

afterEach(cleanup);

describe("onboarding people", () => {
	it("explains ignored senders without opening the list", async () => {
		session();
		const review = await screen.findByRole("button", {
			name: "Review ignored senders (1)",
		});
		expect(review).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.getByText(
				"Automated and mailing-list senders are ignored by default.",
			),
		).toBeVisible();
		expect(
			screen.getByText(/Nothing is deleted from your mailbox/),
		).toBeVisible();
		expect(screen.getByText("Platform Notifications")).not.toBeVisible();
		expect(screen.getByText("Ana Lima")).toBeVisible();
	});

	it("labels ignored senders and lets keyboard users review and collapse the list", async () => {
		session();
		const user = userEvent.setup();
		const review = await screen.findByRole("button", {
			name: "Review ignored senders (1)",
		});
		review.focus();
		await user.keyboard("{Enter}");
		expect(review).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText("Ignored")).toBeVisible();
		expect(screen.getByText("notifications@example.com")).toBeVisible();
		expect(
			screen.getByText(
				/Sender typing is separate from your keep-out rules/,
			),
		).toBeVisible();
		expect(
			screen.getByRole("button", {
				name: "Treat as person: Platform Notifications",
			}),
		).toBeVisible();
		await user.keyboard(" ");
		expect(review).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByText("Ignored")).not.toBeVisible();
	});

	it("corrects a sender into a followed person without making them a VIP", async () => {
		const { run } = session();
		const user = userEvent.setup();
		await user.click(
			await screen.findByRole("button", {
				name: "Review ignored senders (1)",
			}),
		);
		await user.click(
			screen.getByRole("button", {
				name: "Treat as person: Platform Notifications",
			}),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("button", {
					name: /Review ignored senders/,
				}),
			).not.toBeInTheDocument(),
		);
		expect(run).toHaveBeenCalledWith(
			'BrainSavePerson(person=[{"id":"automated-1","relationship":"colleague"}]);',
		);
		const row = screen.getByText("Platform Notifications").closest("li");
		if (!row) throw new Error("Corrected person's row not found");
		expect(
			within(row).getByRole("button", { name: "Following" }),
		).toHaveAttribute("aria-pressed", "true");
		expect(
			within(row).getByRole("button", {
				name: "Platform Notifications is a VIP",
			}),
		).toHaveAttribute("aria-pressed", "false");
	});

	it("keeps a sender ignored if the correction fails", async () => {
		session({ failCorrection: true });
		const user = userEvent.setup();
		await user.click(
			await screen.findByRole("button", {
				name: "Review ignored senders (1)",
			}),
		);
		await user.click(
			screen.getByRole("button", {
				name: "Treat as person: Platform Notifications",
			}),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Unable to update sender",
		);
		expect(screen.getByText("Ignored")).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Review ignored senders (1)" }),
		).toHaveAttribute("aria-expanded", "true");
	});

	it("tells a colleague from an outside sender when setup resumed past the mailbox step", async () => {
		// a reload resumes on a later step, so the mailbox step never gave the owner's address
		const { run } = session({ selfEmail: "" });
		const user = userEvent.setup();
		await user.click(
			await screen.findByRole("button", {
				name: "Review ignored senders (1)",
			}),
		);
		await user.click(
			screen.getByRole("button", {
				name: "Treat as person: Platform Notifications",
			}),
		);
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith(
				'BrainSavePerson(person=[{"id":"automated-1","relationship":"colleague"}]);',
			),
		);
	});

	it("shows search results for the latest query only", async () => {
		const older = deferred<unknown[]>();
		const match = (name: string, email: string) => ({
			...person,
			id: email,
			name,
			email,
			follow: null,
			vip: false,
		});
		const { run } = session({
			search: async (query) =>
				query === "ja"
					? older.promise
					: [match("Jamal Reed", "jamal@example.com")],
		});
		const user = userEvent.setup();
		await screen.findByText("Ana Lima");
		const input = screen.getByRole("textbox", {
			name: "Search people to follow",
		});
		await user.type(input, "ja");
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith(
				expect.stringContaining('query=["ja"]'),
			),
		);
		await user.type(input, "m");
		expect(await screen.findByText("Jamal Reed")).toBeVisible();
		await act(async () =>
			older.resolve([match("Jade Old", "jade@example.com")]),
		);
		expect(screen.queryByText("Jade Old")).not.toBeInTheDocument();
		expect(screen.getByText("Jamal Reed")).toBeVisible();
	});

	it("shows the policy but no review control when no automated senders were found", async () => {
		session({ hasAutomated: false });
		await screen.findByText("Ana Lima");
		expect(
			screen.getByText(
				"Automated and mailing-list senders are ignored by default.",
			),
		).toBeVisible();
		expect(
			screen.queryByRole("button", { name: /Review ignored senders/ }),
		).not.toBeInTheDocument();
	});
});
