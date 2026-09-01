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
	MAIL_TRANSPORT: z.string().min(1, "Read through is required"),
	IMAP_USERNAME: z.string().min(1, "Mailbox address is required"),
	EXCHANGE_TENANT: z.string().min(1, "Tenant id is required"),
	EXCHANGE_CLIENT_ID: z.string().min(1, "Client id is required"),
	EXCHANGE_CLIENT_SECRET: z.string().min(1, "Client secret is required"),
	EXCHANGE_SCOPE: z.string(),
	IMAP_HOST: z.string(),
	IMAP_PORT: z.string(),
	DEFAULT_FOLDER: z.string(),
	ALLOWED_FOLDERS: z.string(),
	MAX_MESSAGES: z.string(),
	DEFAULT_MESSAGES: z.string(),
	MAX_BODY_CHARS: z.string(),
	ALLOWED_SENDER_DOMAINS: z.string(),
	ALLOW_ATTACHMENT_DOWNLOAD: z.string(),
	MAX_ATTACHMENT_SIZE: z.string(),
	MARK_AS_READ: z.string(),
	ALLOW_FLAG_CHANGES: z.string(),
	ALLOW_MOVE: z.string(),
	ALLOW_DELETE: z.string(),
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
 * Add an "Exchange Mailbox (IMAP)" Function catalog entry: reads a
 * Microsoft 365 mailbox via Graph or the IMAP protocol, signing in with an
 * Azure app registration.
 */
export const ExchangeImapMailboxForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			MAIL_TRANSPORT: "graph",
			IMAP_USERNAME: "",
			EXCHANGE_TENANT: "",
			EXCHANGE_CLIENT_ID: "",
			EXCHANGE_CLIENT_SECRET: "",
			EXCHANGE_SCOPE: "",
			IMAP_HOST: "outlook.office365.com",
			IMAP_PORT: "993",
			DEFAULT_FOLDER: "INBOX",
			ALLOWED_FOLDERS: "",
			MAX_MESSAGES: "25",
			DEFAULT_MESSAGES: "10",
			MAX_BODY_CHARS: "10000",
			ALLOWED_SENDER_DOMAINS: "",
			ALLOW_ATTACHMENT_DOWNLOAD: "false",
			MAX_ATTACHMENT_SIZE: "5242880",
			MARK_AS_READ: "false",
			ALLOW_FLAG_CHANGES: "false",
			ALLOW_MOVE: "false",
			ALLOW_DELETE: "false",
			CONNECTION_TIMEOUT: "10000",
			READ_TIMEOUT: "30000",
			FUNCTION_NAME: "",
			FUNCTION_DESCRIPTION: "",
			FUNCTION_PARAMETERS: [],
			FUNCTION_REQUIRED_PARAMETERS: [],
		},
	});

	const isProtocol = form.watch("MAIL_TRANSPORT") === "jakarta";

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "EXCHANGE_IMAP", ...values },
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
					Exchange Online does not accept a mailbox password over
					IMAP, so this needs an app registration with the
					IMAP.AccessAsApp permission and admin consent, plus an
					Exchange grant for this mailbox (New-ServicePrincipal and
					Add-MailboxPermission). Without the mailbox grant a token is
					still issued and the sign in still fails.
				</AlertDescription>
			</Alert>
			<FormSection
				title="General"
				description="Name this catalog entry and choose how it reads the mailbox."
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
					label="Read Through"
					description="Graph reads through the Microsoft 365 API and needs only the Mail.ReadWrite application permission. IMAP additionally needs IMAP.AccessAsApp, a service principal, and a mailbox grant, and Microsoft keeps narrowing what the protocol endpoints will do."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAIL_TRANSPORT"
				>
					<SelectItem value="graph">Microsoft Graph</SelectItem>
					<SelectItem value="jakarta">IMAP protocol</SelectItem>
				</FormSelect>
			</FormSection>
			<FormSection
				title="Credentials"
				description="The mailbox to read and the Azure app registration used to sign in."
				testIdPrefix="function"
			>
				<FormInput
					name="IMAP_USERNAME"
					label="Mailbox Address"
					description="The mailbox to read, ie reports@yourdomain.com. The application has to have been granted access to it."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-IMAP_USERNAME"
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
					description="The application (client) id of the app registration."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_CLIENT_ID"
				/>
				<FormInput
					name="EXCHANGE_CLIENT_SECRET"
					label="Client Secret"
					type="password"
					description="A client secret on the app registration. Secrets expire, so the engine stops reading when it does."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_CLIENT_SECRET"
				/>
				<FormInput
					name="EXCHANGE_SCOPE"
					label="Token Scope"
					description="Optional. Defaults to https://outlook.office365.com/.default, which asks for whatever application permissions the app registration was granted."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCHANGE_SCOPE"
				/>
				{isProtocol && (
					<>
						<FormInput
							name="IMAP_HOST"
							label="IMAP Host"
							description="Leave as is for Microsoft 365. Only change this for a different endpoint, such as a sovereign cloud."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-IMAP_HOST"
						/>
						<FormInput
							name="IMAP_PORT"
							label="IMAP Port"
							type="number"
							description="993, the encrypted IMAP port Exchange Online serves."
							disabled={form.formState.isSubmitting}
							data-testid="function-form-input-IMAP_PORT"
						/>
					</>
				)}
			</FormSection>
			<FormSection
				title="Settings"
				description="What can be read, changed, and how much of it at a time."
				testIdPrefix="function"
			>
				<FormInput
					name="DEFAULT_FOLDER"
					label="Default Folder"
					description="The folder read when the caller does not name one."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_FOLDER"
				/>
				<FormInput
					name="ALLOWED_FOLDERS"
					label="Allowed Folders"
					description="Comma separated list, ie INBOX,Archive. A call naming anything else is rejected. Leave blank to allow any folder of the mailbox."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOWED_FOLDERS"
				/>
				<FormInput
					name="MAX_MESSAGES"
					label="Maximum Messages Per Call"
					type="number"
					description="The most messages one call can return. Also caps how many messages a single mark, move, or delete can touch."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAX_MESSAGES"
				/>
				<FormInput
					name="DEFAULT_MESSAGES"
					label="Messages Returned By Default"
					type="number"
					description="Used when the caller does not ask for a number. Cannot be more than the maximum above."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_MESSAGES"
				/>
				<FormInput
					name="MAX_BODY_CHARS"
					label="Maximum Body Characters"
					type="number"
					description="A longer message body comes back truncated, so one newsletter cannot fill a model's context window."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAX_BODY_CHARS"
				/>
				<FormInput
					name="ALLOWED_SENDER_DOMAINS"
					label="Allowed Sender Domains"
					description="Comma separated list, ie semoss.org. Subdomains are included. Mail from anyone else is not returned at all. Leave blank to surface every message."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOWED_SENDER_DOMAINS"
				/>
				<FormSelect
					name="ALLOW_ATTACHMENT_DOWNLOAD"
					label="Allow Attachment Download"
					description="When true, a caller can save the attachments of a message into the files of the insight making the call so they can be opened. When false the attachment names are listed but nothing is written."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_ATTACHMENT_DOWNLOAD"
				>
					{BOOL_ITEMS}
				</FormSelect>
				<FormInput
					name="MAX_ATTACHMENT_SIZE"
					label="Maximum Attachment Size (bytes)"
					type="number"
					description="An attachment larger than this is skipped rather than written. Only applies when attachment download is on."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MAX_ATTACHMENT_SIZE"
				/>
				<FormSelect
					name="MARK_AS_READ"
					label="Mark Returned Messages As Read"
					description="Leave false to read the mailbox without changing it. True marks every message this engine returns as read, which the owner of the mailbox will see."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MARK_AS_READ"
				>
					{BOOL_ITEMS}
				</FormSelect>
				<FormSelect
					name="ALLOW_FLAG_CHANGES"
					label="Allow Marking Read Or Unread"
					description="When true, a caller can mark a message read or unread by its uid. Leave false for an engine that only reads."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_FLAG_CHANGES"
				>
					{BOOL_ITEMS}
				</FormSelect>
				<FormSelect
					name="ALLOW_MOVE"
					label="Allow Moving Messages"
					description="When true, a caller can move a message to another folder. IMAP has no move, so this copies the message and then deletes the original."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_MOVE"
				>
					{BOOL_ITEMS}
				</FormSelect>
				<FormSelect
					name="ALLOW_DELETE"
					label="Allow Deleting Messages"
					description="When true, a caller can delete a message. There is no undo on the mail server, so leave this off unless deleting is the point of the engine."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOW_DELETE"
				>
					{BOOL_ITEMS}
				</FormSelect>
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
			</FormSection>
			<FormSection
				title="Function Metadata"
				description={FUNCTION_METADATA_DESCRIPTION}
				testIdPrefix="function"
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					description="Becomes the MCP tool name, so name it for what it does, ie read_shared_inbox."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_NAME"
				/>
				<FormInput
					name="FUNCTION_DESCRIPTION"
					label="Function Description"
					description="Leave blank to use the built in description. Set it when this mailbox holds one kind of mail, so a model knows what it is reading."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_DESCRIPTION"
				/>
				<ParameterListField
					name="FUNCTION_PARAMETERS"
					label="Function Parameters"
					description="Leave empty to use the built in parameters: folder, limit, from, subject, sinceDays, unreadOnly, and includeBody, plus action and uid for whichever changes are allowed above."
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
