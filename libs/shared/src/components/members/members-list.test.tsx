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
	MembersList,
	type MembersListSource,
	type MemberUser,
} from "./members-list";

const mocks = vi.hoisted(() => ({
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
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

/** The list's load-more observer, so a test can scroll to the end */
let reachEnd: IntersectionObserverCallback = () => {};

/** Stands in for the observer jsdom lacks, keeping its callback */
class FakeIntersectionObserver {
	constructor(callback: IntersectionObserverCallback) {
		reachEnd = callback;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

/** Scroll the list to its end, which loads the next page */
const scrollToEnd = () =>
	act(() =>
		reachEnd(
			[{ isIntersecting: true } as IntersectionObserverEntry],
			{} as IntersectionObserver,
		),
	);

/** A member as a host's source lists them */
const member = (id: string, name: string): MemberUser => ({
	id,
	name,
	type: "NATIVE",
	email: `${id}@example.com`,
	permission: "",
	permission_granted_by: "",
	permission_granted_by_type: "",
	date_added: "2024-01-01",
});

const ADA = member("ada", "Ada Lovelace");
const GRACE = member("grace", "Grace Hopper");
const ALAN = member("alan", "Alan Turing");

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

/** A source of managers that loads with `load` and removes with `remove` */
const makeSource = (
	load: MembersListSource["load"],
	remove: MembersListSource["remove"] = vi
		.fn<MembersListSource["remove"]>()
		.mockResolvedValue(undefined),
): MembersListSource => ({ load, remove, memberLabel: "Manager" });

describe("MembersList with a host source", () => {
	beforeEach(() => {
		vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		mocks.toastError.mockReset();
		mocks.toastSuccess.mockReset();
	});

	it("shows a failed load with Try Again, which reads the list again", async () => {
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockRejectedValueOnce(new Error("Not allowed to see the managers"))
			.mockResolvedValue({ members: [ADA], total: 1 });
		render(<MembersList source={makeSource(load)} />);

		expect(
			await screen.findByText("Not allowed to see the managers"),
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
		expect(load).toHaveBeenCalledTimes(2);
		expect(load).toHaveBeenLastCalledWith("", 50, 0);
		expect(screen.queryByRole("button", { name: "Try Again" })).toBeNull();
		expect(
			screen.queryByText("Not allowed to see the managers"),
		).toBeNull();
	});

	it("names its rows by the source's member label", async () => {
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [], total: 0 });
		render(<MembersList source={makeSource(load)} />);

		expect(await screen.findByText("No managers found")).toBeTruthy();
		expect(screen.getByText("0 of 0 managers")).toBeTruthy();
	});

	it("reloads from the first page with nothing selected when the source changes", async () => {
		const firstLoad = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValueOnce({ members: [ADA, GRACE], total: 60 })
			.mockResolvedValue({ members: [ALAN], total: 60 });
		const { rerender } = render(
			<MembersList source={makeSource(firstLoad)} />,
		);
		await screen.findByText("Ada Lovelace");

		scrollToEnd();

		expect(await screen.findByText("Alan Turing")).toBeTruthy();
		expect(firstLoad).toHaveBeenLastCalledWith("", 50, 50);

		fireEvent.click(
			screen.getByRole("checkbox", { name: "Select Ada Lovelace" }),
		);
		expect(screen.getByText("1 user selected")).toBeTruthy();

		const secondLoad = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [GRACE], total: 1 });
		rerender(<MembersList source={makeSource(secondLoad)} />);

		await waitFor(() =>
			expect(screen.getByText("1 of 1 manager")).toBeTruthy(),
		);
		// the new source is read once, from the first page, never at the old offset
		expect(secondLoad).toHaveBeenCalledTimes(1);
		expect(secondLoad).toHaveBeenCalledWith("", 50, 0);
		expect(screen.queryByText("Ada Lovelace")).toBeNull();
		expect(screen.queryByText("Alan Turing")).toBeNull();
		expect(screen.queryByText("1 user selected")).toBeNull();
		expect(
			screen
				.getByRole("checkbox", { name: "Select Grace Hopper" })
				.getAttribute("aria-checked"),
		).toBe("false");
	});

	it("reads a new search once, from the first page, after paging down", async () => {
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValueOnce({ members: [ADA, GRACE], total: 60 })
			.mockResolvedValueOnce({ members: [ALAN], total: 60 })
			.mockResolvedValue({ members: [ADA], total: 1 });
		const source = makeSource(load);
		const { rerender } = render(<MembersList source={source} search="" />);
		await screen.findByText("Ada Lovelace");

		scrollToEnd();
		expect(await screen.findByText("Alan Turing")).toBeTruthy();
		expect(load).toHaveBeenLastCalledWith("", 50, 50);
		load.mockClear();

		rerender(<MembersList source={source} search="ada" />);

		await waitFor(() =>
			expect(screen.getByText("1 of 1 manager")).toBeTruthy(),
		);
		expect(load).toHaveBeenCalledTimes(1);
		expect(load).toHaveBeenCalledWith("ada", 50, 0);
	});

	it("names each delete button by its member", async () => {
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [ADA, GRACE], total: 2 });
		render(<MembersList source={makeSource(load)} />);
		await screen.findByText("Ada Lovelace");

		expect(
			screen.getByRole("button", { name: "Delete Ada Lovelace" }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Delete Grace Hopper" }),
		).toBeTruthy();
		// a host's members have no permission to edit
		expect(screen.queryByRole("button", { name: /^Edit / })).toBeNull();
	});

	it("disables Delete while the managers are removed, then reports it by the member label", async () => {
		const removal = defer<void>();
		const remove = vi.fn<MembersListSource["remove"]>(
			() => removal.promise,
		);
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [ADA, GRACE], total: 2 });
		render(<MembersList source={makeSource(load, remove)} />);
		await screen.findByText("Ada Lovelace");

		fireEvent.click(
			screen.getByRole("button", { name: "Delete Ada Lovelace" }),
		);
		expect(
			screen.getByRole("heading", { name: "Delete Manager" }),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		const deleting = screen.getByRole("button", { name: "Deleting..." });
		expect(deleting.hasAttribute("disabled")).toBe(true);
		fireEvent.click(deleting);
		expect(remove).toHaveBeenCalledExactlyOnceWith([ADA]);

		await act(async () => removal.resolve());

		await waitFor(() =>
			expect(mocks.toastSuccess).toHaveBeenCalledWith(
				"Selected managers have been deleted successfully.",
			),
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
	});

	it("reports a failed removal with the source's message", async () => {
		const remove = vi
			.fn<MembersListSource["remove"]>()
			.mockRejectedValue(new Error("Grace Hopper: Forbidden"));
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [ADA, GRACE], total: 2 });
		render(<MembersList source={makeSource(load, remove)} />);
		await screen.findByText("Grace Hopper");

		fireEvent.click(
			screen.getByRole("button", { name: "Delete Grace Hopper" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"Grace Hopper: Forbidden",
			),
		);
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
	});

	it("offers no selection or delete when read only", async () => {
		const load = vi
			.fn<MembersListSource["load"]>()
			.mockResolvedValue({ members: [ADA], total: 1 });
		render(<MembersList source={makeSource(load)} readOnly />);
		await screen.findByText("Ada Lovelace");

		expect(screen.queryByRole("checkbox")).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Delete Ada Lovelace" }),
		).toBeNull();
	});
});
