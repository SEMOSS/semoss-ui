//return the access type based on the permission
export const returnAccessType = (permission: string, getLabels = false) => {
	if (getLabels) {
		switch (permission) {
			case "can view":
				return "READ_ONLY";
			case "can edit":
				return "EDIT";
			case "owner":
				return "OWNER";
			default:
				return "select access";
		}
	}
	switch (permission) {
		case "READ_ONLY":
			return "can view";
		case "EDIT":
			return "can edit";
		case "OWNER":
			return "owner";
		default:
			return "select access";
	}
};
