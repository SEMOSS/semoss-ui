import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { MainTwin } from "@/features/collaboration/state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { MainTwinEdit } from "./main-twin-edit";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// the save, whose pixels and picture drawing have their own test
const save = vi.hoisted(() => vi.fn());
vi.mock("./api/main-twin", () => ({ saveMainTwin: save }));
// one generated option, so a test can pick it
const generated = vi.hoisted(() => ({ file: null as File | null }));
vi.mock("./api/digital-twin", async (importOriginal) => ({
	...(await importOriginal<typeof import("./api/digital-twin")>()),
	generateTwinAvatar: async () => {
		generated.file = new File(["made"], "avatar.png", {
			type: "image/png",
		});
		return { file: generated.file, url: "data:image/png;base64,MADE" };
	},
}));

const ROBIN: MainTwin = {
	name: "Robin's Digital Twin",
	avatar: "",
	agentId: "collaboration-agent",
};
const PICTURE = "data:image/png;base64,SAVED";

beforeEach(() => {
	save.mockReset();
	save.mockResolvedValue({ name: "Robin's Digital Twin" });
	generated.file = null;
	// jsdom has no object URLs; the preview only needs an address
	URL.createObjectURL = vi.fn(() => "blob:preview");
	URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

/** The button that opens the dialog, and the twin the session holds, as every other surface reads it. */
function Host() {
	const button = useRef<HTMLButtonElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const { state } = useCollaborationSession();
	return (
		<>
			<button ref={button} type="button" onClick={() => setIsOpen(true)}>
				Name and Picture
			</button>
			<output aria-label="Twin in the session">
				{JSON.stringify(state.mainTwin)}
			</output>
			{isOpen && (
				<MainTwinEdit
					returnFocusRef={button}
					onClose={() => setIsOpen(false)}
				/>
			)}
		</>
	);
}

/** Open the dialog for a twin, on a server that can make avatar options. */
async function open(mainTwin: MainTwin = ROBIN) {
	const base = createInitialCollaborationState();
	render(
		<CollaborationSessionProvider
			initialState={{
				...base,
				liveProfile: {
					...base.profile,
					email: "robin@northwind.example",
				},
				mainTwin,
				settings: { ...base.settings, avatarGeneration: true },
			}}
		>
			<Host />
		</CollaborationSessionProvider>,
	);
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Name and Picture" }));
	return {
		user,
		dialog: screen.getByRole("dialog", { name: "Name and Picture" }),
	};
}
const opener = () => screen.getByRole("button", { name: "Name and Picture" });
const held = (): MainTwin =>
	JSON.parse(screen.getByLabelText("Twin in the session").textContent ?? "");
const saveButton = () => screen.getByRole("button", { name: "Save" });

it("renames the twin, shows the new name everywhere at once, and gives the focus back to the button", async () => {
	save.mockResolvedValue({ name: "Rob" });
	const { user, dialog } = await open();
	const name = within(dialog).getByRole("textbox", { name: "Name" });
	expect(name).toHaveValue("Robin's Digital Twin");
	await user.clear(name);
	await user.type(name, "  Rob  ");
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	// only the name went, trimmed: the picture is left as it is
	expect(save).toHaveBeenCalledExactlyOnceWith(insight.actions, {
		name: "Rob",
	});
	expect(held()).toEqual({ ...ROBIN, name: "Rob" });
	await waitFor(() => expect(opener()).toHaveFocus());
});

it("goes back to the default name when the name is cleared", async () => {
	const { user, dialog } = await open({ ...ROBIN, name: "Rob" });
	await user.clear(within(dialog).getByRole("textbox", { name: "Name" }));
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledExactlyOnceWith(insight.actions, { name: "" });
	// the server answers with the name it fell back to
	expect(held().name).toBe("Robin's Digital Twin");
});

it("saves a chosen file as the picture, and only the picture", async () => {
	save.mockResolvedValue({ name: "Robin's Digital Twin", image: "NEW" });
	const { user, dialog } = await open();
	const file = new File(["picture"], "me.png", { type: "image/png" });
	await user.upload(within(dialog).getByLabelText("Image"), file);
	expect(dialog.querySelector("img")).toHaveAttribute("src", "blob:preview");
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledExactlyOnceWith(insight.actions, {
		image: file,
	});
	expect(held().avatar).toBe("data:image/png;base64,NEW");
});

it("saves a generated option the same way a chosen file is saved", async () => {
	save.mockResolvedValue({ name: "Robin's Digital Twin", image: "NEW" });
	const { user, dialog } = await open();
	await user.click(
		within(dialog).getByRole("button", { name: "Generate options" }),
	);
	const [first] = await within(dialog).findAllByRole("radio");
	await user.click(first);
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledExactlyOnceWith(insight.actions, {
		image: generated.file,
	});
});

it("offers the Microsoft photo back only once a picture is saved, and saves that as no picture", async () => {
	const { user, dialog } = await open({ ...ROBIN, avatar: PICTURE });
	expect(dialog.querySelector("img")).toHaveAttribute("src", PICTURE);
	await user.click(
		within(dialog).getByRole("button", { name: "Use My Microsoft Photo" }),
	);
	// the portrait is the photo again, and the change is said, not only shown
	expect(dialog.querySelector("img")).toHaveAttribute(
		"src",
		expect.stringMatching(/\/msgraph\/photo\?email=robin%40northwind/),
	);
	expect(dialog).toHaveTextContent(
		"Your Microsoft photo is used once you save.",
	);
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledExactlyOnceWith(insight.actions, {
		image: "",
	});
	expect(held().avatar).toBe("");
	cleanup();

	// with no picture saved there is nothing to go back from
	await open();
	expect(
		screen.queryByRole("button", { name: "Use My Microsoft Photo" }),
	).toBeNull();
});

it("keeps a picture chosen after going back to the photo", async () => {
	const { user, dialog } = await open({ ...ROBIN, avatar: PICTURE });
	await user.click(
		within(dialog).getByRole("button", { name: "Use My Microsoft Photo" }),
	);
	const file = new File(["picture"], "me.png", { type: "image/png" });
	await user.upload(within(dialog).getByLabelText("Image"), file);
	expect(dialog).not.toHaveTextContent("Your Microsoft photo is used");
	await user.click(saveButton());
	await waitFor(() => expect(save).toHaveBeenCalledOnce());
	expect(save).toHaveBeenCalledWith(insight.actions, { image: file });
});

it("makes no call when nothing was changed, and closes", async () => {
	const { user } = await open({ ...ROBIN, avatar: PICTURE });
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).not.toHaveBeenCalled();
	expect(held()).toEqual({ ...ROBIN, avatar: PICTURE });
	await waitFor(() => expect(opener()).toHaveFocus());
});

it("stays open with the server's reason when a save is refused, keeps what was entered, and saves on the next try", async () => {
	save.mockRejectedValueOnce(
		new Error("That picture is too large. Choose a smaller one."),
	);
	const { user, dialog } = await open();
	const name = within(dialog).getByRole("textbox", { name: "Name" });
	await user.clear(name);
	await user.type(name, "Rob");
	await user.click(saveButton());
	expect(await within(dialog).findByRole("alert")).toHaveTextContent(
		"That picture is too large. Choose a smaller one.",
	);
	expect(name).toHaveValue("Rob");
	// nothing changed for any other surface
	expect(held()).toEqual(ROBIN);
	save.mockResolvedValue({ name: "Rob" });
	await user.click(saveButton());
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledTimes(2);
	expect(held().name).toBe("Rob");
});

it("checks the name and the file before anything is sent", async () => {
	const { user, dialog } = await open();
	const name = within(dialog).getByRole("textbox", { name: "Name" });
	await user.clear(name);
	// typing 81 letters one key at a time is slow; the field takes them at once
	fireEvent.change(name, { target: { value: "x".repeat(81) } });
	await user.click(saveButton());
	expect(
		await within(dialog).findByText(
			"Keep the name to 80 characters or fewer.",
		),
	).toBeVisible();
	fireEvent.change(name, { target: { value: "x".repeat(80) } });
	// a file the server would not take is refused here, as a twin's image is
	fireEvent.change(within(dialog).getByLabelText("Image"), {
		target: {
			files: [new File(["text"], "notes.txt", { type: "text/plain" })],
		},
	});
	await user.click(saveButton());
	expect(
		await within(dialog).findByText("Choose a PNG, JPEG, or GIF image."),
	).toBeVisible();
	expect(save).not.toHaveBeenCalled();
});

it("cannot be closed or changed while it saves, and gives the focus back when closed unsaved", async () => {
	let finish: (saved: { name: string }) => void = () => undefined;
	save.mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const { user, dialog } = await open();
	const name = within(dialog).getByRole("textbox", { name: "Name" });
	await user.clear(name);
	await user.type(name, "Rob");
	await user.click(saveButton());
	await waitFor(() =>
		expect(
			within(dialog).getByRole("button", { name: /Saving\.\.\./ }),
		).toBeDisabled(),
	);
	expect(name).toBeDisabled();
	expect(within(dialog).getByLabelText("Image")).toBeDisabled();
	expect(within(dialog).queryByRole("button", { name: "Close" })).toBeNull();
	await user.keyboard("{Escape}");
	expect(screen.getByRole("dialog")).toBe(dialog);
	finish({ name: "Rob" });
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

	// opened again and closed unsaved: Escape and Cancel both close it and send nothing
	await user.click(opener());
	await user.keyboard("{Escape}");
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	await waitFor(() => expect(opener()).toHaveFocus());
	await user.click(opener());
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(save).toHaveBeenCalledOnce();
});
