import { LinearProgress, styled, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledTextField = styled(TextField)({
	"& .MuiFormLabel-root.MuiInputLabel-root": {
		top: "auto",
		left: "auto",
	},
});
export interface UploadBlockDef extends BlockDef<"upload"> {
	widget: "upload";
	data: {
		style: CSSProperties;
		label: string;
		value: string | string[];
		required: boolean;
		loading: boolean;
		disabled: boolean;
		hint?: string;
		extensions?: string[];
		multiple?: boolean;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const UploadBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, uploadFile, listeners } =
		useBlock<UploadBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	/**
	 * Upload a file to the server
	 * @param file - file to upload to the server
	 * @returns
	 */
	const upload = async (file: File[]) => {
		if (file.length === 0) {
			// clear the value
			setData("value", "");
			return;
		}

		try {
			// start the loading screen
			setData("loading", true);

			// upload the file
			const uploadedFiles = await uploadFile(file);

			// ignore if false is returned
			if (!uploadedFiles) {
				return;
			}

			// get the location.
			const fileLocations = uploadedFiles.map((file) => {
				const { fileLocation } = file;
				if (!fileLocation) {
					throw new Error("Missing File Location");
				}

				return fileLocation;
			});

			if (fileLocations.length === 0) {
				throw new Error("Missing File Locations");
			}

			// if there are multiple, save as an array
			if (data.multiple) {
				setData("value", fileLocations);
			} else {
				setData("value", fileLocations[0]);
			}

			debouncedCallback();
		} catch (e) {
			console.error(e);
		} finally {
			// stop the loading screen
			setData("loading", false);
		}
	};

	return (
		<StyledTextField
			size="small"
			defaultValue={""}
			label={data.label}
			rows={1}
			multiline={false}
			required={data.required}
			disabled={data?.disabled || data.loading}
			helperText={
				data.loading ? <LinearProgress color="primary" /> : data?.hint
			}
			style={{
				...data.style,
			}}
			InputLabelProps={{
				shrink: true,
			}}
			type={"file"}
			inputProps={{
				accept: data.extensions,
				multiple: data.multiple,
			}}
			onChange={(e) => {
				const files = (e.target as HTMLInputElement).files;

				// upload the files
				upload(Array.from(files));
			}}
			{...attrs}
		/>
	);
});
