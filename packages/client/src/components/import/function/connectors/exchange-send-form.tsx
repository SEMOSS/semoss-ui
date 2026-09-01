import {
	Alert,
	AlertDescription,
	Form,
	FormActions,
	FormInput,
	FormSection,
	FormSelect,
	SelectItem,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	catalogNameSchema,
	createFunctionEngine,
	FUNCTION_METADATA_DESCRIPTION,
	parameterListSchema,
	stringListSchema,
} from "../shared/function-engine.utils";
import { ParameterListField } from "../shared/parameter-list-field";
import { StringListField } from "../shared/string-list-field";

const schema = z.object({
	NAME: catalogNameSchema,
	MAIL_TRANSPORT: z.string().min(1, "Send through is required"),
	SMTP_SENDER: z.string().min(1, "Sender address is required"),
	SMTP_SENDER_NAME: z.string(),
	EXCHANGE_TENANT: z.string().min(1, "Tenant id is required"),
	EXCHANGE_CLIENT_ID: z.string().min(1, "Client id is required"),
	EXCHANGE_CLIENT_SECRET: z.string().min(1, "Client secret is required"),
	EXCHANGE_SCOPE: z.string(),
	GRAPH_BASE_URL: z.string(),
	SAVE_TO_SENT_ITEMS: z.string(),
	SMTP_HOST: z.string(),
	SMTP_PORT: z.string(),
	SMTP_SECURITY: z.string(),
	SMTP_USERNAME: z.string(),
	ALLOWED_RECIPIENT_DOMAINS: z.string(),
	DEFAULT_TO: z.string(),
	DEFAULT_CC: z.string(),
	DEFAULT_BCC: z.string(),
	SUBJECT_PREFIX: z.string(),
	HTML: z.string(),
	MAX_RECIPIENTS: z.string(),
	ALLOW_SENDER_OVERRIDE: z.string(),
	ALLOW_ATTACHMENTS: z.string(),
	CONNECTION_TIMEOUT: z.string(),
	READ_TIMEOUT: z.string(),
	FUNCTION_NAME: z.string().min(1, "Function name is required"),
	FUNCTION_DESCRIPTION: z.string(),
	FUNCTION_PARAMETERS: parameterListSchema,
	FUNCTION_REQUIRED_PARAMETERS: stringListSchema,
});

type FormValues = z.infer<typeof schema>;

const BOOL_ITEMS = (
	<>
		<SelectItem value="false">false</SelectItem>
		<SelectItem value="true">true</SelectItem>
	</>
);

/**
 * Add an "Exchange Send" Function catalog entry: sends email as a
 * Microsoft 365 mailbox through Graph or SMTP.
 */
export const ExchangeSendForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			MAIL_TRANSPORT: "graph",
			SMTP_SENDER: "",
			SMTP_SENDER_NAME: "",
			EXCHANGE_TENANT: "",
			EXCHANGE_CLIENT_ID: "",
			EXCHANGE_CLIENT_SECRET: "",
			EXCHANGE_SCOPE: "",
			GRAPH_BASE_URL: "",
			SAVE_TO_SENT_ITEMS: "true",
			SMTP_HOST: "",
			SMTP_PORT: "587",
			SMTP_SECURITY: "starttls",
			SMTP_USERNAME: "",
			ALLOWED_RECIPIENT_DOMAINS: "",
			DEFAULT_TO: "",
			DEFAULT_CC: "",
			DEFAULT_BCC: "",
			SUBJECT_PREFIX: "",
			HTML: "false",
			MAX_RECIPIENTS: "25",
			ALLOW_SENDER_OVERRIDE: "false",
			ALLOW_ATTACHMENTS: "false",
			CONNECTION_TIMEOUT: "10000",
			READ_TIMEOUT: "30000",
			FUNCTION_NAME: "",
			FUNCTION_DESCRIPTION: "",
			FUNCTION_PARAMETERS: [],
			FUNCTION_REQUIRED_PARAMETERS: [],
		},
	});

	const mailTransport = form.watch("MAIL_TRANSPORT");
	const isGraph = mailTransport === "graph";
	const isProtocol = mailTransport === "jakarta";

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "EXCHANGE_SMTP", ...values },
				undefined,
				configStore.store.insightID,
			);
			toast.success("Successfully added function database to catalog");
			navigate(`/function/${engineId}`);
		} catch (err) {
			console.error(err);
			toast.error(
				err instanceof Error ? err.message : "Something went wrong",
			);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			className="flex w-full flex-col gap-6"
		>
			<Alert>
				<AlertDescription>
					Sending is immediate and cannot be recalled. Graph needs
					only the Mail.Send application permission with admin
					consent. SMTP additionally needs SMTP.SendAsApp, a service
					principal, a mailbox grant, and SMTP AUTH enabled for the
					tenant and the mailbox, which is why Graph is the default.
				</AlertDescription>
			</Alert>
			<FormSection
				title="General"
				description="Name this catalog entry and choose how it sends mail."
				testIdPrefix="function"
			>
				<FormInput
					name="NAME"
					label="Catalog Name"
					placeholder="Enter a name"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-NAME"
				/>
				<FormSelect
					name="MAIL_TRANSPORT"
					label="Send Through"
					description="Graph sends through the Microsoft 365 API and only needs the Mail.Send application permission. SMTP sends through a mail server, which is the right choice for any relay that is not Microsoft 365, and against Microsoft 365 additionally needs SMTP AUTH enabled and a separate SMTP.SendAsApp grant."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAIL_TRANSPORT"
				>
					<SelectItem value="graph">Microsoft Graph</SelectItem>
					<SelectItem value="jakarta">SMTP mail server</SelectItem>
				</FormSelect>
			</FormSection>
			<FormSection
				title="Credentials"
				description="Who mail is sent as, and the Azure app registration used to authenticate."
				testIdPrefix="function"
			>
				<FormInput
					name="SMTP_SENDER"
					label="Sender Address"
					description="The mailbox every email is sent from. Graph posts against this mailbox, and most relays reject a sender that does not match the authenticated account."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SMTP_SENDER"
				/>
				<FormInput
					name="SMTP_SENDER_NAME"
					label="Sender Display Name"
					description="Shown next to the sender address in the recipient's inbox, ie SEMOSS Notifications."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SMTP_SENDER_NAME"
				/>
				<FormInput
					name="EXCHANGE_TENANT"
					label="Tenant Id"
					description="The directory (tenant) id of the Azure app registration, or the tenant domain."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_TENANT"
				/>
				<FormInput
					name="EXCHANGE_CLIENT_ID"
					label="Client Id"
					description="The application (client) id of the app registration. Sending through Graph needs the Mail.Send permission on it; sending through SMTP needs SMTP.SendAsApp instead."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_CLIENT_ID"
				/>
				<FormInput
					name="EXCHANGE_CLIENT_SECRET"
					label="Client Secret"
					type="password"
					description="A client secret on the app registration. Secrets expire, so the engine stops sending when it does."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_CLIENT_SECRET"
				/>
				<FormInput
					name="EXCHANGE_SCOPE"
					label="Token Scope"
					description="Optional. Defaults to the resource the selected transport needs, which is graph.microsoft.com for Graph and outlook.office365.com for SMTP."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_SCOPE"
				/>
				{isGraph && (
					<FormInput
						name="GRAPH_BASE_URL"
						label="Graph Base Url"
						description="Optional. Defaults to https://graph.microsoft.com/v1.0. Only change this for a sovereign cloud."
						disabled={form.formState.isSubmitting}
						data-testid="function-form-input-GRAPH_BASE_URL"
					/>
				)}
				{isProtocol && (
					<>
						<FormInput
							name="SMTP_HOST"
							label="SMTP Host"
							description="The mail server hostname, ie smtp.office365.com or an internal relay."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-SMTP_HOST"
						/>
						<FormInput
							name="SMTP_PORT"
							label="SMTP Port"
							type="number"
							description="587 for STARTTLS, 465 for SSL, 25 for a relay that does no encryption."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-SMTP_PORT"
						/>
						<FormSelect
							name="SMTP_SECURITY"
							label="Connection Security"
							description="STARTTLS is required rather than optional, so a server that drops it cannot downgrade the message to plaintext. Only use None for an internal relay."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-SMTP_SECURITY"
						>
							<SelectItem value="starttls">STARTTLS</SelectItem>
							<SelectItem value="ssl">SSL</SelectItem>
							<SelectItem value="none">None</SelectItem>
						</FormSelect>
						<FormInput
							name="SMTP_USERNAME"
							label="Username"
							description="Leave the username and password both blank for a relay that does not authenticate."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-SMTP_USERNAME"
						/>
					</>
				)}
			</FormSection>
			<FormSection
				title="Settings"
				description="Who mail may go to, its default shape, and how much can be sent at once."
				testIdPrefix="function"
			>
				{isGraph && (
					<FormInput
						name="SAVE_TO_SENT_ITEMS"
						label="Save To Sent Items"
						description="Whether a sent message is kept in the mailbox's Sent Items. Defaults to true."
						disabled={form.formState.isSubmitting}
						data-testid="function-form-input-SAVE_TO_SENT_ITEMS"
					/>
				)}
				<FormInput
					name="ALLOWED_RECIPIENT_DOMAINS"
					label="Allowed Recipient Domains"
					description="Comma separated list, ie semoss.org. Subdomains are included. Leave blank to allow any recipient."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOWED_RECIPIENT_DOMAINS"
				/>
				<FormInput
					name="DEFAULT_TO"
					label="Default To Recipients"
					description="Comma separated addresses used when the caller does not pass any. Set this to pin the engine to a fixed distribution list."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_TO"
				/>
				<FormInput
					name="DEFAULT_CC"
					label="Default CC Recipients"
					description="Comma separated addresses copied when the caller does not pass a cc list."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_CC"
				/>
				<FormInput
					name="DEFAULT_BCC"
					label="Default BCC Recipients"
					description="Comma separated addresses blind copied when the caller does not pass a bcc list."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_BCC"
				/>
				<FormInput
					name="SUBJECT_PREFIX"
					label="Subject Prefix"
					description="Prepended to every subject line, ie [SEMOSS]. Leave blank to send the subject as written."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SUBJECT_PREFIX"
				/>
				<FormSelect
					name="HTML"
					label="Default Body Format"
					description="How the message body is sent when the caller does not say. The caller can override this per email."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-HTML"
				>
					<SelectItem value="false">Plain text</SelectItem>
					<SelectItem value="true">HTML</SelectItem>
				</FormSelect>
				<FormInput
					name="MAX_RECIPIENTS"
					label="Maximum Recipients Per Email"
					type="number"
					description="Total across to, cc, and bcc. A call asking for more than this is rejected before anything is sent."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAX_RECIPIENTS"
				/>
				<FormSelect
					name="ALLOW_SENDER_OVERRIDE"
					label="Allow Sender Override"
					description="Leave false to send everything as the sender address above. Set to true only when the relay accepts sending on behalf of other addresses."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_SENDER_OVERRIDE"
				>
					{BOOL_ITEMS}
				</FormSelect>
				<FormSelect
					name="ALLOW_ATTACHMENTS"
					label="Allow Attachments"
					description="When true, a caller can attach files that already exist in the insight making the call. No other file on the server can be attached."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_ATTACHMENTS"
				>
					{BOOL_ITEMS}
				</FormSelect>
				{isProtocol && (
					<>
						<FormInput
							name="CONNECTION_TIMEOUT"
							label="Connection Timeout (ms)"
							type="number"
							description="How long to wait for the mail server to accept a connection."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-CONNECTION_TIMEOUT"
						/>
						<FormInput
							name="READ_TIMEOUT"
							label="Read Timeout (ms)"
							type="number"
							description="How long to wait on the mail server once connected."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-READ_TIMEOUT"
						/>
					</>
				)}
			</FormSection>
			<FormSection
				title="Function Metadata"
				description={FUNCTION_METADATA_DESCRIPTION}
				testIdPrefix="function"
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					description="Becomes the MCP tool name, so name it for what it does, ie send_as_reports_mailbox."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_NAME"
				/>
				<FormInput
					name="FUNCTION_DESCRIPTION"
					label="Function Description"
					description="Leave blank to use the built in description. Set it when this engine mails a specific audience, so a model knows who it is writing to."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_DESCRIPTION"
				/>
				<ParameterListField
					name="FUNCTION_PARAMETERS"
					label="Function Parameters"
					description="Leave empty to use the built in email parameters: to, cc, bcc, subject, message, and html."
					disabled={form.formState.isSubmitting}
				/>
				<StringListField
					name="FUNCTION_REQUIRED_PARAMETERS"
					label="Function Required Parameters"
					description="List the names of parameters above that must be provided when calling this function."
					disabled={form.formState.isSubmitting}
				/>
			</FormSection>
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
