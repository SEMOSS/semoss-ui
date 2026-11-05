import { usePixel } from "@semoss/sdk/react";
import { getImageFiles } from "../utils";
import SelectedItem from "./SelectedItem";
import SelectImage from "./SelectImage";

export const InsightTab = ({ data, setData }) => {
	// biome-ignore lint/suspicious/noExplicitAny: pixel response data is untyped
	const getAssets = usePixel<{ status: string; data: any }>(
		`BrowseAsset(filePath=["/"] );`,
	);
	const imageFiles =
		getAssets.status === "SUCCESS" ? getImageFiles(getAssets.data) : [];

	if (!data?.src) {
		return (
			<SelectImage
				imageFiles={imageFiles}
				data={data}
				setData={setData}
				data-testid="select-image"
			/>
		);
	}

	return data.src instanceof Object ? (
		<SelectedItem file={data.src} setData={setData} />
	) : (
		<SelectImage imageFiles={imageFiles} data={data} setData={setData} />
	);
};
