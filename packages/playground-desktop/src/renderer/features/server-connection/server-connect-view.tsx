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
	DEFAULT_MODULE,
	parseServerConfig,
	type ServerConfig,
} from "../../../contract/server-connection";

const schema = z.object({
	url: z.string().trim().min(1),
	module: z.string().trim(),
});

type ServerConnectValues = z.infer<typeof schema>;

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
			url: current?.url ?? "",
			module: current?.module ?? DEFAULT_MODULE,
		},
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: ServerConnectValues): Promise<void> => {
		let server: ServerConfig;
		try {
			server = parseServerConfig(values);
		} catch (error) {
			form.setError("url", {
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
							? t("connect.current", { server: current.url })
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
						name="url"
						label={t("connect.urlLabel")}
						placeholder="https://semoss.example.com"
						type="url"
						autoComplete="url"
						required
						autoFocus
						disabled={isSubmitting}
					/>
					<FormInput
						name="module"
						label={t("connect.moduleLabel")}
						description={t("connect.moduleHint")}
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
