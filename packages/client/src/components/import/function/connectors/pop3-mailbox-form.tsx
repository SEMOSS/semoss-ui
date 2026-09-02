import {
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
	POP3_HOST: z.string().min(1, "POP3 host is required"),
	POP3_PORT: z.string().min(1, "POP3 port is required"),
	POP3_SECURITY: z.string().min(1, "Connection security is required"),
	POP3_USERNAME: z.string().min(1, "Username is required"),
	POP3_PASSWORD: z.string().min(1, "Password is required"),
	MAX_MESSAGES: z.string(),
	DEFAULT_MESSAGES: z.string(),
	MAX_BODY_CHARS: z.string(),
	ALLOWED_SENDER_DOMAINS: z.string(),
	ALLOW_ATTACHMENT_DOWNLOAD: z.string(),
	MAX_ATTACHMENT_SIZE: z.string(),
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
 * Add a "POP3 Mailbox" Function catalog entry: reads email over POP3. One
 * inbox, no folders, and no record of what has already been read.
 */
export const Pop3MailboxForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			POP3_HOST: "",
			POP3_PORT: "995",
			POP3_SECURITY: "ssl",
			POP3_USERNAME: "",
			POP3_PASSWORD: "",
			MAX_MESSAGES: "25",
			DEFAULT_MESSAGES: "10",
			MAX_BODY_CHARS: "10000",
			ALLOWED_SENDER_DOMAINS: "",
			ALLOW_ATTACHMENT_DOWNLOAD: "false",
			MAX_ATTACHMENT_SIZE: "5242880",
			CONNECTION_TIMEOUT: "10000",
			READ_TIMEOUT: "30000",
			FUNCTION_NAME: "",
			FUNCTION_DESCRIPTION: "",
			FUNCTION_PARAMETERS: [],
			FUNCTION_REQUIRED_PARAMETERS: [],
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "POP3", ...values },
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
			<FormSection title="General" description="Name this catalog entry.">
				<FormInput
					name="NAME"
					label="Catalog Name"
					placeholder="Enter a name"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-NAME"
				/>
			</FormSection>
			<FormSection
				title="Credentials"
				description="The mail server and mailbox this connector signs in to."
			>
				<FormInput
					name="POP3_HOST"
					label="POP3 Host"
					description="The mail server hostname, ie pop.gmail.com or an internal server."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-POP3_HOST"
				/>
				<FormInput
					name="POP3_PORT"
					label="POP3 Port"
					type="number"
					description="995 for SSL, 110 for a server that starts in the clear."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-POP3_PORT"
				/>
				<FormSelect
					name="POP3_SECURITY"
					label="Connection Security"
					description="The server certificate has to be trusted and match the host either way. Only use None for an internal server that does no encryption at all."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-POP3_SECURITY"
				>
					<SelectItem value="ssl">SSL</SelectItem>
					<SelectItem value="starttls">STARTTLS</SelectItem>
					<SelectItem value="none">None</SelectItem>
				</FormSelect>
				<FormInput
					name="POP3_USERNAME"
					label="Username"
					description="The mailbox to sign in to, usually the full email address. Both the username and password are required - a mailbox cannot be read anonymously."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-POP3_USERNAME"
				/>
				<FormInput
					name="POP3_PASSWORD"
					label="Password"
					type="password"
					description="Many providers need an app password rather than the account password."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-POP3_PASSWORD"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="How much a call can return and what it may include."
			>
				<FormInput
					name="MAX_MESSAGES"
					label="Maximum Messages Per Call"
					type="number"
					description="The most messages one call can return."
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
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					description="Becomes the MCP tool name, so name it for what it does, ie read_alerts_inbox."
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
					description="Leave empty to use the built in search parameters: limit, from, subject, sinceDays, and includeBody."
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
