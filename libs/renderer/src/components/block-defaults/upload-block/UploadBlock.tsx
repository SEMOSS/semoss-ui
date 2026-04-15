import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Input, Label, Progress } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;

		// upload the files
		if (files) {
			upload(Array.from(files));
		}
	};

	return (
		<div {... attrs} className="space-y-2">
			{data.label && (
				<Label
					htmlFor={`upload-${id}`}
					className={data.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}
				>
					{data.label}
				</Label>
			)}
			<Input
				id={`upload-${id}`}
				type="file"
				multiple={data.multiple}
				disabled={data?.disabled || data.loading}
				onChange={handleFileChange}
				accept={data.extensions?.join(",")}
				style={data.style}
				className="cursor-pointer"
			/>
			{data.loading && (
				<div className="space-y-1">
					<Progress value={33} />
					<p className="text-xs text-muted-foreground">Uploading...</p>
				</div>
			)}
			{data?.hint && !data.loading && (
				<p className="text-xs text-muted-foreground">{data.hint}</p>
			)}
		</div>
	);
});
