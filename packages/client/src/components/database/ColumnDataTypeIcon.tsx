import { Calendar, Clock, Hash, Type } from "lucide-react";
import type React from "react";

interface DatabaseColumnIconProps {
	type: string;
	className?: string;
}

export const DatabaseColumnIcon: React.FC<DatabaseColumnIconProps> = ({
	type,
	className = "size-4",
}) => {
	const getColumnIcon = (columnType: string) => {
		switch (columnType?.toUpperCase()) {
			case "STRING":
			case "VARCHAR":
			case "TEXT":
				return <Type className={className} />;
			case "DATE":
				return <Calendar className={className} />;
			case "TIMESTAMP":
			case "DATETIME":
				return <Clock className={className} />;
			case "NUMBER":
			case "INT":
			case "INTEGER":
			case "DOUBLE":
			case "FLOAT":
				return <Hash className={className} />;
			default:
				return <Type className={className} />;
		}
	};

	return getColumnIcon(type);
};
