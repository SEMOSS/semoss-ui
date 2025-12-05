export const formatOptions = [
	{
		display: "String",
		value: "STRING",
		formats: [],
	},
	{
		display: "Integer",
		value: "INT",
		formats: [
			{
				display: "1000",
				value: "int_default",
				isDefault: true,
			},
			{
				display: "1,000",
				value: "int_comma",
			},
			{
				display: "$1000",
				value: "int_currency",
			},
			{
				display: "$1,000",
				value: "int_currency_comma",
			},
			{
				display: "10%",
				value: "int_percent",
			},
			{
				display: "1.00k",
				value: "thousand",
			},
			{
				display: "1.00M",
				value: "million",
			},
			{
				display: "1.00B",
				value: "billion",
			},
			{
				display: "1.00T",
				value: "trillion",
			},
			{
				display: "Accounting ($)",
				value: "accounting",
			},
			{
				display: "Scientific (1.00E+03)",
				value: "scientific",
			},
		],
	},
	{
		display: "Double",
		value: "DOUBLE",
		formats: [
			{
				display: "1000.00",
				value: "double_round2",
				isDefault: true,
			},
			{
				display: "1000.0",
				value: "double_round1",
			},
			{
				display: "1000.000",
				value: "double_round3",
			},
			{
				display: "1,000.0",
				value: "double_comma_round1",
			},
			{
				display: "1,000.00",
				value: "double_comma_round2",
			},
			{
				display: "$1,000.00",
				value: "double_currency_comma_round2",
			},
			{
				display: "10.0%",
				value: "double_percent_round1",
			},
			{
				display: "10.00%",
				value: "double_percent_round2",
			},
			{
				display: "1.00k",
				value: "thousand",
			},
			{
				display: "1.00M",
				value: "million",
			},
			{
				display: "1.00B",
				value: "billion",
			},
			{
				display: "1.00T",
				value: "trillion",
			},
			{
				display: "Accounting ($)",
				value: "accounting",
			},
			{
				display: "Scientific (1.00E+03)",
				value: "scientific",
			},
		],
	},
	{
		display: "Date",
		value: "DATE",
		formats: [
			{
				display: "1879-03-14",
				value: "yyyy-MM-dd",
				isDefault: true,
			},

			{
				display: "03/14/1879",
				value: "MM/dd/yyyy",
			},
			{
				display: "3/14/1879",
				value: "M/d/yyyy",
			},

			{
				display: "03/14/79",
				value: "MM/dd/yy",
			},

			{
				display: "03/14",
				value: "MM/dd",
			},

			{
				display: "March 14, 1879",
				value: "MMMMM d, yyyy",
			},

			{
				display: "14-Mar",
				value: "dd-MMM",
			},

			{
				display: "14-Mar-79",
				value: "dd-MMM-yy",
			},

			{
				display: "14-Mar-1879",
				value: "dd-MMM-yyyy",
			},

			{
				display: "Mar-79",
				value: "MMM-yy",
			},

			{
				display: "Friday, March 14, 1879",
				value: "EEEEE, MMMMM d, yyyy",
			},
			{
				display: "1879",
				value: "yyyy",
			},
			{
				display: "187903",
				value: "yyyyMM",
			},
			{
				display: "18790314",
				value: "yyyyMMdd",
			},
		],
	},
	{
		display: "Timestamp",
		value: "TIMESTAMP",
		formats: [
			{
				display: "1879-03-14 13:30:55",
				value: "yyyy-MM-dd HH:mm:ss",
				isDefault: true,
			},
			{
				display: "1879-03-14 1:30 PM",
				value: "yyyy-MM-dd hh:mm a",
			},
			{
				display: "1879-03-14 13:30",
				value: "yyyy-MM-dd HH:mm",
			},
			{
				display: "1879-03-14 1:30",
				value: "yyyy-MM-dd hh:mm",
			},
			{
				display: "3/14/79 13:30:55",
				value: "M/d/yy HH:mm:ss",
			},
			{
				display: "3/14/79 1:30 PM",
				value: "M/d/yy hh:mm a",
			},
			{
				display: "3/14/79 13:30",
				value: "M/d/yy HH:mm",
			},
			{
				display: "3/14/79 1:30",
				value: "M/d/yy hh:mm",
			},
		],
	},
];
