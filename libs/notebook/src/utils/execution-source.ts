import { uint8ArrayToBase64 } from "./base64";
import {
	INLINE_DISPLAY_BEGIN_PREFIX,
	INLINE_DISPLAY_CHUNK_PREFIX,
	INLINE_DISPLAY_END_MARKER,
} from "./inline-display-markers";

export const isPythonCellLanguage = (language: string): boolean => {
	return language === "python" || language === "py";
};

/**
 * Wraps a Python cell's source with a shim that makes Playground's plain
 * Py() script runner behave like a real Jupyter kernel for display purposes:
 * matplotlib figures get captured, IPython.display objects/display() calls
 * get rendered via their _repr_*_ methods, and the cell's trailing bare
 * expression (if any) is auto-displayed exactly like Jupyter's displayhook.
 */
export const buildNotebookExecutionSource = (
	language: string,
	source: string,
): string => {
	if (!isPythonCellLanguage(language)) {
		return source;
	}

	// Playground executes Python through Pixel; this shim captures matplotlib
	// figures and emits them through stdout markers so we can rebuild proper
	// Jupyter display_data image outputs on the client side.
	const matplotlibPreamble = `\ntry:\n    import io as __semoss_io\n    import base64 as __semoss_base64\n    import matplotlib as __semoss_matplotlib\n    __semoss_matplotlib.use("Agg", force=True)\n    import matplotlib.pyplot as __semoss_plt\n    try:\n        __semoss_plt.switch_backend("Agg")\n    except Exception:\n        pass\n    __semoss_plt.ioff()\n\n    __semoss_inline_chunk_size = 1000\n    __semoss_initial_fig_nums = set(__semoss_plt.get_fignums())\n    __semoss_capture_state = {"did_show": False}\n\n    def __semoss_emit_figures():\n        __semoss_all_fig_nums = list(__semoss_plt.get_fignums())\n        __semoss_fig_nums = [__n for __n in __semoss_all_fig_nums if __n not in __semoss_initial_fig_nums]\n        if not __semoss_fig_nums:\n            __semoss_fig_nums = __semoss_all_fig_nums\n\n        for __semoss_fig_num in __semoss_fig_nums:\n            __semoss_fig = __semoss_plt.figure(__semoss_fig_num)\n            __semoss_buf = __semoss_io.BytesIO()\n            __semoss_fig.savefig(__semoss_buf, format="png", bbox_inches="tight")\n            __semoss_buf.seek(0)\n            __semoss_png = __semoss_base64.b64encode(__semoss_buf.getvalue()).decode("ascii")\n            print("${INLINE_DISPLAY_BEGIN_PREFIX}image/png")\n            for __semoss_idx in range(0, len(__semoss_png), __semoss_inline_chunk_size):\n                print("${INLINE_DISPLAY_CHUNK_PREFIX}" + __semoss_png[__semoss_idx:__semoss_idx + __semoss_inline_chunk_size])\n            print("${INLINE_DISPLAY_END_MARKER}")\n            __semoss_buf.close()\n            __semoss_plt.close(__semoss_fig)\n\n    def __semoss_show_wrapper(*args, **kwargs):\n        __semoss_capture_state["did_show"] = True\n        __semoss_emit_figures()\n        return None\n\n    __semoss_plt.show = __semoss_show_wrapper\nexcept Exception:\n    pass\n`;

	// Real Jupyter kernels auto-render IPython.display objects (HTML, Image,
	// Markdown, ...) via the interactive displayhook and explicit display()
	// calls. Playground's Py() reactor is a plain script runner with neither,
	// so without this shim `HTML(...)`/`Image(...)`/`display(...)` silently
	// produce nothing. This reimplements both mechanisms: a display() /
	// IPython.display.display() shim that inspects an object's _repr_*_
	// methods, and an ast-based rewrite of the cell so its trailing bare
	// expression (if any) is captured and run through the same shim - exactly
	// mirroring Jupyter's "last expression is auto-displayed" behavior.
	const displayPreamble = `
try:
    import base64 as __semoss_disp_b64
    import json as __semoss_disp_json

    __semoss_disp_chunk_size = 1000

    def __semoss_emit_mime(mime_type, payload_bytes):
        try:
            __semoss_encoded = __semoss_disp_b64.b64encode(payload_bytes).decode("ascii")
            print("${INLINE_DISPLAY_BEGIN_PREFIX}" + mime_type)
            for __semoss_i in range(0, len(__semoss_encoded), __semoss_disp_chunk_size):
                print("${INLINE_DISPLAY_CHUNK_PREFIX}" + __semoss_encoded[__semoss_i:__semoss_i + __semoss_disp_chunk_size])
            print("${INLINE_DISPLAY_END_MARKER}")
        except Exception:
            pass

    def __semoss_display_hook(value):
        if value is None:
            return
        try:
            __semoss_html = getattr(value, "_repr_html_", None)
            if callable(__semoss_html):
                __semoss_result = __semoss_html()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/html", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_svg = getattr(value, "_repr_svg_", None)
            if callable(__semoss_svg):
                __semoss_result = __semoss_svg()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("image/svg+xml", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_png = getattr(value, "_repr_png_", None)
            if callable(__semoss_png):
                __semoss_result = __semoss_png()
                if __semoss_result:
                    __semoss_bytes = __semoss_result if isinstance(__semoss_result, (bytes, bytearray)) else __semoss_disp_b64.b64decode(__semoss_result)
                    __semoss_emit_mime("image/png", __semoss_bytes)
                    return
        except Exception:
            pass
        try:
            __semoss_jpeg = getattr(value, "_repr_jpeg_", None)
            if callable(__semoss_jpeg):
                __semoss_result = __semoss_jpeg()
                if __semoss_result:
                    __semoss_bytes = __semoss_result if isinstance(__semoss_result, (bytes, bytearray)) else __semoss_disp_b64.b64decode(__semoss_result)
                    __semoss_emit_mime("image/jpeg", __semoss_bytes)
                    return
        except Exception:
            pass
        try:
            __semoss_md = getattr(value, "_repr_markdown_", None)
            if callable(__semoss_md):
                __semoss_result = __semoss_md()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/markdown", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_json_fn = getattr(value, "_repr_json_", None)
            if callable(__semoss_json_fn):
                __semoss_result = __semoss_json_fn()
                if __semoss_result is not None:
                    __semoss_emit_mime("application/json", __semoss_disp_json.dumps(__semoss_result).encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_latex = getattr(value, "_repr_latex_", None)
            if callable(__semoss_latex):
                __semoss_result = __semoss_latex()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/latex", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_bundle_fn = getattr(value, "_repr_mimebundle_", None)
            if callable(__semoss_bundle_fn):
                __semoss_bundle = __semoss_bundle_fn()
                if isinstance(__semoss_bundle, tuple):
                    __semoss_bundle = __semoss_bundle[0] if __semoss_bundle else None
                if isinstance(__semoss_bundle, dict):
                    for __semoss_mime, __semoss_data in __semoss_bundle.items():
                        if isinstance(__semoss_data, str):
                            __semoss_emit_mime(__semoss_mime, __semoss_data.encode("utf-8"))
                        elif isinstance(__semoss_data, (bytes, bytearray)):
                            __semoss_emit_mime(__semoss_mime, __semoss_data)
                    return
        except Exception:
            pass
        try:
            print(repr(value))
        except Exception:
            pass

    def __semoss_display(*args, **kwargs):
        for __semoss_arg in args:
            __semoss_display_hook(__semoss_arg)

    try:
        import IPython.display as __semoss_ipy_display
        __semoss_ipy_display.display = __semoss_display
    except Exception:
        pass
    try:
        import IPython.core.display as __semoss_ipy_core_display
        __semoss_ipy_core_display.display = __semoss_display
    except Exception:
        pass
    try:
        import builtins as __semoss_builtins
        __semoss_builtins.display = __semoss_display
    except Exception:
        pass
except Exception:
    pass
`;

	// The cell source is base64-encoded so it can travel as an inert Python
	// string literal (never spliced in as raw code) - ast.parse needs the
	// exact source text at runtime to detect/evaluate a trailing bare
	// expression, and base64's [A-Za-z0-9+/=] alphabet can't break out of the
	// surrounding string literal the way raw user code (quotes/backslashes)
	// could.
	const encodedSource = uint8ArrayToBase64(new TextEncoder().encode(source));
	const executionBlock = `
__semoss_source = __semoss_disp_b64.b64decode("${encodedSource}").decode("utf-8")
try:
    # Only our own scaffolding (ast parsing/splitting/compiling) is guarded
    # here; the user's actual code always runs unguarded below so a real
    # SyntaxError/NameError/etc. in their cell still propagates and surfaces
    # as an execution error, instead of being silently swallowed by this
    # try/except.
    import ast as __semoss_ast
    __semoss_tree = __semoss_ast.parse(__semoss_source, mode="exec")
    __semoss_last_node = None
    if __semoss_tree.body and isinstance(__semoss_tree.body[-1], __semoss_ast.Expr):
        __semoss_last_node = __semoss_tree.body.pop()
    __semoss_exec_code = compile(__semoss_tree, "<notebook-cell>", "exec")
    __semoss_eval_code = (
        compile(__semoss_ast.Expression(__semoss_last_node.value), "<notebook-cell>", "eval")
        if __semoss_last_node is not None
        else None
    )
    __semoss_use_ast_path = True
except Exception:
    __semoss_use_ast_path = False

if __semoss_use_ast_path:
    exec(__semoss_exec_code, globals())
    if __semoss_eval_code is not None:
        __semoss_display_hook(eval(__semoss_eval_code, globals()))
else:
    exec(__semoss_source, globals())
`;

	const suffix = `\n\ntry:\n    if not __semoss_capture_state.get("did_show", False):\n        __semoss_emit_figures()\nexcept Exception:\n    pass\n`;
	return `${matplotlibPreamble}${displayPreamble}${executionBlock}${suffix}`;
};
