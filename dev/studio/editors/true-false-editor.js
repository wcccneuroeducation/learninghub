import { registerEditor } from "../core/registry.js";

registerEditor({
  id: "true_false",
  typeCode: "tf",
  label: "True / False",
  group: "Questions",
  icon: "⚖️",

  renderForm(container) {
    container.innerHTML = `
      <label class="field">
        <span>Statement</span>
        <textarea id="tfPrompt" placeholder="A patient cannot deteriorate after successful coiling."></textarea>
      </label>

      <label class="field">
        <span>Correct answer</span>
        <select id="tfCorrectAnswer">
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </label>

      <label class="field">
        <span>Explanation / feedback</span>
        <textarea id="tfFeedback"></textarea>
      </label>
    `;
  },

  getData(context) {
    const image = context.byId("sharedImageInput").value.trim();
    return {
      prompt: context.byId("tfPrompt").value.trim(),
      ...(image ? { image } : {}),
      content: {
        correctAnswer: context.byId("tfCorrectAnswer").value === "true"
      },
      feedback: {
        explanation: context.byId("tfFeedback").value.trim()
      }
    };
  },

  validate(interaction) {
    return interaction.prompt ? [] : ["Enter the true/false statement."];
  },

  renderPreview(container, context) {
    const image = context.byId("sharedImageInput").value.trim();
    const prompt = context.byId("tfPrompt")?.value.trim() || "Your statement will appear here.";
    const correct = context.byId("tfCorrectAnswer")?.value || "true";

    container.innerHTML = `
      <article class="preview-card">
        ${image ? `<img class="preview-image" src="${context.escapeHtml(image)}" alt="">` : `<div class="preview-placeholder">Dynamic topic header / optional image</div>`}
        <div class="eyebrow">True / False preview</div>
        <div class="preview-question">${context.escapeHtml(prompt)}</div>
        <div class="preview-options">
          <div class="preview-option ${correct === "true" ? "correct" : ""}">True</div>
          <div class="preview-option ${correct === "false" ? "correct" : ""}">False</div>
        </div>
      </article>
    `;
  }
});
