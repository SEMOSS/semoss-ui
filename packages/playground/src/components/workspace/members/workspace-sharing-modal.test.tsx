import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { PermissionDropdown } from "./permission-dropdown";
import { WorkspaceSharingModal } from "./workspace-sharing-modal";

const mocks = vi.hoisted(() => ({
	add: vi.fn(),
	translate: (key: string) => key,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: mocks.translate }),
}));
vi.mock("@semoss/sdk", () => ({
	addProjectUserPermissions: mocks.add,
	getProjectUsers: vi.fn().mockResolvedValue({ members: [] }),
	getProjectUsersNoCredentials: vi.fn().mockResolvedValue([
		{
			id: "user-1",
			name: "Alex",
			email: "alex@example.test",
			permission: "READ_ONLY",
		},
	]),
}));
beforeEach(() => {
	vi.clearAllMocks();
	Element.prototype.scrollIntoView = vi.fn();
});

test("preserves read-only and owner permission guards", () => {
	const onChange = vi.fn();
	const { rerender } = render(
		<PermissionDropdown
			permission="READ_ONLY"
			activeUserPermission="READ_ONLY"
			handlePermissionChange={onChange}
		/>,
	);
	expect(screen.getByRole("combobox")).toBeDisabled();
	rerender(
		<PermissionDropdown
			permission="OWNER"
			activeUserPermission="EDIT"
			handlePermissionChange={onChange}
		/>,
	);
	expect(screen.getByRole("combobox")).toBeDisabled();
	expect(onChange).not.toHaveBeenCalled();
});

test("locks sharing controls during submission and retains pending users on failure", async () => {
	let rejectSave: (reason: Error) => void = () => {};
	mocks.add.mockImplementationOnce(
		() =>
			new Promise((_, reject) => {
				rejectSave = reject;
			}),
	);
	const onClose = vi.fn();
	render(
		<WorkspaceSharingModal
			workspaceId="workspace-1"
			open
			onClose={onClose}
			activeUserPermission="OWNER"
		/>,
	);
	fireEvent.click(
		screen.getByRole("combobox", {
			name: "workspace:sharing.searchPlaceholder",
		}),
	);
	fireEvent.click(await screen.findByRole("option", { name: /Alex/ }));
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:sharing.buttonAdd" }),
	);
	await waitFor(() =>
		expect(mocks.add).toHaveBeenCalledWith("workspace-1", [
			{ userid: "user-1", permission: "READ_ONLY" },
		]),
	);
	expect(
		screen.getByRole("button", { name: "common:buttons.cancel" }),
	).toBeDisabled();
	for (const control of screen.getAllByRole("combobox"))
		expect(control).toBeDisabled();
	rejectSave(new Error("Unavailable"));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "workspace:sharing.buttonAdd" }),
		).toBeEnabled(),
	);
	expect(screen.getByText("Alex")).toBeInTheDocument();
	expect(onClose).not.toHaveBeenCalled();
});
