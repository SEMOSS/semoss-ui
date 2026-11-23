import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { Form, useForm } from "@semoss/ui/next";
import type { TwinPersona } from "./persona/api/persona";
import { TwinProfilePersona } from "./twin-profile-persona";

const persona: TwinPersona = {
	exists: true,
	sections: {
		short: " ",
		voice: "Plainspoken and curious.",
		decide: "Decide together.",
		review: "",
		stands: "",
		people: "",
		limits: "",
		examples: "",
	},
	offTwins: [],
};

function Profile({ value }: { value: TwinPersona | null }) {
	const form = useForm({ defaultValues: { usePersona: false } });
	return (
		<MemoryRouter>
			<Form form={form} onSubmit={() => undefined}>
				<TwinProfilePersona
					persona={value}
					hasPersona={value?.exists === true}
				/>
			</Form>
		</MemoryRouter>
	);
}
afterEach(cleanup);

it("previews the first filled section even when the twin's use of the persona is off", () => {
	render(<Profile value={persona} />);
	expect(screen.getByText("Plainspoken and curious.")).toBeVisible();
	expect(screen.queryByText("Decide together.")).toBeNull();
	expect(
		screen.getByRole("switch", { name: "Use my persona" }),
	).not.toBeChecked();
	expect(
		screen.getByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/twins/persona");
});

it("resumes an unfinished interview and keeps a failed read separate from that state", () => {
	const { rerender } = render(
		<Profile
			value={{
				...persona,
				exists: false,
				interview: { answered: 2, of: 6, wrapped: false, done: false },
			}}
		/>,
	);
	expect(
		screen.getByRole("link", { name: "Continue the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	expect(screen.queryByRole("switch")).toBeNull();
	rerender(<Profile value={null} />);
	expect(screen.getByText(/couldn’t be loaded/)).toBeVisible();
	expect(
		screen.getByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/twins/persona");
	expect(screen.queryByRole("switch")).toBeNull();
});
