import { PackagePlus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormInput,
	FormTextarea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { MCPConfig } from "@/types";

interface SaveWorkspaceDialogProps {
	/** System prompt/instructions to save. */
	systemPrompt: string;
	/** MCPs to include in the saved agent. */
	mcps: MCPConfig[];
}

export const SaveWorkspaceDialog = observer(
	({ systemPrompt, mcps }: SaveWorkspaceDialogProps) => {
		const { chat } = useChat();
		const { t } = useTranslation("room");
		const [isOpen, setIsOpen] = useState(false);
		const form = useForm({
			resolver: zodResolver(
				z.object({
					name: z.string().trim().min(1, t("workspace.nameRequired")),
					description: z.string(),
				}),
			),
			defaultValues: { name: "", description: "" },
		});
		const isLoading = form.formState.isSubmitting;
		const close = () => {
			if (isLoading) return;
			setIsOpen(false);
			form.reset();
		};
		const save = async ({
			name,
			description,
		}: {
			name: string;
			description: string;
		}) => {
			form.clearErrors("root.server");
			try {
				await chat.addWorkspace({
					name,
					description,
					system_prompt: systemPrompt,
					mcp: mcps,
					skills: [],
					prompts: [],
				});
			} catch (error) {
				form.setError("root.server", {
					message: t("workspace.publishError", {
						error:
							error instanceof Error
								? error.message
								: String(error),
					}),
				});
				return;
			}
			toast.success(t("workspace.publishSuccess"));
			setIsOpen(false);
			form.reset();
		};
		return (
			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (open) setIsOpen(true);
					else close();
				}}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={t("workspace.publishTooltip")}
							>
								<PackagePlus aria-hidden="true" />
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent>
						{t("workspace.publishTooltip")}
					</TooltipContent>
				</Tooltip>
				<DialogContent
					className="max-h-[90dvh] overflow-y-auto"
					showCloseButton={!isLoading}
				>
					<DialogHeader>
						<DialogTitle>{t("workspace.publishTitle")}</DialogTitle>
						<DialogDescription>
							{t("workspace.publishDescription")}
						</DialogDescription>
					</DialogHeader>
					<Form
						form={form}
						onSubmit={save}
						noValidate
						aria-busy={isLoading}
						className="flex flex-col gap-4"
					>
						<FormInput
							name="name"
							label={t("workspace.nameLabel")}
							placeholder={t("workspace.namePlaceholder")}
							required
							disabled={isLoading}
						/>
						<FormTextarea
							name="description"
							label={t("workspace.descriptionLabel")}
							placeholder={t("workspace.descriptionPlaceholder")}
							rows={3}
							disabled={isLoading}
						/>
						{form.formState.errors.root?.server?.message && (
							<Alert variant="destructive">
								<AlertDescription>
									{form.formState.errors.root.server.message}
								</AlertDescription>
							</Alert>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={close}
								disabled={isLoading}
							>
								{t("workspace.cancelButton")}
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Spinner />}
								{t(
									isLoading
										? "workspace.publishingButton"
										: "workspace.publishButton",
								)}
							</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
