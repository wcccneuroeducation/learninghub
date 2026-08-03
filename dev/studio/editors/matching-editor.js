import { registerEditor } from "../core/registry.js";

function addPair(container, left = "", right = "", refresh = () => {}) {
  const row = document.createElement("div");
  row.className = "repeat-row pair";
  row.innerHTML = `
    <input class="match-left" placeholder="Left item" value="${left}">
    <input class="match-right" placeholder="Matching item" value="${right}">
    <button class="button danger small" type="button">Remove</button>
  `;
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    refresh();
  });
  row.querySelectorAll("input").forEach(input => input.addEventListener("input", refresh));
  container.appendChild(row);
}

registerEditor({
  id: "matching",
  typeCode: "match",
  label: "Matching",
  group: "Questions",
  icon: "🔗",

  renderForm(container, context) {
    container.innerHTML = `
      <label class="field">
        <span>Instruction</span>
        <textarea id="matchingPrompt" placeholder="Match each observed change to the most likely complication."></textarea>
      </label>

      <div id="matchingPairs" class="repeat-list"></div>
      <button id="addMatchingPair" class="button secondary small" type="button">+ Add pair</button>

      <label class="field" style="margin-top:12px">
        <span>Completion feedback</span>
        <textarea id="matchingFeedback"></textarea>
      </label>
    `;

    const list = context.byId("matchingPairs");
    const refresh = () => context.app.refresh();
    addPair(list, "New confusion", "Hydrocephalus", refresh);
    addPair(list, "New focal weakness", "Vasospasm / DCI", refresh);
    addPair(list, "Sudden severe headache", "Rebleeding", refresh);
    context.byId("addMatchingPair").addEventListener("click", () => addPair(list, "", "", refresh));
  },

  getData(context) {
    const image = context.byId("sharedImageInput").value.trim();
    const pairs = [...document.querySelectorAll("#matchingPairs .repeat-row")].map((row, index) => ({
      id: `pair_${String(index + 1).padStart(2, "0")}`,
      left: row.querySelector(".match-left").value.trim(),
      right: row.querySelector(".match-right").value.trim()
    }));

    return {
      prompt: context.byId("matchingPrompt").value.trim(),
      ...(image ? { image } : {}),
      content: {
        randomiseLeft: true,
        randomiseRight: true,
        pairs
      },
      feedback: {
        explanation: context.byId("matchingFeedback").value.trim()
      }
    };
  },

  validate(interaction) {
    const errors = [];
    if (!interaction.prompt) errors.push("Enter the matching instruction.");
    if (interaction.content.pairs.length < 2) errors.push("Add at least two pairs.");
    if (interaction.content.pairs.some(pair => !pair.left || !pair.right)) errors.push("Complete every matching pair.");
    return errors;
  },

  renderPreview(container, context) {
    const image = context.byId("sharedImageInput").value.trim();
    const prompt = context.byId("matchingPrompt")?.value.trim() || "Your matching instruction will appear here.";
    const rows = [...document.querySelectorAll("#matchingPairs .repeat-row")];
    const pairs = rows.map(row => ({
      left: row.querySelector(".match-left").value.trim() || "Left item",
      right: row.querySelector(".match-right").value.trim() || "Matching item"
    }));

    container.innerHTML = `
      <article class="preview-card">
        ${image ? `<img class="preview-image" src="${context.escapeHtml(image)}" alt="">` : `<div class="preview-placeholder">Dynamic topic header / optional image</div>`}
        <div class="eyebrow">Matching preview</div>
        <div class="preview-question">${context.escapeHtml(prompt)}</div>
        <div class="match-preview">
          <div class="match-column">${pairs.map(pair => `<div class="match-item">${context.escapeHtml(pair.left)}</div>`).join("")}</div>
          <div class="match-column">${pairs.map(pair => `<div class="match-item">${context.escapeHtml(pair.right)}</div>`).join("")}</div>
        </div>
      </article>
    `;
  }
});
