import { useId } from "react";
import {
	Button,
	Form,
	FormInput,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { XlsxFileAccess } from "./xlsx-file-access";

const schema = z.object({
	password: z.string().min(1, "Enter the password to modify this workbook."),
});
type PasswordValues = z.infer<typeof schema>;

interface XlsxFileAccessNoticeProps {
	access: XlsxFileAccess;
	onEnableEditing: () => void;
	onUnlock: (password: string) => Promise<boolean>;
}

/** Explain the file's editing preference and keep passwords in this transient form only. */
export const XlsxFileAccessNotice = ({
	access,
	onEnableEditing,
	onUnlock,
}: XlsxFileAccessNoticeProps) => {
	const form = useForm<PasswordValues>({
		resolver: zodResolver(schema),
		defaultValues: { password: "" },
	});
	const helpId = useId();
	const handleSubmit = async ({
		password,
	}: PasswordValues): Promise<void> => {
		if (!(await onUnlock(password))) {
			form.setError("password", {
				message: "Incorrect password to modify this workbook.",
			});
			return;
		}
		form.reset({ password: "" });
	};
	return (
		<div className="shrink-0 border-border border-b bg-muted p-3 text-sm">
			{access.kind === "password" ? (
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="flex flex-wrap items-end gap-3"
				>
					<p className="w-full">
						This workbook is read-only. Enter its password to modify
						it.
					</p>
					<FormInput
						name="password"
						label="Password to modify"
						type="password"
						autoComplete="current-password"
						aria-describedby={helpId}
						description={
							<span id={helpId}>
								The password is used only to unlock editing in
								this session.
							</span>
						}
					/>
					<Button
						type="submit"
						size="sm"
						disabled={form.formState.isSubmitting}
					>
						Enable Editing
					</Button>
				</Form>
			) : (
				<div className="flex flex-wrap items-center gap-3">
					<p className="flex-1">
						{access.kind === "unsupported-password"
							? "This workbook has a modify-password setting this viewer cannot verify. Enable Editing continues without verifying that password."
							: "The author recommends opening this workbook read-only."}
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onEnableEditing}
					>
						Enable Editing
					</Button>
				</div>
			)}
		</div>
	);
};
