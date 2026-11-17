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
import type {
	DesktopBridge,
	SavedServers,
} from "../../../contract/ipc-contract";
import {
	parseServerAddress,
	type ServerConfig,
} from "../../../contract/server-connection";
import { SavedServerList } from "./saved-server-list";

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
	/** The bridge that checks, saves, switches, and forgets servers. */
	bridge: DesktopBridge;
	/** The saved servers, listed above the form; none on first launch. */
	saved?: SavedServers;
	/** Read the saved servers again, after one is forgotten. */
	onServersChange?: () => Promise<void>;
	/** Leave without changing the server; none on first launch. */
	onCancel?: () => void;
}

/**
 * Pick the SEMOSS server the app signs in to. Saved servers are listed with
 * Switch and Remove; the form adds one by its address and module path. A new
 * server is checked before it is saved, and every saved server keeps its own
 * sign in, so switching back needs none.
 */
export const ServerConnectView = ({
	bridge,
	saved,
	onServersChange,
	onCancel,
}: ServerConnectViewProps) => {
	const { t } = useTranslation("desktop");
	const form = useForm<ServerConnectValues>({
		resolver: zodResolver(schema),
		defaultValues: { address: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const hasSaved = saved !== undefined && saved.servers.length > 0;

	/**
	 * Forget a server, then list what is left. Forgetting the one in use
	 * opens the window on another, so this page goes with it.
	 *
	 * @param server - The server.
	 */
	const handleForget = async (server: ServerConfig): Promise<void> => {
		await bridge.invoke("server-connection:forget", server);
		await onServersChange?.();
	};

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
		// saving opens the window on the server
		await bridge.invoke("server-connection:set", server);
	};

	return (
		<main className="h-full overflow-y-auto bg-muted/30">
			<div className="flex min-h-full items-center justify-center p-6">
				<div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
					<div className="flex flex-col gap-1">
						<H1 className="text-2xl">
							{hasSaved
								? t("connect.titleSaved")
								: t("connect.title")}
						</H1>
						<Muted>
							{hasSaved
								? t("connect.descriptionSaved")
								: t("connect.description")}
						</Muted>
					</div>
					{hasSaved ? (
						<SavedServerList
							saved={saved}
							onSwitch={(server) =>
								bridge.invoke("server-connection:set", server)
							}
							onForget={handleForget}
						/>
					) : null}
					{hasSaved ? (
						<h2 className="font-medium text-sm">
							{t("connect.addTitle")}
						</h2>
					) : null}
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
							autoFocus={!hasSaved}
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
			</div>
		</main>
	);
};
