import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { debounced } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 200);

	const upload = async (file: File[]) => {
		if (file.length === 0) {
			setData("value", "");
			return;
		}

		try {
			setData("loading", true);
			const uploadedFiles = await uploadFile(file);
			if (!uploadedFiles) return;

			const fileLocations = uploadedFiles.map((f) => {
				const { fileLocation } = f;
				if (!fileLocation) throw new Error("Missing File Location");
				return fileLocation;
			});

			if (fileLocations.length === 0)
				throw new Error("Missing File Locations");

			if (data.multiple) {
				setData("value", fileLocations);
			} else {
				setData("value", fileLocations[0]);
			}

			debouncedCallback();
		} catch (e) {
			console.error(e);
		} finally {
			setData("loading", false);
		}
	};

	return (
		<div {...attrs} style={data.style} className="flex flex-col gap-1.5">
			{data.label && (
				<label htmlFor={`upload-${id}`} className="font-medium text-sm">
					{data.label}
					{data.required && (
						<span className="ml-0.5 text-destructive">*</span>
					)}
				</label>
			)}
			<div className="relative flex items-center">
				{data.loading && (
					<Spinner className="-translate-y-1/2 absolute top-1/2 left-3 z-10 size-4" />
				)}
				<input
					id={`upload-${id}`}
					type="file"
					required={data.required}
					disabled={data.disabled || data.loading}
					accept={data.extensions?.join(",")}
					multiple={data.multiple}
					className={`flex h-9 w-full rounded-md border border-input bg-background text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50${data.loading ? "pl-9" : "px-3"} py-1`}
					onChange={(e) => {
						const files = (e.target as HTMLInputElement).files;
						upload(Array.from(files ?? []));
					}}
				/>
			</div>
			{data.loading && (
				<div className="h-1 w-full animate-pulse rounded-full bg-primary/40" />
			)}
			{data?.hint && !data.loading && (
				<span className="text-muted-foreground text-xs">
					{data.hint}
				</span>
			)}
		</div>
	);
});
