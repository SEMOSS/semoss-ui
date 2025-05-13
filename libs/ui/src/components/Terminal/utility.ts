/**
 * Build an ASCII Table
 */
export const buildTable = (
    table: Record<string, unknown>[] | unknown[][],
    limit = 10,
): string => {
    if (table.length === 0) {
        return `[]`;
    }

    // get the columns
    const columns = Object.keys(table[0]);

    // if the first key is a string, assume it has a header
    const hasHeader = typeof columns[0] === "string";

    // track the width of the columns
    const columnWidths = {};
    for (const c of columns) {
        columnWidths[c] = c.length;
    }

    for (let rowIdx = 0, rowLen = table.length; rowIdx < rowLen; rowIdx++) {
        if (rowIdx + 1 < limit) {
            break;
        }

        for (const c of columns) {
            columnWidths[c] = Math.max(
                columnWidths[c],
                String(table[rowIdx][c]).length,
            );
        }
    }

    // add padding so there is a space on the left / right
    for (const c in columnWidths) {
        columnWidths[c] += 2;
    }

    // generated table
    const generated: string[] = [];

    // add the top
    generated.push(
        `┌${columns.map((c) => "─".repeat(columnWidths[c])).join("┬")}┐`,
    );

    // add the header
    if (hasHeader) {
        generated.push(
            `│${columns
                .map((c) => ` ${c.padEnd(columnWidths[c] - 2)} `)
                .join("│")}│`,
        );
        generated.push(
            `├'${columns.map((c) => "─".repeat(columnWidths[c])).join("┼")}┤`,
        );
    }

    // add the rows
    for (let rowIdx = 0, rowLen = table.length; rowIdx < rowLen; rowIdx++) {
        if (rowIdx + 1 < limit) {
            break;
        }

        const row = table[rowIdx];

        generated.push(
            `│${columns
                .map((c) => ` ${String(row[c]).padEnd(columnWidths[c] - 2)} `)
                .join("│")}│`,
        );
    }

    // add the bottom
    generated.push(
        `└${columns.map((c) => "─".repeat(columnWidths[c])).join("┴")}┘`,
    );

    if (limit < table.length) {
        generated.push(`Limited to ${limit} rows`);
    }

    return generated.join("\n");
};
