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
import { catalogNameSchema } from "@/utility/catalog";
import {
	createFunctionEngine,
	FUNCTION_METADATA_DESCRIPTION,
	parameterListSchema,
	stringListSchema,
} from "../shared/function-engine.utils";
import { ParameterListField } from "../shared/parameter-list-field";
import { StringListField } from "../shared/string-list-field";

const schema = z.object({
	NAME: catalogNameSchema,
	ENDPOINT: z.string().min(1, "Instance URL is required"),
	AUTH_TYPE: z.string().min(1, "Authentication type is required"),
	OAUTH_CLIENT: z.string(),
	OAUTH_SECRET: z.string(),
	OAUTH_GRANT_TYPE: z.string(),
	OAUTH_ENDPOINT: z.string(),
	BASIC_USERNAME: z.string(),
	BASIC_PASSWORD: z.string(),
	DEFAULT_TABLE: z.string(),
	TABLE_API_PATH: z.string(),
	LIMIT: z.string(),
	FIELDS: z.string(),
	DISPLAY_VALUE: z.string(),
	EXCLUDE_REFERENCE_LINK: z.string(),
	FUNCTION_NAME: z.string().min(1, "Function name is required"),
	FUNCTION_DESCRIPTION: z.string().min(1, "Function description is required"),
	FUNCTION_PARAMETERS: parameterListSchema,
	FUNCTION_REQUIRED_PARAMETERS: stringListSchema,
});

type FormValues = z.infer<typeof schema>;

/** Add a "ServiceNow" Function catalog entry, querying records from a table. */
export const ServiceNowForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			ENDPOINT: "",
			AUTH_TYPE: "oauth",
			OAUTH_CLIENT: "",
			OAUTH_SECRET: "",
			OAUTH_GRANT_TYPE: "client_credentials",
			OAUTH_ENDPOINT: "",
			BASIC_USERNAME: "",
			BASIC_PASSWORD: "",
			DEFAULT_TABLE: "",
			TABLE_API_PATH: "/api/now/table/",
			LIMIT: "25",
			FIELDS: "",
			DISPLAY_VALUE: "true",
			EXCLUDE_REFERENCE_LINK: "true",
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
				{ FUNCTION_TYPE: "SERVICE_NOW", ...values },
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
				description="The ServiceNow instance and how this connector authenticates against it."
			>
				<FormInput
					name="ENDPOINT"
					label="Instance URL"
					description="The base URL of the ServiceNow instance, ie https://myinstance.service-now.com"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ENDPOINT"
				/>
				<FormSelect
					name="AUTH_TYPE"
					label="Authentication Type"
					description="Fill in the fields below that match the type selected here."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-AUTH_TYPE"
				>
					<SelectItem value="oauth">OAuth</SelectItem>
					<SelectItem value="basic">Basic</SelectItem>
				</FormSelect>
				<FormInput
					name="OAUTH_CLIENT"
					label="OAuth Client ID"
					description="Required when the authentication type is OAuth."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-OAUTH_CLIENT"
				/>
				<FormInput
					name="OAUTH_SECRET"
					label="OAuth Client Secret"
					type="password"
					description="Required when the authentication type is OAuth."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-OAUTH_SECRET"
				/>
				<FormSelect
					name="OAUTH_GRANT_TYPE"
					label="OAuth Grant Type"
					description="The password grant also requires the username and password below."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-OAUTH_GRANT_TYPE"
				>
					<SelectItem value="client_credentials">
						client_credentials
					</SelectItem>
					<SelectItem value="password">password</SelectItem>
				</FormSelect>
				<FormInput
					name="OAUTH_ENDPOINT"
					label="OAuth Token URL"
					description="Must be a full URL. Leave blank to use <Instance URL>/oauth_token.do"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-OAUTH_ENDPOINT"
				/>
				<FormInput
					name="BASIC_USERNAME"
					label="Username"
					description="Required for basic authentication or the OAuth password grant."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-BASIC_USERNAME"
				/>
				<FormInput
					name="BASIC_PASSWORD"
					label="Password"
					type="password"
					description="Required for basic authentication or the OAuth password grant."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-BASIC_PASSWORD"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="Default query behavior and how the resulting function is described."
			>
				<FormInput
					name="DEFAULT_TABLE"
					label="Default Table"
					description="The table queried when the caller does not name one, ie incident. Leave blank to require the table on every request."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DEFAULT_TABLE"
				/>
				<FormInput
					name="TABLE_API_PATH"
					label="Table API Path"
					description="Change this only when the table is served by a scoped app scripted REST API instead of the standard table API."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-TABLE_API_PATH"
				/>
				<FormInput
					name="LIMIT"
					label="Default Record Limit"
					type="number"
					description="Maximum records returned when the caller does not ask for a specific limit."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-LIMIT"
				/>
				<FormInput
					name="FIELDS"
					label="Default Fields"
					description="Comma separated list of fields to return. Leave blank to return every field."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FIELDS"
				/>
				<FormSelect
					name="DISPLAY_VALUE"
					label="Display Values"
					description="How reference and choice fields are returned on each record."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-DISPLAY_VALUE"
				>
					<SelectItem value="true">
						true (readable display value)
					</SelectItem>
					<SelectItem value="false">
						false (raw database value)
					</SelectItem>
					<SelectItem value="all">all (both values)</SelectItem>
				</FormSelect>
				<FormSelect
					name="EXCLUDE_REFERENCE_LINK"
					label="Exclude Reference Links"
					description="Leave as true to keep the response small by dropping the link objects on reference fields."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXCLUDE_REFERENCE_LINK"
				>
					<SelectItem value="true">true</SelectItem>
					<SelectItem value="false">false</SelectItem>
				</FormSelect>
			</FormSection>
			<FormSection
				title="Function Metadata"
				description={FUNCTION_METADATA_DESCRIPTION}
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_NAME"
				/>
				<FormInput
					name="FUNCTION_DESCRIPTION"
					label="Function Description"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_DESCRIPTION"
				/>
				<ParameterListField
					name="FUNCTION_PARAMETERS"
					label="Function Parameters"
					description="Leave empty to use the built in table query parameters such as query, fields, limit, and orderBy."
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
