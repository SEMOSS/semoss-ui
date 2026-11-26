import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { FileItem } from "@semoss/shared";
import { TwinDocumentLibrary } from "./twin-document-library";

const documents: FileItem[] = [
	{
		name: "Brief.pdf",
		path: "/files/Legal/Brief.pdf",
		lastModified: "12/31/2025 18:20:00",
	},
	{ name: "Notes.md", path: "/Notes.md" },
	{
		name: "Brief.pdf",
		path: "/emails/Review/Brief.pdf",
		lastModified: "01/01/2026 09:03:00",
	},
];

function renderLibrary(files: FileItem[] = documents) {
	const props = {
		twin: { id: "twin-1", name: "Robin Twin" },
		files,
		onOpen: vi.fn(),
		onPlaceChange: vi.fn(),
		onRefresh: vi.fn(),
	};
	render(<TwinDocumentLibrary {...props} />);
	return { ...props, user: userEvent.setup() };
}

afterEach(cleanup);

it("orders real files by the server's modification date and opens the selected copy by its full library path", async () => {
	const { user, onOpen } = renderLibrary();
	const rows = within(screen.getByRole("list")).getAllByTestId(
		"twin-document-library-row",
	);
	expect(rows).toHaveLength(3);
	expect(rows[0]).toHaveAccessibleName(/^Brief\.pdf\s*Emails \/ Review/);
	expect(rows[1]).toHaveAccessibleName(/^Brief\.pdf\s*Files \/ Legal/);
	expect(rows[2]).toHaveAccessibleName(/^Notes\.md\s*Library root$/);

	rows[0].focus();
	await user.keyboard("{Enter}");
	expect(onOpen).toHaveBeenCalledExactlyOnceWith(documents[2]);
});

it("combines folder filters with filename or location searches and resets both when nothing matches", async () => {
	const { user } = renderLibrary();
	const search = screen.getByRole("searchbox", { name: "Search documents" });
	const filters = within(
		screen.getByRole("group", { name: "Filter documents by folder" }),
	);
	await user.type(search, "BRIEF");
	expect(screen.getAllByRole("listitem")).toHaveLength(2);

	await user.click(filters.getByRole("button", { name: /^Files/ }));
	expect(filters.getByRole("button", { name: /^Files/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await user.clear(search);
	await user.type(search, "lEgAl");
	expect(screen.getAllByRole("listitem")).toHaveLength(1);
	expect(screen.getByRole("listitem")).toHaveTextContent("Brief.pdf");
	await user.click(filters.getByRole("button", { name: /^Emails/ }));
	expect(screen.getByText("No documents match your search.")).toBeVisible();
	expect(screen.queryByRole("list")).toBeNull();

	await user.click(screen.getByRole("button", { name: "Clear filters" }));
	expect(search).toHaveValue("");
	expect(filters.getByRole("button", { name: /^All/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.getAllByRole("listitem")).toHaveLength(3);
});

it("searches every document in a large library, including copies beyond the first page", async () => {
	const files = Array.from({ length: 26 }, (_, index) => {
		const name = `Document-${String(index + 1).padStart(2, "0")}.pdf`;
		return { name, path: `/files/${name}` };
	});
	const { user } = renderLibrary(files);
	expect(screen.getAllByRole("listitem")).toHaveLength(25);
	await user.type(screen.getByRole("searchbox"), "Document-26");
	expect(screen.getAllByRole("listitem")).toHaveLength(1);
	expect(screen.getByRole("listitem")).toHaveTextContent("Document-26.pdf");
	await user.clear(screen.getByRole("searchbox"));
	await user.click(
		screen.getByRole("button", { name: "Show more documents" }),
	);
	expect(screen.getAllByRole("listitem")).toHaveLength(26);
	expect(
		screen.queryByRole("button", { name: "Show more documents" }),
	).toBeNull();
});

it("opens the finder or the chosen source from an empty library", async () => {
	const { user, onPlaceChange, onOpen } = renderLibrary([]);
	const sources = within(
		screen.getByRole("region", { name: "Browse sources" }),
	);
	expect(screen.queryByRole("searchbox")).toBeNull();
	for (const name of [
		"Outlook",
		"Calendar",
		"Teams chats",
		"OneDrive",
		"Teams files",
	]) {
		await user.click(sources.getByRole("button", { name }));
	}
	await user.click(screen.getByRole("button", { name: "Find with AI" }));
	expect(onPlaceChange.mock.calls).toEqual([
		["outlook"],
		["calendar"],
		["teams-chats"],
		["onedrive"],
		["teams-files"],
		["find"],
	]);
	expect(onOpen).not.toHaveBeenCalled();
});
