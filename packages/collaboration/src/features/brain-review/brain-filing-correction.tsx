import { useId } from "react";
import {
	Button,
	Field,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const correctionSchema = z.object({
	threadId: z.string().min(1, "Choose a thread to move."),
});
interface BrainFilingCorrectionProps {
	threads: { id: string; name: string }[];
	isBusy: boolean;
	/** Creates a question; the existing filing stays unchanged until its inline answer. */
	onRequest: (threadId: string) => Promise<boolean>;
}
/** Gives the owner an explicit route to correct even a high-confidence or owner-made filing. */
export function BrainFilingCorrection({
	threads,
	isBusy,
	onRequest,
}: BrainFilingCorrectionProps) {
	const id = useId();
	const form = useForm<z.infer<typeof correctionSchema>>({
		resolver: zodResolver(correctionSchema),
		defaultValues: { threadId: "" },
	});
	return (
		<details className="border-b px-4 py-4 md:px-6">
			<Button
				asChild
				variant="outline"
				className="min-h-11 cursor-pointer"
			>
				<summary>Start a topic change</summary>
			</Button>
			<P className="mt-2 text-muted-foreground text-sm">
				Want to move a thread to another topic? Select it here to open a
				change request below. This does not filter the list or move the
				thread.
			</P>
			<Form
				form={form}
				onSubmit={async (values) => {
					await onRequest(values.threadId);
				}}
				noValidate
				className="mt-4 flex flex-wrap items-end gap-3"
			>
				<FormField
					control={form.control}
					name="threadId"
					render={({ field, fieldState }) => (
						<Field
							className="min-w-0 flex-1 basis-60"
							data-invalid={Boolean(fieldState.error)}
						>
							<FieldLabel htmlFor={`${id}-thread`}>
								Thread to move
							</FieldLabel>
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isBusy || threads.length === 0}
							>
								<SelectTrigger
									id={`${id}-thread`}
									ref={field.ref}
									onBlur={field.onBlur}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? `${id}-error`
											: undefined
									}
									className="min-h-11 w-full"
								>
									<SelectValue
										placeholder={
											threads.length
												? "Select a thread to change"
												: "No filed conversations yet"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{threads.map((thread) => (
										<SelectItem
											key={thread.id}
											value={thread.id}
										>
											{thread.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{fieldState.error && (
								<FieldError id={`${id}-error`}>
									{fieldState.error.message}
								</FieldError>
							)}
						</Field>
					)}
				/>
				<Button
					type="submit"
					variant="outline"
					disabled={isBusy || threads.length === 0}
					className="min-h-11"
				>
					Open topic change
				</Button>
			</Form>
		</details>
	);
}
