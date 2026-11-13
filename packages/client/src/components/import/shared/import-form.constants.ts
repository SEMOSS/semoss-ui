/**
 * The field key every engine import form keeps the catalog name under, for every
 * engine type. The backend reserves this key (`UploadUtilities.CATALOG_NAME_KEY`
 * in SEMOSS): create reactors take the name from their own pixel key, and the
 * backend drops this key from the engine details before it writes the engine's
 * smss, so no form field may use it for an engine setting.
 */
export const CATALOG_NAME_KEY = "CATALOG_NAME";
