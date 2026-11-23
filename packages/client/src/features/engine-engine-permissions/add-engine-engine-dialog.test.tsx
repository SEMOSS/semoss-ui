import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { savePermissionBatches } from "@semoss/sdk";
import type { EngineSelect } from "@semoss/shared";
import { AddEngineEngineDialog } from "./add-engine-engine-dialog";
import type { EngineGranteeModel } from "./engine-engine-permissions";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	savePermissionBatches: vi.fn(),
}));

/** The engine the stand-in picker picks; a test sets it before a click */
let pickedEngineId = "vectors1";

/**
 * The shared picker reads MyEngines; this one is a button that picks the Claims
 * Vectors vector database (or the engine a test names), with the field wiring
 * the dialog gives the real one and the list the dialog asks it for.
 */
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	EngineSelect: ({
		id,
		name,
		onChange,
		ref,
		engineTypes,
		admin,
		"aria-describedby": describedBy,
		"aria-invalid": isInvalid,
	}: ComponentProps<typeof EngineSelect>) => (
		<button
			ref={ref}
			id={id}
			type="button"
			data-engine-types={engineTypes?.join(",")}
			data-admin={admin}
			aria-describedby={describedBy}
			aria-invalid={isInvalid}
			onClick={() =>
				onChange({
					engine_id: pickedEngineId,
					engine_name: "claims_vectors",
					engine_display_name: "Claims Vectors",
					engine_type: "VECTOR",
					engine_subtype: "FAISS",
				})
			}
		>
			{name || "Select"}
		</button>
	),
}));

/** A model whose owner is adding the engine, so the Engine Limit is offered */
const OWNED_MODEL: EngineGranteeModel = {
	isCostAvailable: true,
	canChangeLimit: true,
};

/** Opens the dialog for an engine, returning its onClose */
const renderDialog = (model?: EngineGranteeModel, engineId = "engine-1") => {
	const onClose = vi.fn();
	render(
		<AddEngineEngineDialog
			open
			engineId={engineId}
			model={model}
			onClose={onClose}
		/>,
	);
	return onClose;
};

const getEngine = () => screen.getByLabelText("Engine");

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

/** The batch that adds the picked vector database to an engine */
const addedVectors = (engineId: string, to: unknown) => [
	{
		target: { resourceType: "ENGINE", id: engineId },
		changes: [
			{
				action: "ADD",
				subject: { category: "ENGINE", id: "vectors1", type: "VECTOR" },
				to,
			},
		],
	},
];

describe("AddEngineEngineDialog", () => {
	beforeEach(() => {
		pickedEngineId = "vectors1";
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

	it("asks for an engine only once Authorize Access is pressed without one", async () => {
		const onClose = renderDialog();

		expect(getAuthorize()).toBeEnabled();
		expect(getEngine()).toHaveAttribute("aria-invalid", "false");
		expect(screen.queryByText("Pick an engine")).not.toBeInTheDocument();

		fireEvent.click(getAuthorize());

		expect(await screen.findByText("Pick an engine")).toBeInTheDocument();
		expect(getEngine()).toHaveAttribute("aria-invalid", "true");
		expect(getEngine()).toHaveAccessibleDescription("Pick an engine");
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.click(getEngine());

		await waitFor(() =>
			expect(
				screen.queryByText("Pick an engine"),
			).not.toBeInTheDocument(),
		);
		expect(getEngine()).toHaveTextContent("Claims Vectors");
	});

	it("gives the picked engine Read-Only access by its id and type unless another level is chosen, and closes", async () => {
		const onClose = renderDialog();

		fireEvent.click(getEngine());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("vectors1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			addedVectors("engine-1", { level: "READ_ONLY", endDate: null }),
			false,
		);
	});

	it("gives the picked engine Editor access when it is chosen", async () => {
		const onClose = renderDialog();

		fireEvent.click(getEngine());
		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("vectors1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			addedVectors("engine-1", { level: "EDIT", endDate: null }),
			false,
		);
	});

	it("refuses the engine itself before saving", async () => {
		pickedEngineId = "engine-1";
		const onClose = renderDialog();

		fireEvent.click(getEngine());
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText(
				"An engine cannot be given a permission on itself",
			),
		).toBeInTheDocument();
		expect(getEngine()).toHaveAttribute("aria-invalid", "true");
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("offers no Author level and no usage limit on an engine that is not a model", async () => {
		renderDialog();

		expect(
			screen.queryByRole("radio", { name: "usageLimit.modes.rules" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));

		expect(
			await screen.findByRole("option", { name: "Read-Only" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Editor" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("option", { name: "Author" }),
		).not.toBeInTheDocument();
	});

	it("keeps Authorize Access enabled for an incomplete engine limit, and shows why only when it is pressed", async () => {
		const onClose = renderDialog(OWNED_MODEL, "model-1");

		fireEvent.click(getEngine());
		fireEvent.click(
			screen.getByRole("radio", { name: "usageLimit.modes.rules" }),
		);

		const amount = screen.getByRole("textbox", {
			name: "usageLimit.rule.amount",
		});
		expect(amount).toHaveAttribute("aria-invalid", "false");
		expect(getAuthorize()).toBeEnabled();

		fireEvent.click(getAuthorize());

		await waitFor(() =>
			expect(amount).toHaveAttribute("aria-invalid", "true"),
		);
		await waitFor(() => expect(amount).toHaveFocus());
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.change(amount, { target: { value: "5000" } });
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("vectors1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			addedVectors("model-1", {
				level: "READ_ONLY",
				endDate: null,
				usageLimit: {
					unlimited: false,
					rules: [
						{
							metric: "TOKENS",
							amount: 5000,
							window: "DAY",
							counts: "SHARED",
						},
					],
				},
			}),
			false,
		);
	});

	it("adds the engine with no limit from a user who cannot set usage limits, and says why", async () => {
		const onClose = renderDialog(
			{ isCostAvailable: true, canChangeLimit: false },
			"model-1",
		);

		expect(
			screen.queryByRole("radio", { name: "usageLimit.modes.rules" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(/Only owners can set usage limits/),
		).toBeInTheDocument();

		fireEvent.click(getEngine());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("vectors1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			addedVectors("model-1", { level: "READ_ONLY", endDate: null }),
			false,
		);
	});

	it("offers the engines the user can see, of the types whose code calls other engines", () => {
		renderDialog();

		expect(getEngine()).toHaveAttribute(
			"data-engine-types",
			"MODEL,VECTOR,GUARDRAIL,FUNCTION,DATABASE,STORAGE",
		);
		expect(getEngine()).toHaveAttribute("data-admin", "false");
	});

	it("offers every engine and saves in admin mode when asked", async () => {
		const onClose = vi.fn();
		render(
			<AddEngineEngineDialog
				open
				engineId="engine-1"
				admin
				onClose={onClose}
			/>,
		);

		expect(getEngine()).toHaveAttribute("data-admin", "true");
		fireEvent.click(getEngine());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("vectors1"));
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});

	it("shows the backend's refusal for an engine that already has access, and stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("engine vectors1 already has access"),
		);
		const onClose = renderDialog();

		fireEvent.click(getEngine());
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("engine vectors1 already has access"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await waitFor(() => expect(getAuthorize()).toBeEnabled());
		expect(getEngine()).toHaveTextContent("Claims Vectors");
	});

	it("closes without saving on Cancel", () => {
		const onClose = renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith();
		expect(savePermissionBatches).not.toHaveBeenCalled();
	});
});
