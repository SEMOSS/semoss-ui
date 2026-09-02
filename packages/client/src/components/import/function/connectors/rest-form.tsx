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
	URL: z.string().min(1, "URL is required"),
	HTTP_METHOD: z.string().min(1, "Http method is required"),
	CONTENT_TYPE: z.string().min(1, "POST message body type is required"),
	HEADERS: z.string(),
	FUNCTION_NAME: z.string().min(1, "Function name is required"),
	FUNCTION_DESCRIPTION: z.string().min(1, "Function description is required"),
	FUNCTION_PARAMETERS: parameterListSchema,
	FUNCTION_REQUIRED_PARAMETERS: stringListSchema,
});

type FormValues = z.infer<typeof schema>;

/** Add a "REST" Function catalog entry, connecting to any RESTful API endpoint. */
export const RestForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			URL: "",
			HTTP_METHOD: "POST",
			CONTENT_TYPE: "json",
			HEADERS: "",
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
				{ FUNCTION_TYPE: "REST", ...values },
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
				description="The endpoint this connector calls and how it sends the request."
			>
				<FormInput
					name="URL"
					label="URL"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-URL"
				/>
				<FormSelect
					name="HTTP_METHOD"
					label="Http Method"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-HTTP_METHOD"
				>
					<SelectItem value="GET">GET</SelectItem>
					<SelectItem value="HEAD">HEAD</SelectItem>
					<SelectItem value="POST">POST</SelectItem>
					<SelectItem value="PUT">PUT</SelectItem>
				</FormSelect>
			</FormSection>
			<FormSection
				title="Settings"
				description="How the request body is formed and how the resulting function is described."
			>
				<FormSelect
					name="CONTENT_TYPE"
					label="POST Message Body Type"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-CONTENT_TYPE"
				>
					<SelectItem value="json">json</SelectItem>
					<SelectItem value="x-www-form-urlencoded">
						x-www-form-urlencoded
					</SelectItem>
				</FormSelect>
				<FormInput
					name="HEADERS"
					label="Http Headers"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-HEADERS"
				/>
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
					description="Define each parameter with a name, type, and description."
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
