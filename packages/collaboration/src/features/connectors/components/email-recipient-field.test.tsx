import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Form, useForm, zodResolver } from "@semoss/ui/next";
import {
	type EmailDraftValues,
	emailDraftSchema,
} from "../api/email-draft-values";
import { EmailRecipientField } from "./email-recipient-field";

function RecipientForm({
	onSave,
}: {
	onSave: (values: EmailDraftValues) => void;
}) {
	const form = useForm<EmailDraftValues>({
		resolver: zodResolver(emailDraftSchema),
		defaultValues: {
			to: "alex@example.com",
			cc: "",
			bcc: "",
			subject: "",
			body: "",
			replyAll: false,
			files: [],
		},
	});
	return (
		<Form form={form} onSubmit={onSave}>
			<EmailRecipientField name="to" label="To" disabled={false} />
			<Button type="submit">Save</Button>
		</Form>
	);
}

it("commits, edits and removes recipient chips while keeping native form submission separate", async () => {
	const user = userEvent.setup();
	const onSave = vi.fn();
	render(<RecipientForm onSave={onSave} />);
	const input = screen.getByRole("textbox", { name: "To" });
	await user.type(input, "team@example.com{Enter}");
	expect(onSave).not.toHaveBeenCalled();
	expect(
		screen.getByRole("button", {
			name: "Edit To recipient team@example.com",
		}),
	).toBeVisible();
	await user.click(
		screen.getByRole("button", {
			name: "Edit To recipient alex@example.com",
		}),
	);
	expect(input).toHaveFocus();
	expect(input).toHaveValue("alex@example.com");
	await user.keyboard("alex.chen@example.com{Enter}");
	expect(
		screen.queryByRole("button", {
			name: "Edit To recipient alex@example.com",
		}),
	).toBeNull();
	await user.click(
		screen.getByRole("button", { name: "Remove team@example.com from To" }),
	);
	expect(input).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() =>
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ to: "alex.chen@example.com" }),
			expect.anything(),
		),
	);
});

it("retains pasted lists and uncommitted typing, and lets Backspace reopen the last chip", async () => {
	const user = userEvent.setup();
	const onSave = vi.fn();
	render(<RecipientForm onSave={onSave} />);
	const input = screen.getByRole("textbox", { name: "To" });
	fireEvent.change(input, {
		target: { value: "one@example.com; two@example.com\n" },
	});
	await user.click(input);
	await user.keyboard("{Backspace}");
	expect(input).toHaveValue("two@example.com");
	await user.keyboard("three@example.com");
	// Submit without blur: draft retention and keyboard saving see all current text.
	fireEvent.submit(
		screen
			.getByRole("button", { name: "Save" })
			.closest("form") as HTMLFormElement,
	);
	await waitFor(() =>
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "alex@example.com, one@example.com, three@example.com",
			}),
			expect.anything(),
		),
	);
});
