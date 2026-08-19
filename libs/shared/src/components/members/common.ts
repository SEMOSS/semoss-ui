// Strip a numeric input down to digits, then comma-format it for display
export const formatNum = (val: string): string => {
	const digits = val.replace(/[^0-9]/g, "");
	if (!digits) return "";
	return Number(digits).toLocaleString();
};

// Strip a numeric input down to digits only (for storing/parsing back out)
export const parseNum = (val: string): string => val.replace(/[^0-9]/g, "");

//return the access type based on the permission
export const returnAccessType = (permission: string, getLabels = false) => {
	if (getLabels) {
		switch (permission) {
			case "Viewer":
				return "READ_ONLY";
			case "Editor":
				return "EDIT";
			case "Owner":
				return "OWNER";
			default:
				return "select access";
		}
	}
	switch (permission) {
		case "READ_ONLY":
			return "Viewer";
		case "EDIT":
			return "Editor";
		case "OWNER":
			return "Owner";
		default:
			return "select access";
	}
};
