import { StudioApp } from "./core/app.js";

import "./editors/mcq-editor.js";
import "./editors/true-false-editor.js";
import "./editors/matching-editor.js";
import "./editors/hotspot-editor.js";

window.addEventListener("DOMContentLoaded", () => {
  const app = new StudioApp();
  app.init();
});
