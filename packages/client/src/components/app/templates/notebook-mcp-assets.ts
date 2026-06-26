/**
 * MCP asset seeding for Notebook-template apps.
 *
 * Every app created from the Notebook template should be usable as an MCP
 * server in the playground, exposing tools to read from and write to the
 * notebook's cells. The platform discovers those tools from two asset files
 * that live alongside the app:
 *
 *   - `version/assets/py/smss_driver.py`  – the Python implementation. The
 *     filename `smss_driver.py` is required by the platform; the driver is
 *     loaded by exactly that name.
 *   - `version/assets/mcp/py_mcp.json`    – the MCP tool manifest that the
 *     playground reads (via `GetAppAssets(.../mcp/py_mcp.json)`) to list the
 *     available tools and their input schemas.
 *
 * In addition, the app's project metadata must carry the `"MCP"` tag so the
 * app surfaces as an MCP-enabled engine in the playground.
 *
 * These files are seeded at app-creation time (see `NewAppModal`) because the
 * driver and manifest both need the new app's project id, which only exists
 * once the app has been created.
 */

/** Project metadata tag that marks an app as an MCP server in the playground. */
export const MCP_APP_TAG = "MCP";

/** Asset path (relative to the app root) for the Python MCP driver. */
export const NOTEBOOK_MCP_DRIVER_PATH = "version/assets/py/smss_driver.py";

/** Asset path (relative to the app root) for the MCP tool manifest. */
export const NOTEBOOK_MCP_MANIFEST_PATH = "version/assets/mcp/py_mcp.json";

const today = (): string => new Date().toISOString().slice(0, 10);

/**
 * Build the Python MCP driver for a notebook app. The project id is injected
 * so the driver can locate this specific app's `blocks.json`.
 */
export const buildNotebookMcpDriver = (projectId: string): string => {
	return `import json
import os
from smssutil import mcp_metadata

# --- Configuration Constants ---
# Injected when the app is created from the Notebook template.
PROJECT_ID = "${projectId}"


def _find_blocks_json():
    """Locate the blocks.json file for this notebook project."""
    current_path = os.path.abspath(os.getcwd())
    base_path = None

    # Walk up to find the 'project' directory
    parts = current_path.split(os.sep)
    idx = len(parts) - 1
    while idx >= 0:
        if parts[idx] == "project":
            base_path = os.sep.join(parts[:idx + 1])
            break
        idx -= 1

    if not base_path:
        return None, "Could not locate the 'project' base directory"

    # Find this project's folder by its UUID suffix
    for item in os.listdir(base_path):
        if item.endswith(PROJECT_ID):
            portals_path = os.path.join(
                base_path, item, "app_root", "version", "assets", "portals"
            )
            blocks_path = os.path.join(portals_path, "blocks.json")
            return blocks_path, None

    return None, f"Could not find project folder ending with {PROJECT_ID}"


@mcp_metadata({"execution": "auto"})
def add_cell_to_notebook(code: str, cell_type: str = "py", notebook_id: str = "notebook 1"):
    """
    Adds a new code cell to the notebook with the specified code content.
    Use this tool when the user asks to add code, a snippet, or any content to the notebook.
    """
    try:
        blocks_path, error = _find_blocks_json()
        if error:
            return f"Error: {error}"

        if not os.path.exists(blocks_path):
            return f"Error: blocks.json not found at {blocks_path}"

        # Read current blocks.json
        with open(blocks_path, "r", encoding="utf-8") as f:
            blocks_data = json.load(f)

        queries = blocks_data.get("queries", {})

        # Resolve target notebook - fallback to first available if not found
        if notebook_id not in queries:
            if queries:
                notebook_id = list(queries.keys())[0]
            else:
                return f"Error: No notebooks found in blocks.json"

        cells = queries[notebook_id].setdefault("cells", [])

        # If the target notebook has a leading empty cell (e.g. the default
        # cell seeded when the app was created), fill that one instead of
        # appending a new cell - so the first added code lands in cell 1.
        for cell in cells:
            params = cell.get("parameters", {})
            if not str(params.get("code", "")).strip():
                params["code"] = code
                params["type"] = cell_type
                cell["parameters"] = params

                # Persist the updated blocks.json
                with open(blocks_path, "w", encoding="utf-8") as f:
                    json.dump(blocks_data, f, indent=2)

                return (
                    f"Successfully added cell {cell.get('id')} (type={cell_type}) "
                    f"to notebook '{notebook_id}'."
                )

        # Generate a new unique numeric cell ID
        existing_ids = []
        for query in queries.values():
            for cell in query.get("cells", []):
                try:
                    existing_ids.append(int(cell.get("id", 0)))
                except (ValueError, TypeError):
                    pass
        new_id = str(max(existing_ids, default=0) + 1)

        # Build the new cell
        new_cell = {
            "widget": "code",
            "id": new_id,
            "parameters": {
                "code": code,
                "type": cell_type,
            },
        }

        queries[notebook_id]["cells"].append(new_cell)

        # Persist the updated blocks.json
        with open(blocks_path, "w", encoding="utf-8") as f:
            json.dump(blocks_data, f, indent=2)

        return (
            f"Successfully added cell {new_id} (type={cell_type}) "
            f"to notebook '{notebook_id}'."
        )

    except Exception as e:
        return f"Error adding cell to notebook: {str(e)}"


@mcp_metadata({"execution": "auto"})
def read_notebook_cells():
    """
    Reads and returns all cells and their code content from the notebook.
    ONLY call this when the user explicitly asks to read, view, or show the notebook contents.
    """
    try:
        blocks_path, error = _find_blocks_json()
        if error:
            return f"Error: {error}"

        if not os.path.exists(blocks_path):
            return f"Error: blocks.json not found at {blocks_path}"

        with open(blocks_path, "r", encoding="utf-8") as f:
            blocks_data = json.load(f)

        queries = blocks_data.get("queries", {})
        if not queries:
            return "The notebook is empty \u2014 no cells found."

        result_lines = []
        for q_id, query in queries.items():
            cells = query.get("cells", [])
            result_lines.append(f"Notebook: '{q_id}' ({len(cells)} cell(s))")
            for idx, cell in enumerate(cells, start=1):
                params = cell.get("parameters", {})
                cell_type = params.get("type", "unknown")
                code = params.get("code", "")
                result_lines.append(f"  Cell {idx} (type={cell_type}):")
                result_lines.append(f"    {code}" if code else "    (empty)")

        return "\\n".join(result_lines)

    except Exception as e:
        return f"Error reading notebook: {str(e)}"
`;
};

/**
 * Build the MCP tool manifest (`py_mcp.json`) for a notebook app. The
 * `source_file` is informational; the platform regenerates it on demand, but
 * we provide a sensible value pointing at the seeded driver.
 */
export const buildNotebookMcpManifest = (
	projectId: string,
	appName: string,
): string => {
	const manifest = {
		_meta: {
			last_modified_date: today(),
			file_last_modified_date: today(),
			source_file: `/opt/semosshome/project/${appName}__${projectId}/app_root/version/assets/py/smss_driver.py`,
		},
		tools: [
			{
				name: "add_cell_to_notebook",
				title: "Add Cell to Notebook",
				description:
					"Adds a new code cell to the notebook with the specified code content. ONLY call this tool when the user explicitly asks to add or save code to the notebook (e.g. 'add this to the notebook', 'save this to the notebook'). Do NOT call this automatically when writing or discussing code.",
				inputSchema: {
					properties: {
						code: {
							description:
								"The code content to add to the notebook cell",
							title: "code",
							type: "string",
						},
						cell_type: {
							description:
								"The type of code cell: 'py' for Python, 'sql' for SQL. Defaults to 'py'.",
							title: "cell_type",
							type: "string",
							default: "py",
						},
						notebook_id: {
							description:
								"The notebook id to add the cell to. Defaults to 'notebook 1'.",
							title: "notebook_id",
							type: "string",
							default: "notebook 1",
						},
					},
					required: ["code"],
					title: "Add Cell to Notebook Arguments",
					type: "object",
				},
				_meta: {
					generated_on: today(),
					SMSS_MCP_EXECUTION: "auto",
					SMSS_MCP_UI: {},
				},
				_type: "python",
			},
			{
				name: "read_notebook_cells",
				title: "Read Notebook Cells",
				description:
					"Reads and returns all cells and their code content from the notebook. ONLY call this when the user explicitly asks to read, view, or show the notebook contents (e.g. 'show me the notebook', 'what is in the notebook', 'read the notebook').",
				inputSchema: {
					properties: {},
					required: [],
					title: "Read Notebook Cells Arguments",
					type: "object",
				},
				_meta: {
					generated_on: today(),
					SMSS_MCP_EXECUTION: "auto",
					SMSS_MCP_UI: {},
				},
				_type: "python",
			},
		],
	};

	return JSON.stringify(manifest, null, 4);
};

/**
 * Build the pixel that seeds (and commits) the MCP driver + manifest into a
 * freshly created notebook app.
 */
export const buildSeedNotebookMcpAssetsPixel = (
	appId: string,
	appName: string,
): string => {
	const driver = buildNotebookMcpDriver(appId);
	const manifest = buildNotebookMcpManifest(appId, appName);

	return `
		SaveAsset(fileName=["${NOTEBOOK_MCP_DRIVER_PATH}"], content=["<encode>${driver}</encode>"], space=["${appId}"]);
		CommitAsset(filePath=["${NOTEBOOK_MCP_DRIVER_PATH}"], comment=["Seed notebook MCP driver"], space=["${appId}"]);
		SaveAsset(fileName=["${NOTEBOOK_MCP_MANIFEST_PATH}"], content=["<encode>${manifest}</encode>"], space=["${appId}"]);
		CommitAsset(filePath=["${NOTEBOOK_MCP_MANIFEST_PATH}"], comment=["Seed notebook MCP manifest"], space=["${appId}"]);
	`;
};
