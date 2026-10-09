import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AvailableGroup,
	addGroupResourceAccess,
	type GroupAccessResource,
	type GroupManager,
	getAvailableGroupsForResource,
	getGroupManagers,
} from "@/api/teams";
import { AddGroupAccessDialog } from "./add-group-access-dialog";

vi.mock("@/api/teams", () => ({
	addGroupResourceAccess: vi.fn(),
	getAvailableGroupsForResource: vi.fn(),
	getGroupManagers: vi.fn(),
}));

/** The part of the config store the team type names read */
interface ConfigState {
	config: {
		availableProviders: {
			provider: string;
			name: string;
			label?: string;
			isOauth: boolean;
		}[];
	};
}

vi.mock("@/hooks", () => ({
	useConfig: (selector: (state: ConfigState) => unknown) =>
		selector({
			config: {
				availableProviders: [
					{
						provider: "ms",
						name: "Microsoft Entra",
						label: "MICROSOFT",
						isOauth: true,
					},
				],
			},
		}),
}));

// provider logos load through the shared package; the initials stand in here
vi.mock("@/features/team-type/use-login-provider-logo", () => ({
	useLoginProviderLogo: () => null,
}));

const SALES: AvailableGroup = {
	id: "Sales",
	type: "CUSTOM",
	description: "Sales and marketing",
};
const ENGINEERING: AvailableGroup = {
	id: "Engineering",
	type: "MICROSOFT",
	description: null,
};
const ADA: GroupManager = {
	userid: "ada",
	type: "NATIVE",
	name: "Ada Lovelace",
};

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

/** Open the dialog for a project or engine, returning its onClose */
const renderDialog = (
	resource: GroupAccessResource = "PROJECT",
	resourceId = "project-1",
) => {
	const onClose = vi.fn();
	render(
		<AddGroupAccessDialog
			open
			resource={resource}
			resourceId={resourceId}
			onClose={onClose}
		/>,
	);
	return onClose;
};

/** A team's row, once the list has loaded */
const findTeam = (name: string) =>
	screen.findByRole("button", { name: new RegExp(`^${name}`) });

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

describe("AddGroupAccessDialog", () => {
	beforeEach(() => {
		vi.mocked(getAvailableGroupsForResource)
			.mockReset()
			.mockResolvedValue([SALES, ENGINEERING]);
		vi.mocked(getGroupManagers).mockReset();
		vi.mocked(addGroupResourceAccess).mockReset();
		Element.prototype.scrollIntoView = vi.fn();
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
	});

	it("lists the teams with where their members come from", async () => {
		renderDialog();

		const sales = await findTeam("Sales");
		expect(within(sales).getByText("Custom")).toBeInTheDocument();
		expect(
			within(sales).getByText("Sales and marketing"),
		).toBeInTheDocument();
		const engineering = screen.getByRole("button", {
			name: /^Engineering/,
		});
		expect(
			within(engineering).getByText("Microsoft Entra"),
		).toBeInTheDocument();
		expect(getAvailableGroupsForResource).toHaveBeenCalledWith(
			"PROJECT",
			"project-1",
			"",
			20,
			0,
		);
		expect(getAuthorize()).toBeDisabled();
	});

	it.each([
		["PROJECT", "project-1"],
		["ENGINE", "engine-1"],
	] as const)(
		"keeps a custom team unauthorized until its managers load, for a %s",
		async (resource, resourceId) => {
			const managers = defer<GroupManager[]>();
			vi.mocked(getGroupManagers).mockReturnValue(managers.promise);
			renderDialog(resource, resourceId);

			fireEvent.click(await findTeam("Sales"));

			expect(getAuthorize()).toBeDisabled();
			expect(
				screen.getByText("Checking who manages this team..."),
			).toBeInTheDocument();
			expect(getGroupManagers).toHaveBeenCalledWith("Sales", false, {
				resource,
				resourceId,
			});

			await act(async () => managers.resolve([ADA]));

			expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
			expect(screen.getByText("platform admins")).toBeInTheDocument();
			expect(getAuthorize()).toBeEnabled();
		},
	);

	it("offers Try Again when the managers cannot be read, and stays unauthorized", async () => {
		vi.mocked(getGroupManagers)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockResolvedValueOnce([]);
		renderDialog();

		fireEvent.click(await findTeam("Sales"));

		const retry = await screen.findByRole("button", { name: "Try Again" });
		expect(screen.getByText(/Forbidden/)).toBeInTheDocument();
		expect(getAuthorize()).toBeDisabled();

		fireEvent.click(retry);

		expect(
			await screen.findByText(/This team has no managers yet/),
		).toBeInTheDocument();
		expect(screen.getByText("platform admins")).toBeInTheDocument();
		expect(getGroupManagers).toHaveBeenCalledTimes(2);
		expect(getAuthorize()).toBeEnabled();
	});

	it("gives a provider team the chosen level and closes", async () => {
		vi.mocked(addGroupResourceAccess).mockResolvedValue({
			response: {} as Response,
			data: { success: true },
		});
		const onClose = renderDialog();

		fireEvent.click(await findTeam("Engineering"));

		expect(screen.getByText(/Microsoft Entra sign in/)).toBeInTheDocument();
		expect(getAuthorize()).toBeEnabled();

		fireEvent.click(screen.getByRole("combobox", { name: "Access Level" }));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
		expect(addGroupResourceAccess).toHaveBeenCalledExactlyOnceWith(
			"PROJECT",
			"project-1",
			ENGINEERING,
			"EDIT",
		);
		expect(getGroupManagers).not.toHaveBeenCalled();
	});

	it("shows why access was not given and stays open", async () => {
		vi.mocked(addGroupResourceAccess).mockRejectedValue(
			new Error("Only owners can share this project"),
		);
		const onClose = renderDialog();

		fireEvent.click(await findTeam("Engineering"));
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("Only owners can share this project"),
		).toBeInTheDocument();
		expect(addGroupResourceAccess).toHaveBeenCalledExactlyOnceWith(
			"PROJECT",
			"project-1",
			ENGINEERING,
			"READ_ONLY",
		);
		expect(onClose).not.toHaveBeenCalled();
		expect(getAuthorize()).toBeEnabled();
	});
});
