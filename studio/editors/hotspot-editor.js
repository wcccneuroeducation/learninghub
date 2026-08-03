import { registerEditor } from "../core/registry.js";

function state(context) {
  const editorState = context.getState();
  editorState.imagePath ??= "";
  editorState.currentPoints ??= [];
  editorState.finishedPoints ??= [];
  editorState.regions ??= [];
  editorState.dragging ??= null;
  return editorState;
}

function eventToPercent(event, svg) {
  const rect = svg.getBoundingClientRect();
  return [
    ((event.clientX - rect.left) / rect.width) * 100,
    ((event.clientY - rect.top) / rect.height) * 100
  ];
}

function drawPolygon(svg, points, className, source, regionIndex) {
  if (points.length >= 2) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points.map(([x, y]) => `${x},${y}`).join(" "));
    polygon.setAttribute("class", `polygon-shape ${className}`);
    polygon.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(polygon);
  }

  points.forEach(([x, y], pointIndex) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "0.75");
    circle.setAttribute("class", "vertex");
    circle.dataset.vertex = "true";
    circle.dataset.source = source;
    circle.dataset.regionIndex = String(regionIndex);
    circle.dataset.pointIndex = String(pointIndex);
    circle.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(circle);
  });
}

function renderOverlay(context) {
  const editorState = state(context);
  const svg = context.byId("hotspotSvg");
  if (!svg) return;

  svg.innerHTML = "";
  editorState.regions.forEach((region, regionIndex) => {
    drawPolygon(svg, region.points, "saved", "saved", regionIndex);
  });
  if (editorState.finishedPoints.length) {
    drawPolygon(svg, editorState.finishedPoints, "saved", "finished", -1);
  }
  if (editorState.currentPoints.length) {
    drawPolygon(svg, editorState.currentPoints, "", "current", -1);
  }
}

function renderRegionList(context) {
  const editorState = state(context);
  const list = context.byId("hotspotRegionList");
  const select = context.byId("correctRegionSelect");
  if (!list || !select) return;

  list.innerHTML = "";
  select.innerHTML = `<option value="">Choose correct region</option>`;

  editorState.regions.forEach((region, index) => {
    const item = document.createElement("div");
    item.className = "region-item";
    item.innerHTML = `
      <div>
        <code>${context.escapeHtml(region.id)}</code>
        <div style="color:var(--muted);font-size:12px">${context.escapeHtml(region.label)}</div>
      </div>
      <button class="button danger small" type="button">Delete</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      editorState.regions.splice(index, 1);
      renderRegionList(context);
      renderOverlay(context);
      context.app.refresh();
    });
    list.appendChild(item);

    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = region.label;
    select.appendChild(option);
  });
}

function openImage(path, context) {
  const editorState = state(context);
  if (!path) return;

  const image = context.byId("hotspotImage");
  image.onload = () => {
    editorState.imagePath = path;
    editorState.currentPoints = [];
    editorState.finishedPoints = [];
    editorState.regions = [];
    context.byId("hotspotPlaceholder").hidden = true;
    image.hidden = false;
    context.byId("hotspotSvg").hidden = false;
    renderRegionList(context);
    renderOverlay(context);
    context.app.refresh();
  };
  image.onerror = () => {
    context.byId("hotspotPlaceholder").hidden = false;
    image.hidden = true;
    context.byId("hotspotSvg").hidden = true;
    context.byId("hotspotPlaceholder").textContent = "Image could not be loaded. Check the URL or use Live Server.";
  };
  image.src = path;
}

registerEditor({
  id: "hotspot",
  typeCode: "hot",
  label: "Polygon Hotspot",
  group: "Graphics",
  icon: "📍",

  renderForm(container, context) {
    const editorState = state(context);

    container.innerHTML = `
      <label class="field">
        <span>Question</span>
        <textarea id="hotspotPrompt" placeholder="Tap the area showing subarachnoid blood."></textarea>
      </label>

      <label class="field">
        <span>Hosted image path or full URL</span>
        <div class="repeat-row">
          <input id="hotspotImagePath" value="${context.escapeHtml(editorState.imagePath)}" placeholder="assets/images/sah/sah_010.png">
          <button id="openHotspotImage" class="button secondary small" type="button">Open</button>
        </div>
      </label>

      <div class="hotspot-note">
        Click around the target area. Finish the polygon, enter a stable region ID and label, then save it.
        Coordinates are stored as percentages.
      </div>

      <div id="hotspotStage" class="hotspot-stage" style="margin-top:12px">
        <div id="hotspotPlaceholder" style="color:var(--muted);text-align:center;padding:30px">Open a hosted image to begin.</div>
        <img id="hotspotImage" alt="" hidden>
        <svg id="hotspotSvg" viewBox="0 0 100 100" preserveAspectRatio="none" hidden></svg>
      </div>

      <div class="action-row" style="padding-left:0;padding-right:0">
        <button id="undoHotspotPoint" class="button secondary small" type="button">Undo point</button>
        <button id="finishHotspotPolygon" class="button primary small" type="button">Finish polygon</button>
        <button id="clearHotspotPolygon" class="button danger small" type="button">Clear current</button>
      </div>

      <div class="grid two">
        <label class="field">
          <span>Region ID</span>
          <input id="hotspotRegionId" placeholder="basal_cistern_blood">
        </label>
        <label class="field">
          <span>Region label</span>
          <input id="hotspotRegionLabel" placeholder="Blood within the basal cisterns">
        </label>
      </div>

      <button id="saveHotspotRegion" class="button primary small" type="button">Save region</button>
      <div id="hotspotRegionList" class="region-list"></div>

      <label class="field" style="margin-top:12px">
        <span>Correct region</span>
        <select id="correctRegionSelect"></select>
      </label>

      <label class="field">
        <span>Explanation / feedback</span>
        <textarea id="hotspotFeedback"></textarea>
      </label>
    `;

    const image = context.byId("hotspotImage");
    const svg = context.byId("hotspotSvg");

    context.byId("openHotspotImage").addEventListener("click", () => {
      openImage(context.byId("hotspotImagePath").value.trim(), context);
    });

    svg.addEventListener("pointerdown", event => {
      const vertex = event.target.closest("[data-vertex]");
      if (vertex) {
        editorState.dragging = {
          source: vertex.dataset.source,
          regionIndex: Number(vertex.dataset.regionIndex),
          pointIndex: Number(vertex.dataset.pointIndex)
        };
        return;
      }
      if (editorState.finishedPoints.length) return;
      editorState.currentPoints.push(eventToPercent(event, svg));
      renderOverlay(context);
    });

    svg.addEventListener("pointermove", event => {
      if (!editorState.dragging) return;
      const point = eventToPercent(event, svg);
      const drag = editorState.dragging;

      if (drag.source === "current") {
        editorState.currentPoints[drag.pointIndex] = point;
      } else if (drag.source === "finished") {
        editorState.finishedPoints[drag.pointIndex] = point;
      } else {
        editorState.regions[drag.regionIndex].points[drag.pointIndex] = point;
      }
      renderOverlay(context);
    });

    window.addEventListener("pointerup", () => {
      editorState.dragging = null;
    }, { once: false });

    context.byId("undoHotspotPoint").addEventListener("click", () => {
      editorState.currentPoints.pop();
      renderOverlay(context);
    });

    context.byId("clearHotspotPolygon").addEventListener("click", () => {
      editorState.currentPoints = [];
      editorState.finishedPoints = [];
      renderOverlay(context);
    });

    context.byId("finishHotspotPolygon").addEventListener("click", () => {
      if (editorState.currentPoints.length < 3) {
        alert("A polygon needs at least three points.");
        return;
      }
      editorState.finishedPoints = [...editorState.currentPoints];
      editorState.currentPoints = [];
      renderOverlay(context);
    });

    context.byId("saveHotspotRegion").addEventListener("click", () => {
      const id = context.slug(context.byId("hotspotRegionId").value);
      const label = context.byId("hotspotRegionLabel").value.trim();

      if (!id || !label) {
        alert("Enter a region ID and label.");
        return;
      }
      if (editorState.finishedPoints.length < 3) {
        alert("Finish a polygon before saving.");
        return;
      }
      if (editorState.regions.some(region => region.id === id)) {
        alert("That region ID already exists.");
        return;
      }

      editorState.regions.push({
        id,
        label,
        points: editorState.finishedPoints.map(([x, y]) => [x, y])
      });
      editorState.finishedPoints = [];
      context.byId("hotspotRegionId").value = "";
      context.byId("hotspotRegionLabel").value = "";
      renderRegionList(context);
      renderOverlay(context);
      context.app.refresh();
    });

    if (editorState.imagePath) {
      openImage(editorState.imagePath, context);
    } else {
      renderRegionList(context);
    }
  },

  getData(context) {
    const editorState = state(context);
    const imageId = editorState.imagePath
      ? editorState.imagePath.split("/").pop().replace(/\.[^.]+$/, "")
      : "";

    return {
      prompt: context.byId("hotspotPrompt").value.trim(),
      image: editorState.imagePath,
      hotspotMap: `content/hotspots/${context.byId("topicSelect").value}/${imageId}.hotspots.json`,
      content: {
        correctRegionIds: [context.byId("correctRegionSelect").value].filter(Boolean)
      },
      feedback: {
        explanation: context.byId("hotspotFeedback").value.trim()
      }
    };
  },

  validate(interaction, context) {
    const editorState = state(context);
    const errors = [];
    if (!interaction.prompt) errors.push("Enter the hotspot question.");
    if (!interaction.image) errors.push("Open a hotspot image.");
    if (!editorState.regions.length) errors.push("Save at least one polygon region.");
    if (!interaction.content.correctRegionIds.length) errors.push("Choose the correct region.");
    return errors;
  },

  renderPreview(container, context) {
    const editorState = state(context);
    const prompt = context.byId("hotspotPrompt")?.value.trim() || "Your hotspot instruction will appear here.";
    const correct = context.byId("correctRegionSelect")?.value || "not selected";

    container.innerHTML = `
      <article class="preview-card">
        ${editorState.imagePath ? `<img class="preview-image" src="${context.escapeHtml(editorState.imagePath)}" alt="">` : `<div class="preview-placeholder">Open a hotspot image</div>`}
        <div class="eyebrow">Hotspot preview</div>
        <div class="preview-question">${context.escapeHtml(prompt)}</div>
        <div class="hotspot-note">${editorState.regions.length} saved region${editorState.regions.length === 1 ? "" : "s"}. Correct region: ${context.escapeHtml(correct)}.</div>
      </article>
    `;
  },

  getCompanionFiles(interaction, context) {
    const editorState = state(context);
    if (!interaction.image || !editorState.regions.length) return [];

    const imageId = interaction.image.split("/").pop().replace(/\.[^.]+$/, "");
    return [{
      filename: `${imageId}.hotspots.json`,
      content: {
        schemaVersion: 1,
        imageId,
        image: interaction.image,
        regions: editorState.regions.map(region => ({
          id: region.id,
          label: region.label,
          shape: "polygon",
          points: region.points.map(([x, y]) => [
            Number(x.toFixed(3)),
            Number(y.toFixed(3))
          ])
        }))
      }
    }];
  }
});
