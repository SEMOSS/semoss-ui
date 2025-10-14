import {
	CalendarToday,
	FontDownload,
	Schedule,
	Tag,
} from "@mui/icons-material";
import type React from "react";

interface DatabaseColumnIconProps {
	type: string;
	fontSize?: "small" | "medium" | "large";
	sx?: object;
}

export const DatabaseColumnIcon: React.FC<DatabaseColumnIconProps> = ({
	type,
	fontSize = "small",
	sx = { color: "#666666" },
}) => {
	const getColumnIcon = (columnType: string) => {
		switch (columnType?.toUpperCase()) {
			case "STRING":
			case "VARCHAR":
			case "TEXT":
				return <FontDownload fontSize={fontSize} sx={sx} />;
			case "DATE":
				return <CalendarToday fontSize={fontSize} sx={sx} />;
			case "TIMESTAMP":
			case "DATETIME":
				return <Schedule fontSize={fontSize} sx={sx} />;
			case "NUMBER":
			case "INT":
			case "INTEGER":
			case "DOUBLE":
			case "FLOAT":
				return <Tag fontSize={fontSize} sx={sx} />;
			default:
				return <FontDownload fontSize={fontSize} sx={sx} />;
		}
	};

	return getColumnIcon(type);
};
