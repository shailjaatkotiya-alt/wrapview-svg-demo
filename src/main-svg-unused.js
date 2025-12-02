// State
let mode = "svg"; // "svg" | "div" | "canvas"
let shapes = [];
let selected = null;
let drawing = false;
let color = "#ff0000";
let stroke = "#000000";
let strokeWidth = 2;
let moveMode = false;

const currentPath = { id: null, d: "" };
const drag = { active: false, info: null };

// Utility helpers
function byId(id) {
  return document.getElementById(id);
}

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach((k) => {
     if (k === "style") Object.assign(el.style, attrs[k]);
     else if (k.startsWith("on") && typeof attrs[k] === "function")
        el.addEventListener(k.slice(2), attrs[k]);
     else el.setAttribute(k, attrs[k]);
  });
  children.forEach((c) => el.appendChild(c));
  return el;
}

function parseTranslate(transform) {
  if (!transform) return [0, 0];
  const m = /translate\(\s*([+-]?\d+(\.\d+)?)(?:[,\s]+([+-]?\d+(\.\d+)?))?\s*\)/.exec(
     transform
  );
  if (!m) return [0, 0];
  const tx = Number(m[1]);
  const ty = m[3] ? Number(m[3]) : 0;
  return [isNaN(tx) ? 0 : tx, isNaN(ty) ? 0 : ty];
}

function clientToSvgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const matrix = svg.getScreenCTM();
  const inv = matrix ? matrix.inverse() : null;
  const cursorpt = inv ? pt.matrixTransform(inv) : pt;
  return { x: Math.round(cursorpt.x), y: Math.round(cursorpt.y) };
}

function downloadBlob(str, filename) {
  const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// DOM shell
function buildShell() {
  const root = document.getElementById("main-area");

  // controls top
  const controls = createEl("div", {
     style: { display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" },
  });

  root.appendChild(controls);
}

// Initialize default shapes (similar to useEffect init)
function initShapes() {
  shapes = [
     {
        id: "rect-1",
        type: "rect",
        x: 20,
        y: 20,
        w: 120,
        h: 80,
        fill: "#ffd166",
        stroke: "#333",
        strokeWidth: 2,
     },
     {
        id: "circle-1",
        type: "circle",
        x: 220,
        y: 80,
        r: 40,
        fill: "#06d6a0",
        stroke: "#333",
        strokeWidth: 2,
     },
  ];
}

// Render main content for current mode
function render() {
  const main = byId("main-area");
  main.innerHTML = ""; // clear
  renderSvgEditor(main);
}

// ---------- SVG Editor ----------
function renderSvgEditor(container) {
  const wrapper = createEl("div", { style: { display: "flex", gap: "12px", flexDirection: "column" } });

  const svgBox = createEl("div", {
     style: {
        border: "1px solid #ccc",
        background: "#fff",
        position: "relative",
     },
  });

  const svg = createElNS("svg", { width: "360", height: "360", id: "main-svg", style: { display: "block", userSelect: "none" } });
  // background rect
  const bg = createElNS("rect", { width: "100%", height: "100%", fill: "#f8f9fa", id: "svg-bg" });
  svg.appendChild(bg);
  svgBox.appendChild(svg);
  wrapper.appendChild(svgBox);

  // right panel
  const panel = createEl("div", { style: { minWidth: "220px", display: "flex" } });

  const btnRow = createEl("div", { style: { display: "flex", gap: "8px", marginBottom: "8px", flexDirection: "column" } });
  const btnAddRect = createEl("button", {}, []);
  btnAddRect.textContent = "Add Rect";
  const btnAddCircle = createEl("button", {}, []);
  btnAddCircle.textContent = "Add Circle";
  const btnFreehand = createEl("button", {}, []);
  btnFreehand.textContent = "Freehand Draw";
  const btnClear = createEl("button", {}, []);
  btnClear.textContent = "Clear";
  const btnMoveMode = createEl("button", {}, []);
  btnMoveMode.textContent = moveMode ? "Move Mode: ON" : "Move Mode: OFF";
  if (moveMode) btnMoveMode.style.background = "#dbeafe";
  const dlRow = createEl("div", { style: { marginTop: "12px" } });
  const btnDownload = createEl("button", {}, []);
  btnDownload.textContent = "Download SVG";
  const selContainer = createEl("div", { style: { marginTop: "8px" } });

  btnRow.appendChild(btnAddRect);
  btnRow.appendChild(btnAddCircle);
  btnRow.appendChild(btnFreehand);
  btnRow.appendChild(btnClear);
  btnRow.appendChild(btnMoveMode);
  btnRow.appendChild(btnDownload);
  btnRow.appendChild(selContainer);

  panel.appendChild(btnRow);

  wrapper.appendChild(panel);
  container.appendChild(wrapper);

  // draw shapes into svg
  function refreshSvgDom() {
     // remove existing shape children (except background)
     // remove all except first child (bg)
     while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);

     shapes.forEach((sh) => {
        let el;
        if (sh.type === "rect") {
          el = createElNS("rect", {
             x: sh.x,
             y: sh.y,
             width: sh.w,
             height: sh.h,
             fill: sh.fill || color,
             stroke: sh.stroke || stroke,
             "stroke-width": sh.strokeWidth ?? strokeWidth,
          });
        } else if (sh.type === "circle") {
          el = createElNS("circle", {
             cx: sh.x,
             cy: sh.y,
             r: sh.r,
             fill: sh.fill || color,
             stroke: sh.stroke || stroke,
             "stroke-width": sh.strokeWidth ?? strokeWidth,
          });
        } else if (sh.type === "path") {
          el = createElNS("path", {
             d: sh.d,
             fill: sh.fill ?? "none",
             stroke: sh.stroke || stroke,
             "stroke-width": sh.strokeWidth ?? strokeWidth,
             style: "vector-effect: non-scaling-stroke",
          });
        }
        if (!el) return;
        if (sh.transform) el.setAttribute("transform", sh.transform);
        el.dataset.id = sh.id;
        el.style.cursor = moveMode ? "move" : "pointer";

        // selection on click (if not dragging)
        el.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          if (!moveMode) {
             selected = sh.id;
             updateSelectedPanel();
             refreshSvgDom(); // highlight if needed later
             return;
          }
          // start dragging
          startDragForShape(e, sh, svg);
        });
        svg.appendChild(el);
     });
  }

  function createSelectedInputs(sh) {
     selContainer.innerHTML = "";
     const title = createEl("div", {}, []);
     title.innerHTML = `<strong>Selected:</strong> ${sh ? sh.id : "none"}`;
     selContainer.appendChild(title);
     if (!sh) return;
     const panelInner = createEl("div", { style: { marginTop: "8px", display: "grid", gap: "6px" } });

     // Fill
     const fillLabel = createEl("label", {}, []);
     fillLabel.innerHTML = `Fill: `;
     const fillInput = createEl("input", { type: "color", value: sh.fill || color });
     fillInput.addEventListener("input", (e) => {
        sh.fill = e.target.value;
        refreshSvgDom();
     });
     fillLabel.appendChild(fillInput);
     panelInner.appendChild(fillLabel);

     // Stroke
     const strokeLabel = createEl("label", {}, []);
     strokeLabel.innerHTML = `Stroke: `;
     const strokeInput = createEl("input", { type: "color", value: sh.stroke || stroke });
     strokeInput.addEventListener("input", (e) => {
        sh.stroke = e.target.value;
        refreshSvgDom();
     });
     strokeLabel.appendChild(strokeInput);
     panelInner.appendChild(strokeLabel);

     // StrokeWidth
     const swLabel = createEl("label", {}, []);
     swLabel.innerHTML = `Stroke Width: `;
     const swInput = createEl("input", { type: "number", value: sh.strokeWidth ?? strokeWidth, style: { width: "80px" } });
     swInput.addEventListener("input", (e) => {
        sh.strokeWidth = Number(e.target.value);
        refreshSvgDom();
     });
     swLabel.appendChild(swInput);
     panelInner.appendChild(swLabel);

     if (sh.type === "rect") {
        const posLabel = createEl("label", {}, []);
        posLabel.innerHTML = `X: `;
        const xIn = createEl("input", { type: "number", value: sh.x, style: { width: "80px" } });
        xIn.addEventListener("input", (e) => {
          sh.x = Number(e.target.value);
          refreshSvgDom();
        });
        posLabel.appendChild(xIn);
        posLabel.appendChild(document.createTextNode(" Y: "));
        const yIn = createEl("input", { type: "number", value: sh.y, style: { width: "80px" } });
        yIn.addEventListener("input", (e) => {
          sh.y = Number(e.target.value);
          refreshSvgDom();
        });
        posLabel.appendChild(yIn);
        panelInner.appendChild(posLabel);

        const sizeLabel = createEl("label", {}, []);
        sizeLabel.innerHTML = `W: `;
        const wIn = createEl("input", { type: "number", value: sh.w, style: { width: "80px" } });
        wIn.addEventListener("input", (e) => {
          sh.w = Number(e.target.value);
          refreshSvgDom();
        });
        sizeLabel.appendChild(wIn);
        sizeLabel.appendChild(document.createTextNode(" H: "));
        const hIn = createEl("input", { type: "number", value: sh.h, style: { width: "80px" } });
        hIn.addEventListener("input", (e) => {
          sh.h = Number(e.target.value);
          refreshSvgDom();
        });
        sizeLabel.appendChild(hIn);
        panelInner.appendChild(sizeLabel);
     } else if (sh.type === "circle") {
        const posLabel = createEl("label", {}, []);
        posLabel.innerHTML = `CX: `;
        const xIn = createEl("input", { type: "number", value: sh.x, style: { width: "80px" } });
        xIn.addEventListener("input", (e) => {
          sh.x = Number(e.target.value);
          refreshSvgDom();
        });
        posLabel.appendChild(xIn);
        posLabel.appendChild(document.createTextNode(" CY: "));
        const yIn = createEl("input", { type: "number", value: sh.y, style: { width: "80px" } });
        yIn.addEventListener("input", (e) => {
          sh.y = Number(e.target.value);
          refreshSvgDom();
        });
        posLabel.appendChild(yIn);
        posLabel.appendChild(document.createTextNode(" R: "));
        const rIn = createEl("input", { type: "number", value: sh.r, style: { width: "80px" } });
        rIn.addEventListener("input", (e) => {
          sh.r = Number(e.target.value);
          refreshSvgDom();
        });
        posLabel.appendChild(rIn);
        panelInner.appendChild(posLabel);
     }

     selContainer.appendChild(panelInner);
  }

  function updateSelectedPanel() {
     const sh = shapes.find((s) => s.id === selected);
     createSelectedInputs(sh);
  }

  // Buttons behavior
  btnAddRect.addEventListener("click", () => {
     const id = `rect-${Date.now()}`;
     shapes.push({ id, type: "rect", x: 30, y: 30, w: 100, h: 60, fill: color, stroke, strokeWidth });
     selected = id;
     updateSelectedPanel();
     refreshSvgDom();
  });

  btnAddCircle.addEventListener("click", () => {
     const id = `circle-${Date.now()}`;
     shapes.push({ id, type: "circle", x: 120, y: 120, r: 30, fill: color, stroke, strokeWidth });
     selected = id;
     updateSelectedPanel();
     refreshSvgDom();
  });

  btnFreehand.addEventListener("click", () => {
     alert("To draw freehand, press mouse down on the SVG background and move. Disable Move mode first if active.");
  });

  btnClear.addEventListener("click", () => {
     shapes = [];
     selected = null;
     updateSelectedPanel();
     refreshSvgDom();
  });

  btnMoveMode.addEventListener("click", () => {
     moveMode = !moveMode;
     btnMoveMode.textContent = moveMode ? "Move Mode: ON" : "Move Mode: OFF";
     btnMoveMode.style.background = moveMode ? "#dbeafe" : "";
     refreshSvgDom();
  });

  btnDownload.addEventListener("click", () => {
     const clone = svg.cloneNode(true);
     clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
     const svgString = new XMLSerializer().serializeToString(clone);
     downloadBlob(svgString, "drawing.svg");
  });

  // Freehand drawing on bg
  bg.addEventListener("mousedown", (e) => {
     if (moveMode) return;
     drawing = true;
     const pt = clientToSvgPoint(svg, e);
     currentPath.id = `path-${Date.now()}`;
     currentPath.d = `M ${pt.x} ${pt.y}`;
     shapes.push({ id: currentPath.id, type: "path", d: currentPath.d, fill: "none", stroke: color, strokeWidth });
     selected = currentPath.id;
     updateSelectedPanel();
     refreshSvgDom();
     e.preventDefault();
  });

  svg.addEventListener("mousemove", (e) => {
     if (!drawing) return;
     const pt = clientToSvgPoint(svg, e);
     currentPath.d += ` L ${pt.x} ${pt.y}`;
     const sh = shapes.find((s) => s.id === currentPath.id);
     if (sh) {
        sh.d = currentPath.d;
        refreshSvgDom();
     }
  });

  window.addEventListener("mouseup", () => {
     drawing = false;
     currentPath.id = null;
     currentPath.d = "";
  });

  // start dragging for a shape (move mode)
  function startDragForShape(e, sh, svgEl) {
     const pt = clientToSvgPoint(svgEl, e);
     drag.active = true;
     drag.info = {
        id: sh.id,
        startX: pt.x,
        startY: pt.y,
        origX: sh.x ?? 0,
        origY: sh.y ?? 0,
        origTx: parseTranslate(sh.transform)[0],
        origTy: parseTranslate(sh.transform)[1],
        shapeType: sh.type,
     };

     function onMove(ev) {
        if (!drag.active || !drag.info) return;
        const mpt = clientToSvgPoint(svgEl, ev);
        const dx = mpt.x - drag.info.startX;
        const dy = mpt.y - drag.info.startY;
        shapes = shapes.map((x) => {
          if (x.id !== drag.info.id) return x;
          if (x.type === "rect" || x.type === "circle") {
             return { ...x, x: drag.info.origX + dx, y: drag.info.origY + dy };
          }
          const tx = drag.info.origTx + dx;
          const ty = drag.info.origTy + dy;
          return { ...x, transform: `translate(${tx} ${ty})` };
        });
        refreshSvgDom();
        updateSelectedPanel();
     }

     function onUp() {
        drag.active = false;
        drag.info = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
     }

     window.addEventListener("mousemove", onMove);
     window.addEventListener("mouseup", onUp);
  }

  // initial render
  updateSelectedPanel();
  refreshSvgDom();

  // click background to deselect
  svg.addEventListener("mousedown", (e) => {
     if (e.target === bg) {
        selected = null;
        updateSelectedPanel();
        refreshSvgDom();
     }
  });
}

// SVG namespace helper
function createElNS(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((k) => {
     el.setAttribute(k, attrs[k]);
  });
  return el;
}

// Init
buildShell();
initShapes();
render();

// Expose small debug helpers in window (optional)
window.__svgApp = {
  getState: () => ({ mode, shapes, selected, color, stroke, strokeWidth, moveMode }),
};