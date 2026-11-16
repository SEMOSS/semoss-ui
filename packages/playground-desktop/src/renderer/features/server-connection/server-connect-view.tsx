import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormActions,
	FormInput,
	H1,
	Muted,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { DesktopBridge } from "../../../contract/ipc-contract";
import {
	formatServerAddress,
	parseServerAddress,
	type ServerConfig,
} from "../../../contract/server-connection";

/**
 * The form's shape: one address, such as
 * `https://semoss.example.com/Monolith`. {@link parseServerAddress} does the
 * real validation on submit, and the main process checks the result again.
 */
const schema = z.object({
	address: z.string().trim().min(1),
});

/** The form's values. */
type ServerConnectValues = z.infer<typeof schema>;

/** Props for {@link ServerConnectView}. */
interface ServerConnectViewProps {
	/** The bridge that checks and saves the server. */
	bridge: DesktopBridge;
	/** The server in use, when changing it; none on first launch. */
	current?: ServerConfig | null;
	/** Leave without changing the server; none on first launch. */
	onCancel?: () => void;
}

/**
 * Pick the SEMOSS server the app signs in to: its address and module path.
 * The server is checked before it is saved; saving reloads the app on it.
 */
export const ServerConnectView = ({
	bridge,
	current,
	onCancel,
}: ServerConnectViewProps) => {
	const { t } = useTranslation("desktop");
	const form = useForm<ServerConnectValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			address: current ? formatServerAddress(current) : "",
		},
	});
	const { errors, isSubmitting } = form.formState;

	/**
	 * Validate, check, then save the server; a failure shows on the form.
	 *
	 * @param values - The form's values.
	 */
	const handleSubmit = async (values: ServerConnectValues): Promise<void> => {
		let server: ServerConfig;
		try {
			server = parseServerAddress(values.address);
		} catch (error) {
			form.setError("address", {
				type: "validate",
				message: error instanceof Error ? error.message : String(error),
			});
			return;
		}
		const check = await bridge.invoke("server-connection:check", server);
		if ("message" in check) {
			form.setError("root.server", {
				type: "server",
				message: check.message,
			});
			return;
		}
		// saving reloads the window onto the server
		await bridge.invoke("server-connection:set", server);
	};

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
			<div className="flex w-full max-w-md flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<H1 className="text-2xl">{t("connect.title")}</H1>
					<Muted>
						{current
							? t("connect.current", {
									server: formatServerAddress(current),
								})
							: t("connect.description")}
					</Muted>
				</div>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-4"
				>
					<FormInput
						name="address"
						label={t("connect.urlLabel")}
						description={t("connect.urlHint")}
						placeholder="https://semoss.example.com/Monolith"
						type="url"
						autoComplete="url"
						required
						autoFocus
						disabled={isSubmitting}
					/>
					{errors.root?.server?.message ? (
						<Alert variant="destructive" role="alert">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}
					<output aria-live="polite" className="sr-only">
						{isSubmitting ? t("connect.checking") : ""}
					</output>
					{onCancel ? (
						<FormActions
							isSubmitting={isSubmitting}
							onCancel={onCancel}
							submitLabel={t("connect.submit")}
						/>
					) : (
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Spinner aria-hidden /> : null}
							{t("connect.submit")}
						</Button>
					)}
				</Form>
			</div>
		</main>
	);
};
