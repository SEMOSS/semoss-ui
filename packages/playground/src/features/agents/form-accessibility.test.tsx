import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useId } from "react";
import { expect, test, vi } from "vitest";
import {
	Button,
	Form,
	FormInput,
	FormTextarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

test("associates field labels, caller hints and validation errors and retains values after a rejected save", async () => {
	const save = vi
		.fn()
		.mockRejectedValueOnce(new Error("Save failed"))
		.mockResolvedValueOnce(undefined);
	function Example() {
		const id = useId();
		const form = useForm({
			resolver: zodResolver(
				z.object({
					name: z.string().min(1, "Name required"),
					instructions: z.string().min(1, "Instructions required"),
				}),
			),
			defaultValues: { name: "", instructions: "" },
		});
		return (
			<Form
				form={form}
				noValidate
				onSubmit={async (values) => {
					try {
						await save(values);
					} catch {
						form.setError("root.server", {
							message: "Save failed",
						});
					}
				}}
			>
				<p id={`${id}-caller-hint`}>Shared hint</p>
				<FormInput
					id={`${id}-agent-name`}
					name="name"
					label="Name"
					description="Name hint"
					aria-describedby={`${id}-caller-hint`}
				/>
				<FormTextarea
					id={`${id}-agent-instructions`}
					name="instructions"
					label="Instructions"
					description="Instructions hint"
				/>
				{form.formState.errors.root?.server && (
					<p role="alert">
						{form.formState.errors.root.server.message}
					</p>
				)}
				<Button type="submit" disabled={form.formState.isSubmitting}>
					Save
				</Button>
			</Form>
		);
	}
	render(<Example />);
	const name = screen.getByLabelText("Name");
	const instructions = screen.getByLabelText("Instructions");
	expect(name.id).toMatch(/-agent-name$/);
	expect(name).toHaveAccessibleDescription("Shared hint Name hint");
	fireEvent.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
	expect(name).toHaveAccessibleDescription(
		"Shared hint Name hint Name required",
	);
	expect(instructions).toHaveAccessibleDescription(
		"Instructions hint Instructions required",
	);
	expect(save).not.toHaveBeenCalled();
	fireEvent.change(name, { target: { value: "Research" } });
	fireEvent.change(instructions, { target: { value: "Cite references" } });
	fireEvent.click(screen.getByRole("button", { name: "Save" }));
	await screen.findByText("Save failed");
	expect(name).toHaveValue("Research");
	expect(instructions).toHaveValue("Cite references");
	fireEvent.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
});
