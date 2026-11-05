import { useState } from "react";
import { usePixel, useSessionInsight } from "@semoss/sdk/react";
import { FileDropzone, toast } from "@semoss/ui/next";
import { getImageFiles, imageExtensions } from "../utils";
import SelectedItem from "./SelectedItem";
import SelectImage from "./SelectImage";

export const AppTab = ({ id, data, setData, appId }) => {
	// an upload needs an insight to go through, though the image lands in the app
	const { upload } = useSessionInsight();
	const [isLoading, setIsLoading] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: pixel response data is untyped
	const getAssets = usePixel<{ status: string; data: any }>(
		`BrowseAppAssets(project=["${appId}"], filePath=["/"]);`,
	);
	const imageFiles =
		getAssets.status === "SUCCESS" ? getImageFiles(getAssets.data) : [];
	const addFile = async (file: File) => {
		try {
			setIsLoading(true);

			let uploadRes = null;
			uploadRes = await upload(file, appId, "version/assets/");
			setData("title", "");
			setData("src", uploadRes[0]);
			toast.success("Image uploaded successfully");
			if (!uploadRes) {
				throw new Error("Error missing uploading image");
			}
		} catch (e) {
			toast.error("Error uploading image");
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};
	if (isLoading) {
		return <p className="text-sm">Loading...</p>;
	}
	if (data?.src instanceof Object) {
		return <SelectedItem file={data.src} setData={setData} />;
	}
	return (
		<>
			<SelectImage
				imageFiles={imageFiles}
				data={data}
				setData={setData}
				data-testid="select-image"
			/>
			<p className="text-center text-sm">Or</p>
			<FileDropzone
				description="Upload your image here"
				extensions={imageExtensions}
				multiple={false}
				id={id}
				onChange={addFile}
				data-testid="upload-image"
			/>
		</>
	);
};
