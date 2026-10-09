import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AddMembersCandidate,
	AddMembersOverlay,
	type AddMembersPeopleSource,
} from "./add-members";

const mocks = vi.hoisted(() => {
	// the English strings the dialog's assertions read
	const messages: Record<string, string> = {
		"search.placeholder": "Search by name or email...",
		"selected.remove": "Remove {{name}}",
		"footer.add": "Add",
		"footer.addWithCount": "Add ({{count}})",
	};
	return {
		toastError: vi.fn(),
		toastSuccess: vi.fn(),
		translate: (key: string, options: Record<string, unknown> = {}) =>
			(messages[key] ?? key).replace(
				/\{\{(\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? ""),
			),
	};
});

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: mocks.translate, i18n: { language: "en" } }),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/ui/next")>();
	return {
		...actual,
		toast: {
			...actual.toast,
			error: mocks.toastError,
			success: mocks.toastSuccess,
		},
	};
});

/** A person the host's source lists */
const person = (id: string, name: string): AddMembersCandidate => ({
	id,
	type: "NATIVE",
	name,
	email: `${id}@example.com`,
	username: id,
});

const ADA = person("ada", "Ada Lovelace");
const GRACE = person("grace", "Grace Hopper");

/** A promise the test settles by hand */
function defer<T>() {
	let resolve: (value: T) => void = () => {};
	let reject: (reason: unknown) => void = () => {};
	const promise = new Promise<T>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
}

/** A source of would-be managers, where Ada already is one */
const makePeople = (
	add: AddMembersPeopleSource["add"],
): AddMembersPeopleSource => ({
	load: vi
		.fn<AddMembersPeopleSource["load"]>()
		.mockResolvedValue([ADA, GRACE]),
	add,
	getUnavailableReason: (candidate) =>
		candidate.id === ADA.id ? "Already a Manager" : null,
	title: "Add Manager",
	description: "Managers add and remove this team's members.",
	successMessage: "Managers added",
});

/** Open the dialog over `people`, returning its onClose */
const renderOverlay = (people: AddMembersPeopleSource) => {
	const onClose = vi.fn();
	render(<AddMembersOverlay open onClose={onClose} people={people} />);
	return onClose;
};

const getSearch = () =>
	screen.getByRole("textbox", { name: "Search by name or email..." });

describe("AddMembersOverlay with a host's people", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		mocks.toastError.mockReset();
		mocks.toastSuccess.mockReset();
	});

	it("lists the host's people under its title, marking who cannot be picked", async () => {
		const people = makePeople(vi.fn<AddMembersPeopleSource["add"]>());
		renderOverlay(people);

		expect(await screen.findByText("Already a Manager")).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Add Manager" }),
		).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: /Ada Lovelace/ })
				.hasAttribute("disabled"),
		).toBe(true);
		expect(
			screen
				.getByRole("button", { name: /Grace Hopper/ })
				.hasAttribute("disabled"),
		).toBe(false);
		expect(people.load).toHaveBeenCalledWith("", 50, 0, undefined);
	});

	it("does not pick an unavailable exact match with Enter", async () => {
		renderOverlay(makePeople(vi.fn<AddMembersPeopleSource["add"]>()));
		await screen.findByText("Already a Manager");

		fireEvent.change(getSearch(), { target: { value: "ada@example.com" } });
		fireEvent.keyDown(getSearch(), { key: "Enter" });

		expect(
			screen.queryByRole("button", { name: "Remove Ada Lovelace" }),
		).toBeNull();
		expect(
			screen
				.getByRole("button", { name: "Add" })
				.hasAttribute("disabled"),
		).toBe(true);

		// an available exact match is picked
		fireEvent.change(getSearch(), { target: { value: "Grace Hopper" } });
		fireEvent.keyDown(getSearch(), { key: "Enter" });

		expect(
			screen.getByRole("button", { name: "Remove Grace Hopper" }),
		).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "Add (1)" })
				.hasAttribute("disabled"),
		).toBe(false);
	});

	it("disables Add while the people are added, then closes", async () => {
		const adding = defer<void>();
		const add = vi.fn<AddMembersPeopleSource["add"]>(() => adding.promise);
		const onClose = renderOverlay(makePeople(add));

		fireEvent.click(
			await screen.findByRole("button", { name: /Grace Hopper/ }),
		);
		const addButton = screen.getByRole("button", { name: "Add (1)" });
		fireEvent.click(addButton);
		fireEvent.click(addButton);

		expect(add).toHaveBeenCalledExactlyOnceWith([
			expect.objectContaining({ id: "grace", type: "NATIVE" }),
		]);
		expect(addButton.hasAttribute("disabled")).toBe(true);
		expect(addButton.getAttribute("aria-busy")).toBe("true");
		expect(onClose).not.toHaveBeenCalled();

		await act(async () => adding.resolve());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
		expect(mocks.toastSuccess).toHaveBeenCalledWith("Managers added");
	});

	it("keeps the dialog open with the people picked when adding fails", async () => {
		const add = vi
			.fn<AddMembersPeopleSource["add"]>()
			.mockRejectedValue(new Error("Grace Hopper: not added"));
		const onClose = renderOverlay(makePeople(add));

		fireEvent.click(
			await screen.findByRole("button", { name: /Grace Hopper/ }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Add (1)" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"Grace Hopper: not added",
			),
		);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Add (1)" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		expect(
			screen.getByRole("heading", { name: "Add Manager" }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Remove Grace Hopper" }),
		).toBeTruthy();
		expect(onClose).not.toHaveBeenCalled();
		expect(mocks.toastSuccess).not.toHaveBeenCalled();

		// some may have been added, so the host's list reloads
		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith(true);
	});

	it("closes without asking for a reload when nothing was added", async () => {
		const add = vi.fn<AddMembersPeopleSource["add"]>();
		const onClose = renderOverlay(makePeople(add));
		await screen.findByText("Already a Manager");

		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith(false);
		expect(add).not.toHaveBeenCalled();
	});
});
