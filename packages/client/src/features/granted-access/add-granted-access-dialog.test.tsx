import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { savePermissionBatches, validatePermissionBatches } from "@semoss/sdk";
import type {
	Engine,
	EngineSelect,
	Project,
	ProjectSelect,
} from "@semoss/shared";
import { AddGrantedAccessDialog } from "./add-granted-access-dialog";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	savePermissionBatches: vi.fn(),
	validatePermissionBatches: vi.fn(),
}));

/**
 * The config resources, such as MODEL or SKILL, whose give-access setting a
 * test keeps for admins; every other one is open
 */
let adminOnlyAccess: string[] = [];

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useConfig: (
		selector: (state: {
			isAdminOnly: (resource: string, operation: string) => boolean;
		}) => unknown,
	) =>
		selector({
			isAdminOnly: (resource, operation) =>
				operation === "access" && adminOnlyAccess.includes(resource),
		}),
}));

const AGENT: Project = {
	project_id: "agent1",
	project_name: "orders_agent",
	project_display_name: "Orders Agent",
	project_type: "WORKSPACE",
};

const APP: Project = {
	project_id: "app1",
	project_name: "intake_form",
	project_display_name: "Intake Form",
	project_type: "CODE",
};

const SKILL: Project = {
	project_id: "skill1",
	project_name: "orders_skill",
	project_display_name: "Orders Skill",
	project_type: "SKILL",
};

const MODEL: Engine = {
	engine_id: "model1",
	engine_name: "orders_model",
	engine_display_name: "Orders Model",
	engine_type: "MODEL",
	engine_subtype: "OPEN_AI",
};

/** What the stand-in pickers pick next; a test sets them before a click */
let nextProject: Project = AGENT;
let nextEngine: Engine = MODEL;

/**
 * The shared pickers read the catalog; these are buttons that pick what a test
 * names, with the field wiring and the types the dialog asks them for.
 */
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	ProjectSelect: ({
		id,
		name,
		onChange,
		projectTypes,
		isOwnedOnly,
	}: ComponentProps<typeof ProjectSelect>) => (
		<button
			id={id}
			type="button"
			data-types={projectTypes?.join(",")}
			data-owned-only={isOwnedOnly ? "true" : undefined}
			onClick={() => onChange(nextProject)}
		>
			{name || "Select a project"}
		</button>
	),
	EngineSelect: ({
		id,
		name,
		onChange,
		engineTypes,
		isOwnedOnly,
	}: ComponentProps<typeof EngineSelect>) => (
		<button
			id={id}
			type="button"
			data-types={engineTypes?.join(",")}
			data-owned-only={isOwnedOnly ? "true" : undefined}
			onClick={() => onChange(nextEngine)}
		>
			{name || "Select an engine"}
		</button>
	),
}));

/** Renders the dialog, in admin mode unless asked, returning its onClose */
const renderDialog = (admin = true) => {
	const onClose = vi.fn();
	render(<AddGrantedAccessDialog open admin={admin} onClose={onClose} />);
	return onClose;
};

const choose = (name: RegExp) =>
	fireEvent.click(screen.getByRole("radio", { name }));

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

/** The change that adds a grantee, with no end date and no limit */
const added = (id: string, type: string) => ({
	action: "ADD",
	subject: { category: "ENGINE", id, type },
	to: { level: "READ_ONLY", endDate: null },
});

describe("AddGrantedAccessDialog", () => {
	beforeEach(() => {
		nextProject = AGENT;
		nextEngine = MODEL;
		adminOnlyAccess = [];
		vi.mocked(savePermissionBatches)
			.mockReset()
			.mockResolvedValue({ targets: 1, changes: 1 });
		vi.mocked(validatePermissionBatches)
			.mockReset()
			.mockImplementation(async (batches) =>
				batches.map((batch) => ({
					target: batch.target,
					reason: null,
					changes: batch.changes.map((_, index) => ({
						index,
						allowed: true,
						reason: null,
					})),
				})),
			);
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

	it("asks for the one to start from and something to add only once Authorize Access is pressed", async () => {
		renderDialog();
		expect(
			screen.queryByText("Pick one to start from"),
		).not.toBeInTheDocument();

		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("Pick one to start from"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Pick at least one to add"),
		).toBeInTheDocument();
		expect(validatePermissionBatches).not.toHaveBeenCalled();
	});

	it("starts from what gets access: gives an agent a skill, one batch on the skill", async () => {
		const onClose = renderDialog();
		fireEvent.click(screen.getByLabelText("App or Agent"));
		nextProject = SKILL;
		fireEvent.click(screen.getByLabelText("Project It Can Use"));
		expect(
			within(
				screen.getByRole("region", { name: /It Can Use/ }),
			).getByText("Orders Skill"),
		).toBeInTheDocument();

		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
		const batches = [
			{
				target: { resourceType: "PROJECT", id: "skill1" },
				changes: [added("agent1", "PROJECT")],
			},
		];
		expect(validatePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			batches,
			true,
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			batches,
			true,
		);
	});

	it("starts from what is shared: gives an agent and an app a model, one batch on the model", async () => {
		const onClose = renderDialog();
		choose(/What Is Shared/);
		choose(/Apps and Agents That Use Engines/);
		fireEvent.click(screen.getByLabelText("Engine to Share"));
		fireEvent.click(screen.getByLabelText("App or Agent That Can Use It"));
		nextProject = APP;
		fireEvent.click(screen.getByLabelText("App or Agent That Can Use It"));
		expect(screen.getByText("App Limit")).toBeInTheDocument();

		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model1" },
					changes: [
						added("agent1", "PROJECT"),
						added("app1", "PROJECT"),
					],
				},
			],
			true,
		);
	});

	it("limits both pickers to the kind's types and never adds the one started from", () => {
		renderDialog();
		expect(screen.getByLabelText("App or Agent")).toHaveAttribute(
			"data-types",
			"CODE,BLOCKS,WORKSPACE",
		);

		choose(/Engines That Use Engines/);

		expect(screen.getByLabelText("Engine")).toHaveAttribute(
			"data-types",
			"MODEL,VECTOR,GUARDRAIL,FUNCTION,DATABASE,STORAGE",
		);
		expect(screen.getByLabelText("Engine It Can Use")).toHaveAttribute(
			"data-types",
			"DATABASE,MODEL,STORAGE,FUNCTION,VECTOR,GUARDRAIL",
		);
		fireEvent.click(screen.getByLabelText("Engine"));
		fireEvent.click(screen.getByLabelText("Engine It Can Use"));
		expect(screen.getByRole("status")).toHaveTextContent(
			"Orders Model is the one you started from.",
		);
	});

	it("outside admin mode offers only the types the user can share, lists only what the user owns, and names what admins share", () => {
		adminOnlyAccess = ["SKILL", "MODEL"];
		renderDialog(false);

		expect(
			screen.getByText(
				"Only admins can give access to skills and models, from All Resource Delegated Access in admin mode.",
			),
		).toBeInTheDocument();
		expect(screen.getByLabelText("App or Agent")).not.toHaveAttribute(
			"data-owned-only",
		);
		expect(screen.getByLabelText("Project It Can Use")).toHaveAttribute(
			"data-types",
			"CODE,BLOCKS,WORKSPACE,NOTEBOOK,AUTOMATION",
		);
		expect(screen.getByLabelText("Project It Can Use")).toHaveAttribute(
			"data-owned-only",
			"true",
		);

		choose(/What Is Shared/);
		choose(/Apps and Agents That Use Engines/);

		expect(screen.getByLabelText("Engine to Share")).toHaveAttribute(
			"data-types",
			"DATABASE,STORAGE,FUNCTION,VECTOR,GUARDRAIL",
		);
		expect(screen.getByLabelText("Engine to Share")).toHaveAttribute(
			"data-owned-only",
			"true",
		);
		expect(
			screen.getByLabelText("App or Agent That Can Use It"),
		).not.toHaveAttribute("data-owned-only");
		expect(
			screen.getByText(/Only the ones you own are listed\./),
		).toBeInTheDocument();
	});

	it("leaves out a kind of access with no type the user can share", () => {
		adminOnlyAccess = [
			"DATABASE",
			"MODEL",
			"STORAGE",
			"FUNCTION",
			"VECTOR",
			"GUARDRAIL",
		];
		renderDialog(false);

		expect(
			screen.getByRole("radio", {
				name: /Apps and Agents That Use Projects/,
			}),
		).toBeChecked();
		expect(
			screen.queryByRole("radio", {
				name: /Apps and Agents That Use Engines/,
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("radio", { name: /Engines That Use Engines/ }),
		).not.toBeInTheDocument();
	});

	it("offers every type in admin mode, whatever the config keeps for admins", () => {
		adminOnlyAccess = ["SKILL", "MODEL"];
		renderDialog();

		expect(
			screen.queryByText(/Only admins can give access/),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText("Project It Can Use")).toHaveAttribute(
			"data-types",
			"CODE,BLOCKS,WORKSPACE,SKILL,NOTEBOOK,AUTOMATION",
		);
		expect(
			screen.queryByText(/Only the ones you own are listed/),
		).not.toBeInTheDocument();
	});

	it("starts the picks over when the kind changes", () => {
		renderDialog();
		fireEvent.click(screen.getByLabelText("App or Agent"));
		expect(screen.getByLabelText("App or Agent")).toHaveTextContent(
			"Orders Agent",
		);

		choose(/Apps and Agents That Use Engines/);

		expect(screen.getByLabelText("App or Agent")).toHaveTextContent(
			"Select a project",
		);
	});

	it("lists what the backend refuses and saves nothing", async () => {
		vi.mocked(validatePermissionBatches).mockResolvedValue([
			{
				target: { resourceType: "PROJECT", id: "skill1" },
				reason: null,
				changes: [
					{
						index: 0,
						allowed: false,
						reason: "Only this project's owners can change it",
					},
				],
			},
		]);
		const onClose = renderDialog();
		fireEvent.click(screen.getByLabelText("App or Agent"));
		nextProject = SKILL;
		fireEvent.click(screen.getByLabelText("Project It Can Use"));
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText(
				"Orders Agent on Orders Skill: Only this project's owners can change it",
			),
		).toBeInTheDocument();
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("keeps the refused changes while the picks change, until they are closed", async () => {
		vi.mocked(validatePermissionBatches).mockResolvedValue([
			{
				target: { resourceType: "PROJECT", id: "skill1" },
				reason: null,
				changes: [
					{
						index: 0,
						allowed: false,
						reason: "Orders Agent already has access",
					},
				],
			},
		]);
		renderDialog();
		fireEvent.click(screen.getByLabelText("App or Agent"));
		nextProject = SKILL;
		fireEvent.click(screen.getByLabelText("Project It Can Use"));
		fireEvent.click(getAuthorize());
		const refusal =
			"Orders Agent on Orders Skill: Orders Agent already has access";
		expect(await screen.findByText(refusal)).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove Orders Skill from the list",
			}),
		);

		expect(screen.getByText(refusal)).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: "Close the refused changes" }),
		);

		expect(screen.queryByText(refusal)).not.toBeInTheDocument();
	});

	it("shows only what the latest Authorize Access finds", async () => {
		vi.mocked(validatePermissionBatches).mockResolvedValueOnce([
			{
				target: { resourceType: "PROJECT", id: "skill1" },
				reason: null,
				changes: [
					{
						index: 0,
						allowed: false,
						reason: "Orders Agent already has access",
					},
				],
			},
		]);
		renderDialog();
		fireEvent.click(screen.getByLabelText("App or Agent"));
		nextProject = SKILL;
		fireEvent.click(screen.getByLabelText("Project It Can Use"));
		fireEvent.click(getAuthorize());
		const refusal =
			"Orders Agent on Orders Skill: Orders Agent already has access";
		expect(await screen.findByText(refusal)).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove Orders Skill from the list",
			}),
		);
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("Pick at least one to add"),
		).toBeInTheDocument();
		expect(screen.queryByText(refusal)).not.toBeInTheDocument();
	});
});
