# Clean Nodes

Clean nodes reuse the existing SEMOSS BI reactors. The backend catalog owns their
definitions; the frontend adds a Clean group and configuration form.

The canvas exposes one **Clean data** node. Select an operation in its inspector
to show that operation's configuration. New nodes are saved as `clean.process`
with an `operation` value (`purge`, `trim`, `replace`, `removeDuplicates`,
`filterEmpty`, `imputeNulls`, `changeType`, `dropColumn`, or `renameColumn`). The
operation determines which settings appear in the inspector.

Clean operations currently support Python frames. Automation database queries
materialize their bounded results as Python frames, so their output can feed a
Clean node directly. Other frame backends fail validation instead of being
silently converted to another runtime.

## Input and Output

`source` must be an exact reference, such as `${query_result}`, to a live table
from this run. JSON arrays, table previews, and historical summaries are not
accepted as executable frames.

Each operation copies the input into a separate frame of the same runtime before
invoking the BI routine. The original input remains unchanged. Copying preserves
duplicate rows and the input's visible filters. Inputs are bounded by the
backend's existing saved-table row limit.

The cleaned output is available under the node's output variable, with normal
table paging and durable run-history capture. Root graphs and loop bodies use
the same execution path.

## Purge

Purge removes whole rows matching all configured filters from the local working
dataset. Select a column, comparator, and value to identify the rows to remove.
It does not drop columns, clear individual cells, or delete records from the
source database. Use the **Builder** to add or remove filters and choose each
column, comparator, value type, and value. The selected value type controls manual
entry. Use **JSON** to edit or paste the equivalent array directly. Switching
modes preserves text, numeric, and boolean values. Invalid JSON remains editable
and cannot be switched into the builder until corrected. The node accepts up to
100 filter objects:

```json
[
  { "column": "STATUS", "operator": "==", "value": "inactive" },
  { "column": "AGE", "operator": ">=", "value": 18 }
]
```

Supported operators are `==`, `!=`, `>`, `>=`, `<`, and `<=`. Values may be
strings, finite numbers, booleans, or exact references to scalar run values.

The example removes inactive rows whose age is at least 18. Other rows remain.

## Existing BI Limitations

- Impute Nulls reuses BI defaults: numeric mean, string mode or `Unknown`, and
  date/timestamp forward fill.
- Change Column Type currently offers `STRING`, `FACTOR`, `DOUBLE`, and `DATE`,
  the targets the existing BI reactor actually converts. Although the legacy
  reactor accepts names such as `INT`, `BOOLEAN`, and `TIMESTAMP`, it currently
  updates metadata without converting values for those targets, so Automation
  does not expose them.
- Drop Column and Rename Column update only the copied working frame, never the
  source database. Rename targets must be simple identifiers and cannot collide
  with another existing column.
- Remove duplicates compares entire rows; it does not accept a subset of columns.
- Filter empty values removes rows with null or empty values in any selected column.
- Column names must exist and use letters, digits, and underscores, beginning
  with a letter or underscore. This avoids passing executable syntax to legacy
  R/Python routines.
- Replace currently rejects double quotes, backslashes, and control characters
  because the legacy reactors interpolate literals into scripts. Numeric
  replacements must be numeric or a supported null marker. Python text-null
  replacement is rejected because the existing reactor does not safely quote it.

Deploy the matching Semoss backend changes and restart/reload the backend before
using these nodes. An older backend catalog will not offer the Clean group.
