export const studioState = {
  activeEditorId: null,
  editorState: new Map(),
  latestOutput: null
};

export function getEditorState(editorId) {
  if (!studioState.editorState.has(editorId)) {
    studioState.editorState.set(editorId, {});
  }
  return studioState.editorState.get(editorId);
}

export function clearEditorState(editorId) {
  studioState.editorState.set(editorId, {});
}
