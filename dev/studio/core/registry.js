const editors = new Map();

export function registerEditor(editor) {
  const required = ["id", "label", "group", "icon", "typeCode", "renderForm", "getData", "validate", "renderPreview"];
  const missing = required.filter(key => !(key in editor));
  if (missing.length) {
    throw new Error(`Editor ${editor.id || "(unknown)"} is missing: ${missing.join(", ")}`);
  }
  if (editors.has(editor.id)) {
    throw new Error(`Editor "${editor.id}" is already registered.`);
  }
  editors.set(editor.id, editor);
}

export function getEditor(id) {
  return editors.get(id) || null;
}

export function getEditors() {
  return [...editors.values()];
}
