export const getSelector = (data, aggregates) => {
	let fields: Record<string, string> = {},
		label = "",
		latitude = "",
		longitude = "",
		size = "",
		color = "",
		tooltip = "",
		labelName = "",
		latitudeName = "",
		longitudeName = "";
	if (Object.hasOwn(data.option, "_state")) {
		fields = data.option._state.fields;
		label = fields.label;
		latitude = fields.Latitude;
		longitude = fields.Longitude;
		size = fields.size;
		color = fields.color;
		tooltip = fields.tooltip;
		labelName = fields.label;
		latitudeName = fields.Latitude;
		longitudeName = fields.Longitude;
	}
	const _getSelectorType = (type) => {
		return fields[type] === "NUMBER" ? "Average" : "Count";
	};
	const getAggregates = (field) => {
		if (
			!fields[field] ||
			!aggregates[field] ||
			Object.values(aggregates[field]).length === 0
		) {
			return "";
		}
		return Object.values(aggregates[field])[0];
	};
	const getSelectors = () => {
		return {
			latitude: getAggregates("Latitude"),
			longitude: getAggregates("Longitude"),
			size: getAggregates("size"),
			tooltip: getAggregates("tooltip"),
		};
	};
	const selectors = getSelectors();
	let selector = "";
	if (Object.hasOwn(data.option, "_state")) {
		if (Object.hasOwn(data.option._state, "fields")) {
			if (label && latitude && longitude && size && color && tooltip) {
				if (
					latitude === longitude &&
					latitude === size &&
					latitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					label === color &&
					label === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					label === color &&
					label === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					latitude === size &&
					label === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					latitude === color &&
					label === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					label === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					(size === color || label === color) &&
					size === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					latitude === color &&
					size === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					latitude === tooltip &&
					size === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === size &&
					latitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					longitude === size &&
					longitude === color &&
					longitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === size &&
					latitude === color &&
					longitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === size &&
					longitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					longitude === size &&
					latitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					longitude === size &&
					longitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					longitude === size &&
					latitude === color &&
					longitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === size &&
					longitude === color &&
					longitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					(latitude === size &&
						latitude === tooltip &&
						label === color) ||
					(longitude === size &&
						longitude === tooltip &&
						label === color) ||
					(latitude === size &&
						longitude === tooltip &&
						label === color) ||
					(longitude === size &&
						latitude === tooltip &&
						label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					(label === size || latitude === size) &&
					label === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === color &&
					label === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					label === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (
					latitude === longitude &&
					latitude === size &&
					latitude === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					latitude === size &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (
					latitude === longitude &&
					latitude === color &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					latitude === size &&
					label === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === longitude && latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (
					(size === color && latitude === tooltip) ||
					longitude === tooltip ||
					(size === color && size === tooltip) ||
					(size === tooltip && latitude === color) ||
					longitude === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}

				if (
					(latitude === longitude && latitude === color) ||
					size === color
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (
					(latitude === longitude && latitude === tooltip) ||
					size === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === longitude && label === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (latitude === longitude && label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === longitude && label === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				if (
					latitude === longitude &&
					label === size &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName}${color}])|Group(${labelName},${color})`);
				}

				if (
					(latitude === size && label === color) ||
					(longitude === size && label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (
					(latitude === tooltip && label === color) ||
					(longitude === tooltip && label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === size && latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (longitude === size && longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === size && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (longitude === size && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === color && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (longitude === color && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === size && longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (longitude === size && latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === size && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (longitude === size && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === color && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (longitude === color && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (size === tooltip && label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${size},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				if (longitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				if (size === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (size === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				if (color === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color}])|Group(${labelName},${color})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color},${tooltip}])|Group(${labelName},${color})`);
			}
			if (label && latitude && longitude && size && color) {
				if (
					latitude === longitude &&
					latitude === size &&
					(latitude === color || label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					(latitude === color || size === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === longitude && label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === longitude && latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName},${color}])|Group(${labelName},${color})`);
				}

				if (latitude === size && latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === size && longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === size && longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === size && latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					(latitude === size && label === color) ||
					(longitude === size && label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${size},${color}])|Group(${labelName},${color})`);
				}

				if (size === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (longitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}

				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${size},${color}])|Group(${labelName},${color})`);
			}
			if (label && latitude && longitude && color && tooltip) {
				if (
					latitude === longitude &&
					(latitude === color || label === color) &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					(latitude === color || label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}

				if (latitude === longitude && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName},${color}])|Group(${labelName},${color})`);
				}

				if (latitude === color && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === color && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === color && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === color && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (
					(latitude === tooltip && label === color) ||
					(longitude === tooltip && label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
				}
				if (label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (color === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${color},${tooltip}])|Group(${labelName},${color})`);
			}
			if (label && latitude && longitude && size && tooltip) {
				if (
					latitude === longitude &&
					latitude === size &&
					latitude === tooltip
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude && latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (
					latitude === longitude &&
					(latitude === tooltip || size === tooltip)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === size && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === size && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === size && longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === size && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${size},${tooltip}])|Group(${labelName})`);
				}
				if (size === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (longitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}
				if (longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
				}

				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${size},${tooltip}])|Group(${labelName})`);
			}
			if (label && latitude && longitude && color) {
				if (
					latitude === longitude &&
					(latitude === color || label === color)
				) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),(${color})).as([${labelName}, ${latitudeName},${color}])|Group(${labelName},${color})`);
				}
				if (latitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (label === color) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),(${color})).as([${labelName}, ${latitudeName},${longitudeName},${color}])|Group(${labelName},${color})`);
			}
			if (label && latitude && longitude && size) {
				if (latitude === longitude && latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${size}])|Group(${labelName})`);
				}
				if (latitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === size) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.size}(${size})).as([${labelName}, ${latitudeName},${longitudeName},${size}])|Group(${labelName})`);
			}
			if (label && latitude && longitude && tooltip) {
				if (latitude === longitude && latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${tooltip}])|Group(${labelName})`);
				}
				if (latitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				if (longitude === tooltip) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${latitudeName},${longitudeName},${tooltip}])|Group(${labelName})`);
			}
			if (label && latitude && longitude) {
				if (latitude === longitude) {
					// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
					return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName})).as([${labelName}, ${latitudeName}])|Group(${labelName})`);
				}
				// biome-ignore lint/suspicious/noAssignInExpressions: iterative assignment pattern
				return (selector = `Select(${labelName},${selectors.latitude}(${latitudeName}),${selectors.longitude}(${longitudeName})).as([${labelName}, ${latitudeName},${longitudeName}])|Group(${labelName})`);
			}
		}
	}
	return "";
};
