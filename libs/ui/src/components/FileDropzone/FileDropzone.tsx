import { OpenInBrowserRounded } from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import type React from "react";
import {
	type ComponentPropsWithRef,
	type ForwardedRef,
	forwardRef,
	useRef,
	useState,
} from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { FileDisplay } from "./FileDisplay";
import type { InputOptions } from "./InputOptions";
import { useValue } from "./useValue";

const StyledContainer = styled("div")({
	height: "50%",
	width: "100%",
});

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	backgroundColor: `${theme.palette.primary.main}1D`,
}));

const StyledButton = styled(Button)(() => ({
	"&:hover": {
		backgroundColor: "unset!important",
	},
}));

const StyledDropzone = styled("div", {
	shouldForwardProp: (prop) =>
		prop !== "disabled" && prop !== "valid" && prop !== "dragging",
})<{
	disabled: boolean;
	valid: boolean;
	dragging: boolean;
}>(({ theme, disabled, dragging, valid }) => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	borderWidth: "1px",
	borderStyle: "dashed",
	borderRadius: "0.25rem",
	width: "100%",
	height: "100%",
	padding: "16px 8px",
	borderColor: disabled
		? theme.palette.action.disabled
		: dragging
			? theme.palette.primary.main
			: !valid
				? theme.palette.error.main
				: theme.palette.secondary.main,
	color: disabled
		? theme.palette.text.disabled
		: dragging
			? theme.palette.primary.main
			: theme.palette.text.primary,
	cursor: disabled || dragging ? "default" : "",
}));

const StyledContentContainer = styled("div")({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
});

const StyledDropzoneDescription = styled(Typography)(() => ({
	marginTop: "8px",
	marginBottom: "16px 8px",
}));

const StyledFileUploadInput = styled("input")({
	display: "none",
});

const StyledFileListContainer = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	gap: "8px",
	zIndex: 1,
	maxHeight: "4rem 2rem",
	overflowY: "auto",
}));

interface BaseFileDropzoneProps<V>
	extends InputOptions<V>,
		Omit<
			ComponentPropsWithRef<"div">,
			"value" | "defaultValue" | "defaultChecked" | "onChange"
		> {
	/** Allow multiple files to be added */
	multiple?: boolean;

	/** Description to show on the filepicker */
	description?: string;

	/** List of allowed file types */
	extensions?: string[];

	/** Props to pass to the input */
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

interface MultipleFileDropzoneProps extends BaseFileDropzoneProps<File[]> {
	multiple: true;
}

interface SingleFileDropzoneProps extends BaseFileDropzoneProps<File | null> {
	multiple: false;
}

type FileValue<Multiple extends boolean> = Multiple extends true
	? File[]
	: File | null;

export type FileDropzoneProps<Multiple extends boolean> = BaseFileDropzoneProps<
	FileValue<Multiple>
>;

const _FileDropzone = <Multiple extends boolean>(
	props: FileDropzoneProps<Multiple>,
	ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
	const {
		id,
		value,
		defaultValue,
		onChange = () => null,
		multiple = false,
		disabled = false,
		valid = true,
		description = "or drop to upload",
		extensions = [],
		inputProps,
		...otherProps
	} = props;

	// state
	const [drag, setDrag] = useState<boolean>(false);

	// refs
	const inputRef = useRef<HTMLInputElement>(null);

	// manage the internal value
	const [internalValue, setInternalValue] = useValue<
		MultipleFileDropzoneProps["value"] | SingleFileDropzoneProps["value"]
	>({
		initialValue: multiple ? [] : null,
		value: value,
		defaultValue: defaultValue,
		onChange: (value) => {
			if (multiple) {
				(
					onChange as NonNullable<
						MultipleFileDropzoneProps["onChange"]
					>
				)(value as NonNullable<MultipleFileDropzoneProps["value"]>);
			} else {
				(onChange as NonNullable<SingleFileDropzoneProps["onChange"]>)(
					value as NonNullable<SingleFileDropzoneProps["value"]>,
				);
			}
		},
	});

	// events
	/**
	 * Handle drag enter on the dropzone, toggle on dragging
	 *
	 * @param event - drag event
	 */
	const handleDropzoneDragEnter = (event: React.DragEvent) => {
		if (disabled) {
			return;
		}

		event.preventDefault();

		setDrag(true);
	};

	/**
	 * Handle drag over on the dropzone
	 *
	 * @param event - drag event
	 */
	const handleDropzoneDragOver = (event: React.DragEvent) => {
		if (disabled) {
			return;
		}
		event.preventDefault();
	};

	/**
	 * Handle drag leave on the dropzone, toggle off dragging
	 *
	 * @param event - drag event
	 */
	const handleDropzoneDragLeave = (event: React.DragEvent) => {
		if (disabled) {
			return;
		}

		event.preventDefault();

		setDrag(false);
	};

	/**
	 * Handle drop on the dropzone, toggle off dragging
	 *
	 * @param event - drag event
	 */
	const handleDropzoneDrop = (event: React.DragEvent) => {
		if (disabled) {
			return;
		}

		event.preventDefault();

		// get the uploaded files
		const uploadFiles = Array.from(event.dataTransfer.files);

		// turn off the drag
		setDrag(false);

		// set the values
		if (multiple) {
			updateFiles([...(internalValue as File[]), ...uploadFiles]);
		} else {
			updateFiles([uploadFiles[0]]);
		}
	};

	/**
	 * Handle change events on the input
	 *
	 * @param event - drag event
	 */
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;

		if (!files) {
			return;
		}

		// set the values
		if (multiple) {
			updateFiles([...(internalValue as File[]), ...Array.from(files)]);
		} else {
			updateFiles([Array.from(files)[0]]);
		}

		// Reset the input value to allow re-uploading the same file
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	/**
	 * Delete a file
	 * @param name - name of the file to delete
	 */
	const deleteFile = (name: string) => {
		if (multiple) {
			const newFiles = (internalValue as File[]).filter(
				(file) => file.name !== name,
			);

			setInternalValue(newFiles);
		} else {
			setInternalValue(null);
		}
	};

	/**
	 * Update the files, adding only the ones that are valid
	 * @param files - files that we will check
	 */
	function updateFiles(files: File[]) {
		const names: { [key: string]: boolean } = {};

		const updated = [];
		for (
			let fileIdx = 0, fileLen = files.length;
			fileIdx < fileLen;
			fileIdx++
		) {
			const file = files[fileIdx];

			// get the extension
			const ext = file.name.split(".").pop();

			// check if we can accept the file
			let isAcceptable = true;
			if (extensions.length) {
				isAcceptable =
					(!!ext && extensions.indexOf(ext) > -1) ||
					(!!ext && extensions.indexOf(`.${ext}`) > -1);
			}

			// check if we can accept the file
			if (!isAcceptable) {
				continue;
			}

			// if the name exists, we can't accept it
			if (Object.hasOwn(names, file.name)) {
				console.error(`ERROR ::: ${file.name} is already present`);
				continue;
			}

			// store the name
			names[file.name] = true;

			// add the file
			updated.push(file);
		}

		if (multiple) {
			setInternalValue(updated);
		} else if (updated.length) {
			setInternalValue(updated[0]);
		} else {
			setInternalValue(null);
		}
	}

	/**
	 * Render the files
	 */
	function renderFiles() {
		if (multiple) {
			const files = internalValue as File[];
			return files.map((file) => {
				return (
					<FileDisplay
						key={file.name}
						file={file}
						disabled={disabled}
						onDelete={() => deleteFile(file.name)}
					/>
				);
			});
		} else if (internalValue) {
			const file = internalValue as File;
			return (
				<FileDisplay
					key={file.name}
					file={file}
					disabled={disabled}
					onDelete={() => deleteFile(file.name)}
				/>
			);
		} else {
			return null;
		}
	}

	return (
		<StyledContainer ref={ref} {...otherProps}>
			<StyledDropzone
				valid={valid}
				disabled={disabled}
				dragging={drag}
				onDragEnter={handleDropzoneDragEnter}
				onDragOver={handleDropzoneDragOver}
				onDragLeave={handleDropzoneDragLeave}
				onDrop={handleDropzoneDrop}
			>
				<StyledContentContainer>
					<StyledIconButton
						size="small"
						onClick={() => inputRef.current?.click()}
						data-testid={`fileDropZone-iconBrowse-btn`}
						disabled={disabled}
					>
						<OpenInBrowserRounded color="inherit" />
					</StyledIconButton>
					<StyledButton
						size="small"
						variant="text"
						color="primary"
						onClick={() => inputRef.current?.click()}
						data-testid={`fileDropZone-browse-btn`}
						disabled={disabled}
					>
						Browse
					</StyledButton>
					<StyledDropzoneDescription variant="caption">
						{description}
					</StyledDropzoneDescription>
					<StyledFileUploadInput
						type="file"
						id={id}
						ref={inputRef}
						onChange={handleInputChange}
						accept={extensions.join(",")}
						multiple={multiple}
						{...inputProps}
					/>
				</StyledContentContainer>
			</StyledDropzone>
			<StyledFileListContainer data-testid={"fileDropZone-files-list"}>
				{renderFiles()}
			</StyledFileListContainer>
		</StyledContainer>
	);
};

export const FileDropzone = forwardRef(_FileDropzone) as <
	Multiple extends boolean,
>(
	props: FileDropzoneProps<Multiple> & {
		ref?: ForwardedRef<HTMLDivElement>;
	},
) => ReturnType<typeof _FileDropzone>;
