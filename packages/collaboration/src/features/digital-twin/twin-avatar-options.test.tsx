import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TwinAvatarOption } from "./api/digital-twin";
import { TwinAvatarOptions } from "./twin-avatar-options";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const generate = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("./api/digital-twin", async (importOriginal) => ({
	...(await importOriginal<typeof import("./api/digital-twin")>()),
	generateTwinAvatar: generate,
}));

/** The nth option the server makes in a test, each its own file. */
let made: TwinAvatarOption[];
const option = (): TwinAvatarOption => {
	const next = {
		file: new File([`picture ${made.length + 1}`], "avatar.png", {
			type: "image/png",
		}),
		url: `data:image/png;base64,${made.length + 1}`,
	};
	made.push(next);
	return next;
};

beforeEach(() => {
	made = [];
	generate.mockReset();
	generate.mockImplementation(async () => option());
});
afterEach(cleanup);

/** The options beside a form's image, as the image field holds them. */
function Field({
	onPick = () => {},
	isDisabled = false,
}: {
	onPick?: (file: File) => void;
	isDisabled?: boolean;
}) {
	const [image, setImage] = useState<File | null>(null);
	return (
		<TwinAvatarOptions
			image={image}
			onPick={(file) => {
				setImage(file);
				onPick(file);
			}}
			isDisabled={isDisabled}
		/>
	);
}

const generateButton = () =>
	screen.getByRole("button", { name: "Generate options" });

it("asks for nothing until told to, then offers three options and hands the picked one to the form", async () => {
	const onPick = vi.fn();
	const user = userEvent.setup();
	render(<Field onPick={onPick} />);
	expect(generate).not.toHaveBeenCalled();
	expect(screen.queryByRole("radiogroup")).toBeNull();

	await user.click(generateButton());
	expect(await screen.findAllByRole("radio")).toHaveLength(3);
	// three requests, none with a description: the server uses the owner's photo. Each asks for the look
	// after the last one's, so the three are different looks wherever the run starts
	const [[, , first]] = generate.mock.calls;
	expect(Number.isInteger(first) && first >= 0).toBe(true);
	expect(generate.mock.calls).toEqual([
		[insight.actions, undefined, first],
		[insight.actions, undefined, first + 1],
		[insight.actions, undefined, first + 2],
	]);
	expect(
		screen.getByRole("radiogroup", { name: "Avatar options" }),
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Pick one, or regenerate for three more.",
	);
	for (const radio of screen.getAllByRole("radio"))
		expect(radio).not.toBeChecked();

	await user.click(screen.getByRole("radio", { name: "Option 2" }));
	expect(onPick).toHaveBeenCalledExactlyOnceWith(made[1].file);
	expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();
	expect(screen.getByRole("radio", { name: "Option 1" })).not.toBeChecked();
});

it("shows each option as it arrives and takes no second run while one is going", async () => {
	const waiting: ((option: TwinAvatarOption) => void)[] = [];
	generate.mockImplementation(
		() => new Promise<TwinAvatarOption>((resolve) => waiting.push(resolve)),
	);
	const user = userEvent.setup();
	render(<Field />);
	await user.click(generateButton());

	const going = screen.getByRole("button", { name: "Generating…" });
	expect(going).toBeDisabled();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Making three options. This can take a minute.",
	);
	expect(screen.queryAllByRole("radio")).toHaveLength(0);

	// the second request lands first
	waiting[1](option());
	expect(
		await screen.findByRole("radio", { name: "Option 2" }),
	).toBeVisible();
	expect(screen.getAllByRole("radio")).toHaveLength(1);
	expect(going).toBeDisabled();

	waiting[0](option());
	waiting[2](option());
	expect(
		await screen.findByRole("button", { name: "Regenerate" }),
	).toBeEnabled();
	expect(screen.getAllByRole("radio")).toHaveLength(3);
});

it("replaces the options when asked again, and a pick of an old one no longer shows", async () => {
	const onPick = vi.fn();
	const user = userEvent.setup();
	render(<Field onPick={onPick} />);
	await user.click(generateButton());
	await user.click(await screen.findByRole("radio", { name: "Option 1" }));
	expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();

	await user.click(screen.getByRole("button", { name: "Regenerate" }));
	await waitFor(() => expect(generate).toHaveBeenCalledTimes(6));
	expect(
		await screen.findByRole("button", { name: "Regenerate" }),
	).toBeEnabled();
	// the form still holds the first pick; none of the new three is it
	for (const radio of screen.getAllByRole("radio"))
		expect(radio).not.toBeChecked();
	// the second run goes on to the three looks after the first run's
	const looks = generate.mock.calls.map(([, , look]) => look);
	expect(looks.slice(3)).toEqual([looks[0] + 3, looks[0] + 4, looks[0] + 5]);

	await user.click(screen.getByRole("radio", { name: "Option 3" }));
	expect(onPick).toHaveBeenLastCalledWith(made[5].file);
});

it("asks for a description when the server has no photo, and sends it with the next run", async () => {
	generate.mockResolvedValue(null);
	const user = userEvent.setup();
	render(<Field />);
	await user.click(generateButton());

	const look = await screen.findByLabelText("Describe your avatar");
	expect(look).toHaveAccessibleDescription(
		/could not find a Microsoft profile photo/,
	);
	expect(screen.queryByRole("radiogroup")).toBeNull();
	expect(screen.queryByRole("alert")).toBeNull();
	expect(generateButton()).toBeDisabled();

	await user.type(look, "  Short dark hair, round glasses ");
	generate.mockImplementation(async () => option());
	await user.click(generateButton());
	expect(await screen.findAllByRole("radio")).toHaveLength(3);
	const [, , , [, , first]] = generate.mock.calls;
	expect(generate.mock.calls.slice(3)).toEqual([
		[insight.actions, "Short dark hair, round glasses", first],
		[insight.actions, "Short dark hair, round glasses", first + 1],
		[insight.actions, "Short dark hair, round glasses", first + 2],
	]);
});

it("keeps the options that worked when one request fails", async () => {
	generate
		.mockImplementationOnce(async () => option())
		.mockRejectedValueOnce(new Error("The image model is busy"))
		.mockImplementationOnce(async () => option());
	const user = userEvent.setup();
	render(<Field />);
	await user.click(generateButton());

	expect(
		await screen.findByRole("button", { name: "Regenerate" }),
	).toBeEnabled();
	expect(screen.getAllByRole("radio")).toHaveLength(2);
	expect(screen.getByRole("radio", { name: "Option 1" })).toBeVisible();
	expect(screen.getByRole("radio", { name: "Option 3" })).toBeVisible();
	expect(screen.getByText("Could not make this one")).toBeVisible();
	expect(screen.queryByRole("alert")).toBeNull();
});

it("says why when no option could be made, and can be asked again", async () => {
	generate.mockRejectedValue(
		new Error("You have used this model's limit for today"),
	);
	const user = userEvent.setup();
	render(<Field />);
	await user.click(generateButton());

	expect(await screen.findByRole("alert")).toHaveTextContent(
		"You have used this model's limit for today",
	);
	expect(screen.queryByRole("radiogroup")).toBeNull();

	generate.mockImplementation(async () => option());
	await user.click(generateButton());
	expect(await screen.findAllByRole("radio")).toHaveLength(3);
	expect(screen.queryByRole("alert")).toBeNull();
});

it("can be picked with the keyboard alone, moving past an option that failed", async () => {
	generate
		.mockImplementationOnce(async () => option())
		.mockRejectedValueOnce(new Error("The image model is busy"))
		.mockImplementationOnce(async () => option());
	const onPick = vi.fn();
	const user = userEvent.setup();
	render(<Field onPick={onPick} />);
	await user.click(generateButton());
	await screen.findByRole("button", { name: "Regenerate" });

	// from the button, Tab reaches the options; Space picks the one in focus
	await user.tab();
	expect(screen.getByRole("radio", { name: "Option 1" })).toHaveFocus();
	await user.keyboard(" ");
	expect(onPick).toHaveBeenLastCalledWith(made[0].file);

	// held as a finger holds it: the group picks the option focus lands on while an arrow key is down
	await user.keyboard("{ArrowRight>}");
	await waitFor(() =>
		expect(screen.getByRole("radio", { name: "Option 3" })).toBeChecked(),
	);
	await user.keyboard("{/ArrowRight}");
	expect(screen.getByRole("radio", { name: "Option 3" })).toHaveFocus();
	expect(onPick).toHaveBeenLastCalledWith(made[1].file);
});

it("makes nothing while the form around it is saving", () => {
	render(<Field isDisabled />);
	expect(generateButton()).toBeDisabled();
});
