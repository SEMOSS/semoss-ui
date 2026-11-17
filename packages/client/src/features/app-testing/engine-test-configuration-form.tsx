import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormSelect,
	SelectItem,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	createAppTestDatabase,
	deleteEngineTestConfiguration,
	saveEngineTestConfiguration,
} from "@/api/app-testing";
import type { EngineTestConfiguration } from "./app-test.types";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120),
	realEngineId: z
		.string()
		.trim()
		.min(1, "Real database ID is required")
		.max(128),
	testEngineId: z
		.string()
		.trim()
		.min(1, "Test database ID is required")
		.max(128),
	databaseType: z.enum(["H2_DB", "SQLITE"]),
});

interface EngineTestConfigurationFormProps {
	appId: string;
	configuration: EngineTestConfiguration | null;
	/** Prevent profile changes while a recording, draft, preview mode or run uses it. */
	isLocked: boolean;
	onChanged: () => void;
}

/** Manage app-local database mappings and provision empty test storage without cloning production data. */
export const EngineTestConfigurationForm = ({
	appId,
	configuration,
	isLocked,
	onChanged,
}: EngineTestConfigurationFormProps) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: configuration?.name || "Test databases",
			realEngineId: "",
			testEngineId: "",
			databaseType: "H2_DB",
		},
	});
	const [isCreating, setIsCreating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [notice, setNotice] = useState("");
	const isBusy = form.formState.isSubmitting || isCreating || isDeleting;
	const disabled = isLocked || isBusy;
	const error = form.formState.errors.root?.server?.message;
	const showError = (failure: unknown): void =>
		form.setError("root.server", {
			type: "server",
			message:
				failure instanceof Error
					? failure.message
					: "Could not update test databases",
		});

	const handleSubmit = async (
		values: z.infer<typeof schema>,
	): Promise<void> => {
		form.clearErrors("root.server");
		try {
			await saveEngineTestConfiguration(appId, {
				...(configuration ? { id: configuration.id } : {}),
				name: values.name,
				mappings: [
					...(configuration?.mappings || []).filter(
						(pair) => pair.realEngineId !== values.realEngineId,
					),
					{
						realEngineId: values.realEngineId,
						testEngineId: values.testEngineId,
					},
				],
			});
		} catch (failure: unknown) {
			showError(failure);
			return;
		}
		setNotice(
			"Test database mapping saved. Normal app sessions keep their original connections.",
		);
		onChanged();
	};
	const handleCreate = async (): Promise<void> => {
		setIsCreating(true);
		form.clearErrors("root.server");
		setNotice("");
		try {
			const id = await createAppTestDatabase(
				appId,
				`${form.getValues("name") || "App"} ${Date.now()}`,
				form.getValues("databaseType"),
			);
			form.setValue("testEngineId", id, {
				shouldDirty: true,
				shouldValidate: true,
			});
			setNotice(
				"Created an empty test database. Add the app's schema and fixture data before recording, then save its mapping.",
			);
		} catch (failure: unknown) {
			showError(failure);
		} finally {
			setIsCreating(false);
		}
	};
	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		form.clearErrors("root.server");
		try {
			await deleteEngineTestConfiguration(appId);
		} catch (failure: unknown) {
			showError(failure);
			return;
		} finally {
			setIsDeleting(false);
		}
		onChanged();
	};
	return (
		<details className="mb-3 border-b pb-3">
			<summary className="cursor-pointer font-medium text-sm">
				Test database configuration
				{configuration
					? ` · ${configuration.mappings.length} mappings`
					: ""}
			</summary>
			<p className="mt-2 text-muted-foreground text-sm">
				Map real database IDs to dedicated local H2/SQLite test engines.
				Recording reloads the preview into test mode; replay uses the
				same mappings. Python calls through SEMOSS engine APIs are
				included. Direct database connections need separate test
				credentials and are outside this routing.
			</p>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="mt-3 flex flex-col gap-3"
			>
				{configuration && (
					<ul className="flex flex-col gap-2 text-sm">
						{configuration.mappings.map((pair) => (
							<li key={pair.realEngineId} className="break-all">
								{pair.realEngineId} → {pair.testEngineId}
							</li>
						))}
					</ul>
				)}
				<FormInput
					name="name"
					label="Test configuration name (required)"
					required
					disabled={disabled}
				/>
				<FormInput
					name="realEngineId"
					label="Real database ID (required)"
					required
					disabled={disabled}
				/>
				<FormInput
					name="testEngineId"
					label="Test database ID (required)"
					required
					disabled={disabled}
				/>
				<FormSelect
					name="databaseType"
					label="New test database type"
					disabled={disabled}
				>
					<SelectItem value="H2_DB">H2</SelectItem>
					<SelectItem value="SQLITE">SQLite</SelectItem>
				</FormSelect>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={disabled}
						onClick={() => void handleCreate()}
					>
						{isCreating && <Spinner className="size-4" />}Create
						empty test database
					</Button>
					<Button type="submit" size="sm" disabled={disabled}>
						Save database mapping
					</Button>
					{configuration && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={disabled}
							onClick={() => void handleDelete()}
						>
							Remove configuration
						</Button>
					)}
				</div>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{notice && (
					<output className="text-muted-foreground text-sm">
						{notice}
					</output>
				)}
				{configuration && (
					<p className="text-muted-foreground text-sm">
						Removing the configuration leaves its databases intact.
						Recordings that require it will stop rather than use
						production.
					</p>
				)}
			</Form>
		</details>
	);
};
