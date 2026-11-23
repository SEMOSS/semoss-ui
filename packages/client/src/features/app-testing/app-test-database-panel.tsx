import { useEffect, useMemo, useRef, useState } from "react";
import { Env } from "@semoss/sdk";
import { useSessionPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Form,
	FormInput,
	FormSwitch,
	FormTextarea,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	closeAppTestDatabase,
	openAppTestDatabase,
	parseAppTestDatabase,
	saveAppTestDatabase,
} from "@/api/app-testing";

const schema = z
	.object({
		enabled: z.boolean(),
		sourceEngineId: z.string().trim().max(128),
		schemaSql: z.string().max(180000),
		seedSql: z.string().max(180000),
	})
	.superRefine((value, context) => {
		if (!value.enabled) return;
		if (!/^[A-Za-z0-9_-]+$/.test(value.sourceEngineId))
			context.addIssue({
				code: "custom",
				path: ["sourceEngineId"],
				message: "Enter the H2 database ID used by this app",
			});
		if (!value.schemaSql.trim())
			context.addIssue({
				code: "custom",
				path: ["schemaSql"],
				message: "Provide CREATE TABLE statements for the test schema",
			});
	});

interface AppTestDatabasePanelProps {
	/** App whose fixture configuration is edited. */
	appId: string;
	/** The ordinary app iframe, temporarily navigated into a test preview. */
	frame: HTMLIFrameElement | null;
	/** Recording, draft editing and replay prevent replacing the preview. */
	isBusy: boolean;
	/** Refresh recording controls when the saved database mode changes. */
	onConfigurationSaved: () => void;
}

interface PreviewResource {
	frame: HTMLIFrameElement;
	originalUrl: string;
	previewUrl: string;
	environmentId: string;
}

/** Configure synthetic H2 fixtures and temporarily open the app against disposable state. */
export const AppTestDatabasePanel = ({
	appId,
	frame,
	isBusy,
	onConfigurationSaved,
}: AppTestDatabasePanelProps) => {
	const query = useSessionPixel<unknown>(
		`META | ManageAppTestDatabase(project=${JSON.stringify([appId])}, action=["get"]);`,
	);
	const parsed = useMemo(() => {
		if (query.status !== "SUCCESS") return null;
		try {
			return {
				configuration: parseAppTestDatabase(appId, query.data),
				error: "",
			};
		} catch {
			return {
				configuration: null,
				error: "The test database configuration could not be read.",
			};
		}
	}, [appId, query.data, query.status]);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			enabled: false,
			sourceEngineId: "",
			schemaSql: "",
			seedSql: "",
		},
		values: parsed?.configuration ?? undefined,
		resetOptions: { keepDirtyValues: true },
	});
	const { isSubmitting, isDirty, dirtyFields, errors } = form.formState;
	const isEnabled = form.watch("enabled");
	// Subscribe to dirty fields so background reads preserve the user's edits.
	const hasEdits = isDirty || Object.keys(dirtyFields).length > 0;
	const preview = useRef<PreviewResource | null>(null);
	const [previewExpiry, setPreviewExpiry] = useState("");
	const [isChangingPreview, setIsChangingPreview] = useState(false);
	const [operationError, setOperationError] = useState("");
	const lifetime = useRef<AbortController | null>(null);
	const isDisabled = isBusy || isSubmitting || isChangingPreview;
	const readError =
		query.status === "ERROR"
			? query.error?.message ||
				"The test database configuration could not be read."
			: parsed?.error;

	useEffect(() => {
		const controller = new AbortController();
		lifetime.current = controller;
		setPreviewExpiry("");
		return () => {
			controller.abort();
			const resource = preview.current;
			preview.current = null;
			if (resource && resource.frame === frame) {
				if (resource.frame.src === resource.previewUrl)
					resource.frame.src = resource.originalUrl;
				void closeAppTestDatabase(appId, resource.environmentId).catch(
					() => {
						// The server also expires abandoned previews after thirty minutes.
					},
				);
			}
		};
	}, [appId, frame]);

	const handleSave = async (
		values: z.infer<typeof schema>,
	): Promise<void> => {
		const signal = lifetime.current?.signal;
		try {
			const saved = await saveAppTestDatabase(appId, values);
			if (signal?.aborted) return;
			form.reset(saved);
			query.refresh();
			onConfigurationSaved();
		} catch (failure: unknown) {
			if (signal?.aborted) return;
			form.setError("root.server", {
				type: "server",
				message:
					failure instanceof Error
						? failure.message
						: "Could not save the test database",
			});
		}
	};

	const handleClosePreview = async (): Promise<void> => {
		const resource = preview.current;
		if (!resource) return;
		await closeAppTestDatabase(appId, resource.environmentId);
		if (preview.current !== resource) return;
		if (resource.frame.src === resource.previewUrl)
			resource.frame.src = resource.originalUrl;
		preview.current = null;
		setPreviewExpiry("");
	};

	const handlePreview = async (shouldOpen: boolean): Promise<void> => {
		const signal = lifetime.current?.signal;
		if (isDisabled || !frame || signal?.aborted) return;
		setIsChangingPreview(true);
		setOperationError("");
		try {
			if (!shouldOpen) {
				await handleClosePreview();
				return;
			}
			const previous = preview.current;
			const originalUrl = new URL(
				previous?.originalUrl ?? frame.src,
				window.location.href,
			);
			if (!previous) {
				try {
					const current = new URL(
						frame.contentDocument?.URL ?? frame.src,
					);
					if (
						current.origin === originalUrl.origin &&
						current.pathname.startsWith(originalUrl.pathname)
					) {
						originalUrl.search = current.search;
						originalUrl.hash = current.hash;
					}
				} catch {
					/* An inaccessible document starts at its configured portal entry. */
				}
			}
			// Reset stays on the old, revoked test preview until the fresh one is ready.
			// Loading the normal app in between could run its startup database actions.
			if (previous)
				await closeAppTestDatabase(appId, previous.environmentId);
			if (signal?.aborted) return;
			const opened = await openAppTestDatabase(appId);
			if (signal?.aborted) {
				await closeAppTestDatabase(appId, opened.environmentId);
				return;
			}
			const module = new URL(
				`${Env.MODULE.replace(/\/$/, "")}/`,
				window.location.href,
			);
			const previewAddress = new URL(opened.previewPath, module);
			previewAddress.search = originalUrl.search;
			previewAddress.hash = originalUrl.hash;
			const previewUrl = previewAddress.href;
			preview.current = {
				frame,
				originalUrl: originalUrl.href,
				previewUrl,
				environmentId: opened.environmentId,
			};
			frame.src = previewUrl;
			setPreviewExpiry(opened.expiresAt);
		} catch (failure: unknown) {
			if (!signal?.aborted)
				setOperationError(
					failure instanceof Error
						? failure.message
						: "Could not change the test preview",
				);
		} finally {
			if (!signal?.aborted) setIsChangingPreview(false);
		}
	};

	return (
		<details className="mb-4 min-w-0 border-b pb-4">
			<summary className="cursor-pointer font-medium text-sm">
				Test Database
			</summary>
			{readError ? (
				<Alert variant="destructive">
					<AlertDescription>{readError}</AlertDescription>
				</Alert>
			) : !parsed?.configuration ? (
				<Spinner className="my-3 size-4" />
			) : (
				<Form
					form={form}
					onSubmit={handleSave}
					noValidate
					aria-busy={isSubmitting}
					className="mt-3 flex min-w-0 flex-col gap-3"
				>
					<FormSwitch
						name="enabled"
						label="Use Isolated H2 for Tests"
						disabled={isDisabled || Boolean(previewExpiry)}
					/>
					<p className="text-muted-foreground text-sm">
						When enabled, Run Test and Run All use fresh synthetic
						data for each test. The app keeps its existing database
						ID.
					</p>
					<FormInput
						name="sourceEngineId"
						label="Source H2 Database ID (Required When Enabled)"
						required={isEnabled}
						disabled={isDisabled || Boolean(previewExpiry)}
					/>
					<FormTextarea
						name="schemaSql"
						label="Schema SQL (Required When Enabled)"
						required={isEnabled}
						rows={5}
						className="font-mono text-xs"
						disabled={isDisabled || Boolean(previewExpiry)}
					/>
					<FormTextarea
						name="seedSql"
						label="Synthetic Seed SQL (Optional)"
						rows={4}
						className="font-mono text-xs"
						disabled={isDisabled || Boolean(previewExpiry)}
					/>
					<p className="text-muted-foreground text-sm">
						Use simple CREATE TABLE / CREATE INDEX statements and
						INSERT seed statements. This version supports
						single-table SqlQuery reads and writes; Python and other
						backend operations are unavailable in the preview. Build
						with relative asset paths.
					</p>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					{operationError && (
						<Alert variant="destructive">
							<AlertDescription>
								{operationError}
							</AlertDescription>
						</Alert>
					)}
					<div className="flex flex-wrap gap-2">
						<Button
							type="submit"
							size="sm"
							disabled={
								isDisabled ||
								!hasEdits ||
								Boolean(previewExpiry)
							}
						>
							{isSubmitting && <Spinner className="size-4" />}
							{isSubmitting ? "Saving..." : "Save Test Database"}
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={
								isDisabled ||
								hasEdits ||
								!parsed.configuration.enabled ||
								!frame
							}
							onClick={() => void handlePreview(true)}
						>
							{isChangingPreview && (
								<Spinner className="size-4" />
							)}
							{previewExpiry
								? "Reset Test Preview"
								: "Open Test Preview"}
						</Button>
						{previewExpiry && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isDisabled}
								onClick={() => void handlePreview(false)}
							>
								Return to Normal App
							</Button>
						)}
					</div>
					<output
						className="text-muted-foreground text-sm"
						aria-live="polite"
					>
						{previewExpiry ? (
							<>
								<Badge variant="secondary">Test Preview</Badge>{" "}
								Record in the app iframe as usual. Expires{" "}
								{new Date(previewExpiry).toLocaleTimeString()}.
								Replay starts from fresh seed data.
							</>
						) : parsed.configuration.enabled ? (
							"Isolated H2 enabled for replay. Open Test Preview before recording database changes."
						) : (
							"Test database disabled. Recording and replay use the app’s usual database."
						)}
					</output>
				</Form>
			)}
		</details>
	);
};
