import { useId } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
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
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	Form,
	FormRadioGroup,
	FormTextarea,
	RadioGroupItem,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { requestCatalogAccess } from "@/api/user-access";
import {
	DEPENDENCY_ACCESS_LEVEL_LABELS,
	type DependencyAccessLevel,
} from "./catalog-dependency";
import type { CatalogGraphNode } from "./catalog-dependency-graph";

/** Props for {@link RequestDependencyAccessDialog}. */
interface RequestDependencyAccessDialogProps {
	/** The item to ask for */
	target: Pick<CatalogGraphNode, "id" | "kind" | "name">;
	/** The owner whose dependency it is, for the starting reason */
	ownerName: string;
	/** Called when the dialog closes, with whether the request was sent */
	onClose: (didRequest: boolean) => void;
}

const LEVELS = [
	{
		value: "READ_ONLY",
		description: "Use it. Enough for what depends on it to work for you.",
	},
	{
		value: "EDIT",
		description: "Change it, and everything Read-only allows.",
	},
	{
		value: "OWNER",
		description:
			"Manage it and who has access, and everything Editor allows.",
	},
] as const satisfies readonly {
	value: DependencyAccessLevel;
	description: string;
}[];

const schema = z.object({
	level: z.enum(["READ_ONLY", "EDIT", "OWNER"]),
	reason: z.string().trim().max(1000, "Use 1,000 characters or fewer"),
});

type RequestAccessValues = z.infer<typeof schema>;

/**
 * Asks the owners of one dependency for access: a level and a reason, sent
 * with the engine or project request its kind takes. A refusal shows the
 * backend's reason and the dialog stays open to try again.
 */
export const RequestDependencyAccessDialog = ({
	target,
	ownerName,
	onClose,
}: RequestDependencyAccessDialogProps) => {
	const { insightId } = useSessionInsight();
	const idPrefix = useId();
	const form = useForm<RequestAccessValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			level: "READ_ONLY",
			reason: `I need access to use ${ownerName}.`,
		},
	});
	const { errors, isSubmitting } = form.formState;
	const serverError = errors.root?.server?.message;

	const handleSubmit = async ({
		level,
		reason,
	}: RequestAccessValues): Promise<void> => {
		try {
			await requestCatalogAccess(
				insightId,
				target.kind,
				target.id,
				level,
				reason,
			);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(error, "The request was refused"),
			});
			return;
		}
		toast.success("Access requested. Its owners will be notified.");
		onClose(true);
	};

	return (
		<Dialog
			open={true}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) {
					onClose(false);
				}
			}}
		>
			<DialogContent
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>{`Request Access to ${target.name}`}</DialogTitle>
					<DialogDescription>
						Its owners decide. You can change or withdraw a request
						from the item's page.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-6"
				>
					<FormRadioGroup
						name="level"
						label="Access Level"
						disabled={isSubmitting}
						className="gap-3"
					>
						{LEVELS.map(({ value, description }) => {
							const radioId = `${idPrefix}-level-${value}`;
							return (
								<Field
									key={value}
									orientation="horizontal"
									className="items-start"
								>
									<RadioGroupItem
										id={radioId}
										value={value}
										aria-describedby={`${radioId}-description`}
									/>
									<FieldContent>
										<FieldLabel htmlFor={radioId}>
											{
												DEPENDENCY_ACCESS_LEVEL_LABELS[
													value
												]
											}
										</FieldLabel>
										<FieldDescription
											id={`${radioId}-description`}
										>
											{description}
										</FieldDescription>
									</FieldContent>
								</Field>
							);
						})}
					</FormRadioGroup>
					<FormTextarea
						name="reason"
						label="Reason (Optional)"
						rows={3}
						disabled={isSubmitting}
					/>
					{serverError ? (
						<Alert variant="destructive">
							<AlertDescription>{serverError}</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onClose(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							{isSubmitting
								? "Requesting..."
								: serverError
									? "Try Again"
									: "Request Access"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
