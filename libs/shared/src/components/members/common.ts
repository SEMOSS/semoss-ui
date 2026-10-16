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
