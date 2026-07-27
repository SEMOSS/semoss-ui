// Markers that delimit an inline MIME payload (image bytes, or a
// base64-encoded text/JSON display) printed to stdout by the shim in
// execution-source.ts, so extract-display-outputs.ts can pull them back out
// of the captured console log and rebuild a proper Jupyter output.
export const INLINE_DISPLAY_BEGIN_PREFIX = "__SEMOSS_NOTEBOOK_IMAGE_BEGIN__:";
export const INLINE_DISPLAY_CHUNK_PREFIX = "__SEMOSS_NOTEBOOK_IMAGE_CHUNK__:";
export const INLINE_DISPLAY_END_MARKER = "__SEMOSS_NOTEBOOK_IMAGE_END__";
