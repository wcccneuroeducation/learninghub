import { registerEditor } from "../core/registry.js";

registerEditor({
  id: "mcq",
  typeCode: "mcq",
  label: "4-option MCQ",
  group: "Questions",
  icon: "❓",

  renderForm(container) {
    container.innerHTML = `
      <label class="field">
        <span>Question</span>
        <textarea id="mcqPrompt" placeholder="Which change is most concerning in an awake patient following SAH?"></textarea>
      </label>

      <div class="repeat-list">
        ${[1,2,3,4].map(number => `
          <label class="field">
            <span>Option ${number}</span>
            <input class="mcq-option" data-index="${number-1}" placeholder="Option ${number}">
          </label>
        `).join("")}
      </div>

      <label class="field">
        <span>Correct option</span>
        <select id="mcqCorrectIndex">
          <option value="0">Option 1</option>
          <option value="1">Option 2</option>
          <option value="2">Option 3</option>
          <option value="3">Option 4</option>
        </select>
      </label>

      <label class="field">
        <span>Explanation / feedback</span>
        <textarea id="mcqFeedback"></textarea>
      </label>
    `;
  },

  getData(context) {
    const options = [...document.querySelectorAll(".mcq-option")].map(input => input.value.trim());
    const image = context.byId("sharedImageInput").value.trim();
    return {
      prompt: context.byId("mcqPrompt").value.trim(),
      ...(image ? { image } : {}),
      content: {
        options,
        correctIndex: Number(context.byId("mcqCorrectIndex").value)
      },
      feedback: {
        explanation: context.byId("mcqFeedback").value.trim()
      }
    };
  },

  validate(interaction) {
    const errors = [];
    if (!interaction.prompt) errors.push("Enter the MCQ question.");
    if (interaction.content.options.some(option => !option)) errors.push("Complete all four options.");
    return errors;
  },

  renderPreview(container, context) {
    const image = context.byId("sharedImageInput").value.trim();
    const prompt = context.byId("mcqPrompt")?.value.trim() || "Your MCQ question will appear here.";
    const options = [...document.querySelectorAll(".mcq-option")].map((input, index) => ({
      text: input.value.trim() || `Option ${index + 1}`,
      correct: Number(context.byId("mcqCorrectIndex")?.value || 0) === index
    }));

    container.innerHTML = `
      <article class="preview-card">
        ${image ? `<img class="preview-image" src="${context.escapeHtml(image)}" alt="">` : `<div class="preview-placeholder">Dynamic topic header / optional image</div>`}
        <div class="eyebrow">MCQ preview</div>
        <div class="preview-question">${context.escapeHtml(prompt)}</div>
        <div class="preview-options">
          ${options.map(option => `<div class="preview-option ${option.correct ? "correct" : ""}">${context.escapeHtml(option.text)}</div>`).join("")}
        </div>
      </article>
    `;
  }
});
