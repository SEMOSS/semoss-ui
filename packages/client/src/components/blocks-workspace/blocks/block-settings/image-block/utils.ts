const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

const imageExtensions = imageTypes.map((ext) => `.${ext}`);

function getImageFiles(data) {
	return Array.isArray(data)
		? data.filter(
				(file) =>
					typeof file.type === "string" &&
					imageTypes.includes(file.type.toLowerCase()),
			)
		: [];
}

export { getImageFiles, imageExtensions };
