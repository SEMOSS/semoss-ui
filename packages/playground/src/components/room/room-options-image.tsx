import { DicesIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	Input,
	Slider,
} from "@semoss/ui/next";
import { RoomOptionsImageSelect } from "@/components/room/room-options-image-select";
import type { ImageSize, ImageType } from "@/constants";
import { IMAGE_SIZE_PRESETS } from "@/constants";
import type { RoomStore } from "@/stores";

interface RoomOptionsImageProps {
	options: RoomStore["options"];
	onOptionsChange: (options: Partial<RoomStore["options"]>) => void;
}

export const RoomOptionsImage: React.FC<RoomOptionsImageProps> = ({
	options,
	onOptionsChange,
}) => {
	const { t } = useTranslation(["room", "common"]);

	const deriveImagePreset = (): { size: ImageSize; type: ImageType } => {
		for (const [size, types] of Object.entries(IMAGE_SIZE_PRESETS)) {
			for (const [type, dims] of Object.entries(types)) {
				if (
					dims.height === options.imageHeight &&
					dims.width === options.imageWidth
				) {
					return {
						size: size as ImageSize,
						type: type as ImageType,
					};
				}
			}
		}
		return { size: "large", type: "square" };
	};

	const [imageSize, setImageSize] = useState<ImageSize>(
		() => deriveImagePreset().size,
	);
	const [imageType, setImageType] = useState<ImageType>(
		() => deriveImagePreset().type,
	);

	const handleImagePresetChange = (size: ImageSize, type: ImageType) => {
		const preset = IMAGE_SIZE_PRESETS[size][type];
		onOptionsChange({
			imageHeight: preset.height,
			imageWidth: preset.width,
		});
	};

	return (
		<>
			<FieldSeparator />
			<FieldSet>
				<FieldLegend>{t("common:labels.imageGenHeader")}</FieldLegend>
				<FieldDescription>
					{t("room:settings.imageGenDescription")}
				</FieldDescription>
				<FieldGroup>
					<Field>
						<FieldLabel>
							{t("room:form.imageOrientationLabel")}
						</FieldLabel>
						<RoomOptionsImageSelect
							value={imageType}
							onChange={(v) => {
								setImageType(v as typeof imageType);
								handleImagePresetChange(
									imageSize,
									v as typeof imageType,
								);
							}}
							options={[
								{
									value: "square",
									label: t("room:form.imageTypeSquareLabel"),
									svgTitle: "Square Orientation",
									svgContent: (
										<rect
											x="6"
											y="6"
											width="28"
											height="28"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "portrait",
									label: t(
										"room:form.imageTypePortraitLabel",
									),
									svgTitle: "Portrait Orientation",
									svgContent: (
										<rect
											x="12"
											y="4"
											width="16"
											height="32"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "landscape",
									label: t(
										"room:form.imageTypeLandscapeLabel",
									),
									svgTitle: "Landscape Orientation",
									svgContent: (
										<rect
											x="4"
											y="12"
											width="32"
											height="16"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
							]}
						/>
					</Field>
					<Field>
						<FieldLabel>{t("room:form.imageSizeLabel")}</FieldLabel>
						<RoomOptionsImageSelect
							value={imageSize}
							onChange={(v) => {
								setImageSize(v as typeof imageSize);
								handleImagePresetChange(
									v as typeof imageSize,
									imageType,
								);
							}}
							options={[
								{
									value: "small",
									label: t("room:form.imageSizeSmallLabel"),
									svgTitle: "Small size",
									svgContent: (
										<rect
											x="14"
											y="14"
											width="12"
											height="12"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "medium",
									label: t("room:form.imageSizeMediumLabel"),
									svgTitle: "Medium size",
									svgContent: (
										<rect
											x="9"
											y="9"
											width="22"
											height="22"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "large",
									label: t("room:form.imageSizeLargeLabel"),
									svgTitle: "Large size",
									svgContent: (
										<rect
											x="4"
											y="4"
											width="32"
											height="32"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
							]}
						/>
					</Field>
					<Field>
						<FieldLabel>
							{" "}
							{t("room:form.detailLevelLabel")} (
							{options.detailLevel?.toFixed(2)})
						</FieldLabel>
						<Slider
							min={1.1}
							max={9.9}
							step={0.01}
							value={[options.detailLevel]}
							onValueChange={(value) =>
								onOptionsChange({
									detailLevel: value[0],
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>{t("room:form.imageSeedLabel")}</FieldLabel>
						<div className="flex gap-2">
							<Input
								type="number"
								placeholder={t(
									"common:placeholders.updateImageSeed",
								)}
								min={0}
								max={2147483646}
								value={options.seed ?? ""}
								onChange={(e) =>
									onOptionsChange({
										seed:
											e.target.value === ""
												? undefined
												: Math.min(
														Math.max(
															Number(
																e.target.value,
															),
															0,
														),
														2147483646,
													),
									})
								}
								className="w-full"
							/>
							<Button
								variant="outline"
								size="icon"
								type="button"
								onClick={() =>
									onOptionsChange({
										seed:
											Math.floor(
												Math.random() * 2147483646,
											) + 1,
									})
								}
							>
								<DicesIcon />
							</Button>
						</div>
					</Field>
				</FieldGroup>
			</FieldSet>
		</>
	);
};
