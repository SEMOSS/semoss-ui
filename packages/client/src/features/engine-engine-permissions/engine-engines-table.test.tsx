import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getResourcePermissions,
	type ModelUsageLimit,
	type ResourcePermissions,
	savePermissionBatches,
} from "@semoss/sdk";
import type { Grantee } from "@/features/grants/grants";
import { EngineEnginesTable } from "./engine-engines-table";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getResourcePermissions: vi.fn(),
	savePermissionBatches: vi.fn(),
}));

/** 5,000 tokens a day for the engine, and 100 a day for each of its users */
const ENGINE_LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{ metric: "TOKENS", amount: 5000, window: "DAY", counts: "SHARED" },
		{
			metric: "TOKENS",
			amount: 100,
			window: "DAY",
			counts: "EACH_PERSON",
		},
	],
};

/** A vector database with an end date and a usage limit */
const VECTORS: Grantee = {
	subject: {
		category: "ENGINE",
		id: "vectors1",
		type: "VECTOR",
		name: "Claims Vectors",
		subtype: "FAISS",
	},
	access: {
		level: "READ_ONLY",
		endDate: "2027-01-01T00:00:00Z",
		usageLimit: ENGINE_LIMIT,
	},
};

/** A guardrail with neither */
const GUARD: Grantee = {
	subject: {
		category: "ENGINE",
		id: "guard1",
		type: "GUARDRAIL",
		name: "Prompt Guard",
		subtype: "PROMPT",
	},
	access: { level: "EDIT", endDate: null, usageLimit: null },
};

/** An app the engine gives a permission to, which the Engines table leaves out */
const APP: Grantee = {
	subject: {
		category: "ENGINE",
		id: "app1",
		type: "PROJECT",
		name: "Intake Form",
		subtype: null,
	},
	access: { level: "READ_ONLY", endDate: null, usageLimit: null },
};

/**
 * An engine's permissions as an owner reads them, with the engines given and
 * an app the table leaves out; an editor's when the engines cannot be changed,
 * and an owner's where only admins give access when asked
 */
const permissionsWith = (
	grantees: Grantee[],
	canChangeEngines = true,
	addsAreAdminOnly = false,
): ResourcePermissions => ({
	people: [],
	teams: [],
	engines: [APP, ...grantees],
	accessToEngines: [],
	allowedPermissionChanges: {
		canChangePeople: canChangeEngines,
		canGiveAuthorAccess: canChangeEngines,
		canChangeTeams: canChangeEngines,
		canViewEngines: true,
		canChangeEngines,
		canViewAccessToEngines: true,
		addsAreAdminOnly,
		limitLevels: canChangeEngines ? ["READ_ONLY", "EDIT", "OWNER"] : [],
		canChangeModelLimits: canChangeEngines,
	},
	publicUse: null,
	modelTotal: null,
	costLimitsAvailable: true,
	price: null,
});

/** Renders the table for a database, or for a model when asked */
const renderTable = ({ isModel = false, admin = false } = {}) => {
	const id = isModel ? "model-1" : "engine-1";
	return render(
		<MemoryRouter>
			<EngineEnginesTable
				id={id}
				type={isModel ? "MODEL" : "DATABASE"}
				admin={admin}
			/>
		</MemoryRouter>,
	);
};

const getLevel = (name: string) =>
	screen.getByRole("combobox", { name: `Permission for ${name}` });

describe("EngineEnginesTable", () => {
	beforeEach(() => {
		vi.mocked(getResourcePermissions)
			.mockReset()
			.mockResolvedValue(permissionsWith([VECTORS, GUARD]));
		vi.mocked(savePermissionBatches)
			.mockReset()
			.mockResolvedValue({ targets: 1, changes: 1 });
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

	it("reads the engine's engines, leaves out its apps, and shows them to someone who cannot change them, with nothing to change", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([VECTORS, GUARD], false),
		);
		renderTable();

		expect(screen.getByText("Loading engines...")).toBeInTheDocument();
		expect(await screen.findByText("Claims Vectors")).toBeInTheDocument();
		expect(screen.getByText("Prompt Guard")).toBeInTheDocument();
		expect(screen.getByText("id: vectors1")).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Claims Vectors (opens in a new tab)",
			}),
		).toHaveAttribute("href", "/vector/vectors1");
		expect(screen.queryByText("Intake Form")).not.toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "ENGINE", id: "engine-1" },
			false,
		);
		expect(getLevel("Claims Vectors")).toBeDisabled();
		expect(getLevel("Claims Vectors")).toHaveTextContent("Read-Only");
		expect(getLevel("Prompt Guard")).toHaveTextContent("Editor");
		expect(
			screen.queryByRole("button", { name: "Add Engine" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Actions" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Remove access for Claims Vectors",
			}),
		).not.toBeInTheDocument();
	});

	it("tells an owner only admins give engines access where adds are left to admins, and keeps changing and removing", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([VECTORS, GUARD], true, true),
		);
		renderTable();

		expect(await screen.findByText("Claims Vectors")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Add Engine" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				/Only admins can give access to databases, from this page in admin mode/,
			),
		).toBeInTheDocument();
		expect(getLevel("Claims Vectors")).toBeEnabled();
		expect(
			screen.getByRole("button", {
				name: "Remove access for Claims Vectors",
			}),
		).toBeEnabled();
	});

	it("offers an owner Add Engine, each level and Remove Access", async () => {
		renderTable();

		expect(await screen.findByText("Claims Vectors")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add Engine" }),
		).toBeInTheDocument();
		expect(getLevel("Claims Vectors")).toBeEnabled();
		expect(
			screen.getByRole("button", {
				name: "Remove access for Claims Vectors",
			}),
		).toBeEnabled();
	});

	it("has a Usage Limit column only on a model, and an Ends column only when an engine has an end date", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([GUARD]),
		);
		const view = renderTable();

		expect(await screen.findByText("Prompt Guard")).toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Usage Limit" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Ends" }),
		).not.toBeInTheDocument();

		view.unmount();
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([VECTORS, GUARD]),
		);
		renderTable({ isModel: true });

		expect(await screen.findByText("Claims Vectors")).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Usage Limit" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Ends" }),
		).toBeInTheDocument();
		expect(screen.getByText(/tokens a day shared/)).toBeInTheDocument();
		expect(
			screen.getByText(/tokens a day for each user/),
		).toBeInTheDocument();
		expect(screen.getByText("No end date")).toBeInTheDocument();
	});

	it("shows an engine's limit read-only to someone who cannot set it", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([VECTORS], false),
		);
		renderTable({ isModel: true });

		expect(
			await screen.findByText("Only owners can set usage limits"),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: /^Usage limit for Claims Vectors/,
			}),
		).not.toBeInTheDocument();
	});

	it("changes a level in place with one change that carries the end date and usage limit, then reads the engines again", async () => {
		vi.mocked(getResourcePermissions)
			.mockResolvedValueOnce(permissionsWith([VECTORS, GUARD]))
			.mockResolvedValue(
				permissionsWith([
					{
						subject: VECTORS.subject,
						access: { ...VECTORS.access, level: "EDIT" },
					},
					GUARD,
				]),
			);
		renderTable({ isModel: true });
		await screen.findByText("Claims Vectors");

		fireEvent.click(getLevel("Claims Vectors"));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));

		await waitFor(() =>
			expect(getResourcePermissions).toHaveBeenCalledTimes(2),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "CHANGE",
							subject: {
								category: "ENGINE",
								id: "vectors1",
								type: "VECTOR",
							},
							to: {
								level: "EDIT",
								endDate: "2027-01-01T00:00:00Z",
								usageLimit: ENGINE_LIMIT,
							},
						},
					],
				},
			],
			false,
		);
		await waitFor(() => expect(getLevel("Claims Vectors")).toBeEnabled());
		expect(getLevel("Claims Vectors")).toHaveTextContent("Editor");
	});

	it("shows why a level change was refused above the table, and keeps the level the engine has", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error(
				"Only this engine's owners can change which apps and engines can use it",
			),
		);
		renderTable();
		await screen.findByText("Claims Vectors");

		fireEvent.click(getLevel("Claims Vectors"));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));

		expect(
			await screen.findByText(
				"Only this engine's owners can change which apps and engines can use it",
			),
		).toBeInTheDocument();
		expect(getLevel("Claims Vectors")).toHaveTextContent("Read-Only");
		expect(getResourcePermissions).toHaveBeenCalledTimes(1);
	});

	it("takes an engine's access away after a confirmation, then reads the engines again", async () => {
		vi.mocked(getResourcePermissions)
			.mockResolvedValueOnce(permissionsWith([VECTORS, GUARD]))
			.mockResolvedValue(permissionsWith([GUARD]));
		renderTable();
		await screen.findByText("Claims Vectors");

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Claims Vectors",
			}),
		);

		expect(
			await screen.findByRole("heading", {
				name: "Remove Access",
			}),
		).toBeInTheDocument();
		expect(savePermissionBatches).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Remove Access" }));

		await waitFor(() =>
			expect(
				screen.queryByText("Claims Vectors"),
			).not.toBeInTheDocument(),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						{
							action: "REMOVE",
							subject: {
								category: "ENGINE",
								id: "vectors1",
								type: "VECTOR",
							},
						},
					],
				},
			],
			false,
		);
		expect(screen.getByText("Prompt Guard")).toBeInTheDocument();
	});

	it("shows a refused removal in the confirmation, which stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("Claims Vectors has no access to this engine"),
		);
		renderTable();
		await screen.findByText("Claims Vectors");

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Claims Vectors",
			}),
		);
		fireEvent.click(
			await screen.findByRole("button", { name: "Remove Access" }),
		);

		expect(
			await screen.findByText(
				"Claims Vectors has no access to this engine",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Remove Access" }),
		).toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledTimes(1);
	});

	it("saves an engine's usage limit from its dialog, keeping its level and end date", async () => {
		renderTable({ isModel: true });

		fireEvent.click(
			await screen.findByRole("button", {
				name: /^Usage limit for Claims Vectors/,
			}),
		);

		expect(
			await screen.findByRole("heading", {
				name: "Usage Limit for Claims Vectors",
			}),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("radio", { name: "usageLimit.modes.notDefined" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Save Limit" }));

		await waitFor(() =>
			expect(getResourcePermissions).toHaveBeenCalledTimes(2),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "CHANGE",
							subject: {
								category: "ENGINE",
								id: "vectors1",
								type: "VECTOR",
							},
							to: {
								level: "READ_ONLY",
								endDate: "2027-01-01T00:00:00Z",
							},
						},
					],
				},
			],
			false,
		);
	});

	it("says why the engines could not be read, and reads them again on Try Again", async () => {
		vi.mocked(getResourcePermissions)
			.mockRejectedValueOnce(new Error("The engine could not be found"))
			.mockResolvedValue(permissionsWith([]));
		renderTable();

		expect(
			await screen.findByText(
				"Could not read the engines that can use this engine. The engine could not be found",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("No engines have access yet"),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		expect(
			await screen.findByText("No engines have access yet"),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/Could not read the engines/),
		).not.toBeInTheDocument();
	});

	it("reads and saves in admin mode when asked", async () => {
		renderTable({ admin: true });
		await screen.findByText("Claims Vectors");

		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "ENGINE", id: "engine-1" },
			true,
		);

		fireEvent.click(getLevel("Prompt Guard"));
		fireEvent.click(
			await screen.findByRole("option", { name: "Read-Only" }),
		);

		await waitFor(() =>
			expect(savePermissionBatches).toHaveBeenCalledTimes(1),
		);
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});
});
