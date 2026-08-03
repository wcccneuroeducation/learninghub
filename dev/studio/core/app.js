import { STUDIO_CONFIG } from "../config/studio-config.js";
import { getEditorState, clearEditorState, studioState } from "./state.js";
import { getEditor, getEditors } from "./registry.js";
import { copyText, escapeHtml, setStatus, slug } from "./helpers.js";

const byId = id => document.getElementById(id);

export class StudioApp {
  constructor() {
    this.activeEditor = null;
    this.context = {
      app: this,
      config: STUDIO_CONFIG,
      byId,
      escapeHtml,
      slug,
      getState: () => getEditorState(this.activeEditor?.id)
    };
  }

  init() {
    this.populateSharedFields();
    this.renderNavigation();
    this.bindSharedEvents();

    const firstEditor = getEditors()[0];
    if (!firstEditor) throw new Error("No editors are registered.");
    this.activateEditor(firstEditor.id);
  }

  populateSharedFields() {
    this.populateSelect(byId("topicSelect"), STUDIO_CONFIG.topics);
    this.populateSelect(byId("categorySelect"), STUDIO_CONFIG.categories);
    this.populateSelect(byId("difficultySelect"), STUDIO_CONFIG.difficulties);
    this.populateSelect(byId("subtopicInput"), STUDIO_CONFIG.subtopics);
    const destinationHost = byId("destinationChecks");
    destinationHost.innerHTML = "";
    STUDIO_CONFIG.destinations.forEach(destination => {
      const label = document.createElement("label");
      label.className = "destination-option";
      label.innerHTML = `
        <input type="checkbox" data-destination="${destination.id}" ${destination.default ? "checked" : ""}>
        <span>${destination.label}</span>
      `;
      destinationHost.appendChild(label);
    });
  }

  populateSelect(select, items) {
    select.innerHTML = "";
    items.forEach(item => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }

  renderNavigation() {
    const nav = byId("editorNav");
    nav.innerHTML = "";

    const groups = new Map();
    getEditors().forEach(editor => {
      if (!groups.has(editor.group)) groups.set(editor.group, []);
      groups.get(editor.group).push(editor);
    });

    groups.forEach((editors, group) => {
      const heading = document.createElement("div");
      heading.className = "editor-group-label";
      heading.textContent = group;
      nav.appendChild(heading);

      editors.forEach(editor => {
        const button = document.createElement("button");
        button.className = "editor-button";
        button.type = "button";
        button.dataset.editorId = editor.id;
        button.innerHTML = `<span>${editor.icon}</span><span>${editor.label}</span>`;
        button.addEventListener("click", () => this.activateEditor(editor.id));
        nav.appendChild(button);
      });
    });
  }

  bindSharedEvents() {
    [
      "topicSelect","subtopicInput","categorySelect","difficultySelect",
      "questionNumberInput","estimatedSecondsInput","tagsInput","sharedImageInput"
    ].forEach(id => {
      byId(id).addEventListener("input", () => this.refresh());
      byId(id).addEventListener("change", () => this.refresh());
    });

    document.querySelectorAll("[data-destination]").forEach(input => {
      input.addEventListener("change", () => this.refresh());
    });

    byId("generateButton").addEventListener("click", () => this.generate());
    byId("resetButton").addEventListener("click", () => this.resetCurrentEditor());
    byId("copyFilenameButton").addEventListener("click", async () => {
      await this.safeCopy(byId("filenameOutput").textContent, "Filename copied.");
    });
    byId("copyJsonButton").addEventListener("click", async () => {
      await this.safeCopy(byId("jsonOutput").value, "JSON copied.");
    });
    byId("copyManifestButton").addEventListener("click", async () => {
      const entry = {
        id: this.getInteractionId(),
        path: `content/interactions/${byId("topicSelect").value}/${this.getInteractionId()}.json`
      };
      await this.safeCopy(JSON.stringify(entry, null, 2), "Manifest entry copied.");
    });
  }

  activateEditor(editorId) {
    const editor = getEditor(editorId);
    if (!editor) return;

    this.activeEditor = editor;
    studioState.activeEditorId = editor.id;

    document.querySelectorAll(".editor-button").forEach(button => {
      button.classList.toggle("active", button.dataset.editorId === editor.id);
    });

    byId("editorGroup").textContent = editor.group;
    byId("editorTitle").textContent = editor.label;
    byId("editorFormHost").innerHTML = "";

    editor.renderForm(byId("editorFormHost"), this.context);
    this.bindEditorFormEvents();
    this.refresh();
  }

  bindEditorFormEvents() {
    const host = byId("editorFormHost");
    host.querySelectorAll("input,select,textarea").forEach(element => {
      element.addEventListener("input", () => this.refresh());
      element.addEventListener("change", () => this.refresh());
    });
  }

  refresh() {
    if (!this.activeEditor) return;
    byId("filenameOutput").textContent = `${this.getInteractionId()}.json`;
    this.activeEditor.renderPreview(byId("previewHost"), this.context);
  }

  getInteractionId() {
    const topic = byId("topicSelect").value || "topic";
    const number = String(Math.max(1, Number(byId("questionNumberInput").value) || 1)).padStart(3, "0");
    return `${topic}_${this.activeEditor.typeCode}_${number}`;
  }

  getSharedMetadata() {
    const useIn = {};
    document.querySelectorAll("[data-destination]").forEach(box => {
      if (box.checked) useIn[box.dataset.destination] = true;
    });

    return {
      schemaVersion: STUDIO_CONFIG.schemaVersion,
      id: this.getInteractionId(),
      type: this.activeEditor.id,
      topic: byId("topicSelect").value,
      subtopic: slug(byId("subtopicInput").value),
      category: byId("categorySelect").value,
      difficulty: byId("difficultySelect").value,
      primaryDestination: STUDIO_CONFIG.primaryDestination,
      useIn,
      tags: byId("tagsInput").value.split(",").map(slug).filter(Boolean),
      estimatedSeconds: Math.max(5, Number(byId("estimatedSecondsInput").value) || 30),
      mobileFriendly: true
    };
  }

  generate() {
    const shared = this.getSharedMetadata();
    const editorData = this.activeEditor.getData(this.context);
    const interaction = {
      ...shared,
      ...editorData
    };

    const errors = [
      ...this.validateShared(shared),
      ...this.activeEditor.validate(interaction, this.context)
    ];

    if (errors.length) {
      setStatus(byId("formStatus"), `Cannot generate: ${errors.join(" ")}`, "bad");
      return;
    }

    const output = {
      interaction,
      companionFiles: this.activeEditor.getCompanionFiles
        ? this.activeEditor.getCompanionFiles(interaction, this.context)
        : []
    };

    studioState.latestOutput = output;
    byId("jsonOutput").value = JSON.stringify(interaction, null, 2);
    this.renderCompanionFiles(output.companionFiles);
    setStatus(byId("formStatus"), "Interaction JSON generated.", "good");
    setStatus(byId("outputStatus"), "Ready to copy into VS Code.", "good");
  }

  validateShared(shared) {
    const errors = [];
    if (!shared.subtopic) errors.push("Enter a subtopic.");
    return errors;
  }

  renderCompanionFiles(files) {
    const host = byId("companionFilesHost");
    host.innerHTML = "";

    files.forEach(file => {
      const wrapper = document.createElement("div");
      wrapper.className = "companion-file";
      wrapper.innerHTML = `
        <div class="filename-row">
          <code>${escapeHtml(file.filename)}</code>
          <button class="button small" type="button">Copy file</button>
        </div>
        <textarea readonly spellcheck="false">${escapeHtml(JSON.stringify(file.content, null, 2))}</textarea>
      `;
      wrapper.querySelector("button").addEventListener("click", async () => {
        await this.safeCopy(JSON.stringify(file.content, null, 2), `${file.filename} copied.`);
      });
      host.appendChild(wrapper);
    });
  }

  resetCurrentEditor() {
    if (!confirm("Clear the current editor content?")) return;
    clearEditorState(this.activeEditor.id);
    byId("editorFormHost").innerHTML = "";
    this.activeEditor.renderForm(byId("editorFormHost"), this.context);
    this.bindEditorFormEvents();
    byId("jsonOutput").value = "";
    byId("companionFilesHost").innerHTML = "";
    this.refresh();
    setStatus(byId("formStatus"), "Current editor reset.", "good");
  }

  async safeCopy(text, successMessage) {
    try {
      await copyText(text);
      setStatus(byId("outputStatus"), successMessage, "good");
    } catch (error) {
      setStatus(byId("outputStatus"), error.message, "bad");
    }
  }
}
