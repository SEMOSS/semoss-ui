import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { PersonaPage } from "./persona.page";
import { PersonaInterviewPage } from "./persona-interview.page";
import { TwinPersonaPage } from "./twin-persona.page";
import { TwinPersonaInterviewPage } from "./twin-persona-interview.page";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkTwinPersonaInterview(")
						? { phase: "none" }
						: {
								exists: true,
								sections: {
									short: "",
									voice: "Direct.",
									decide: "",
									review: "",
									stands: "",
									people: "",
									limits: "",
									examples: "",
								},
								offTwins: [],
							},
					operationType: ["OPERATION"],
				},
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));

afterEach(cleanup);

it("opens the persona with the way back to Digital Twins from there only, and its interview behind the same door", async () => {
	render(
		<MemoryRouter>
			<TwinPersonaPage />
		</MemoryRouter>,
	);
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	expect(screen.getByRole("link", { name: "Digital Twins" })).toHaveAttribute(
		"href",
		"/twins",
	);

	cleanup();
	render(
		<MemoryRouter>
			<PersonaPage />
		</MemoryRouter>,
	);
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toHaveAttribute("href", "/persona/interview");
	expect(screen.queryByRole("link", { name: "Digital Twins" })).toBeNull();
});

it("leads back from the interview to the persona page it was opened from", async () => {
	render(
		<MemoryRouter>
			<TwinPersonaInterviewPage />
		</MemoryRouter>,
	);
	await screen.findByText("May I read how you write?");
	expect(screen.getByRole("link", { name: "Your persona" })).toHaveAttribute(
		"href",
		"/twins/persona",
	);

	cleanup();
	render(
		<MemoryRouter>
			<PersonaInterviewPage />
		</MemoryRouter>,
	);
	await screen.findByText("May I read how you write?");
	expect(screen.getByRole("link", { name: "Your persona" })).toHaveAttribute(
		"href",
		"/persona",
	);
});

it("starts the interview page over when the address asks to go on with one that was wrapped up, behind either door", async () => {
	for (const [Page, path] of [
		[PersonaInterviewPage, "/persona/interview"],
		[TwinPersonaInterviewPage, "/twins/persona/interview"],
	] as const) {
		const router = createMemoryRouter([{ path, Component: Page }], {
			initialEntries: [path],
		});
		render(<RouterProvider router={router} />);
		await screen.findByText("May I read how you write?");
		const before = screen.getByRole("link", { name: "Your persona" });
		await act(() => router.navigate(`${path}?go=more`));
		await screen.findByText("May I read how you write?");
		// a new page, with nothing left on it from the visit before
		expect(screen.getByRole("link", { name: "Your persona" })).not.toBe(
			before,
		);
		expect(insight.actions.run).toHaveBeenLastCalledWith(
			"WorkTwinPersonaInterview(wrap=[false]);",
		);
		cleanup();
	}
});
