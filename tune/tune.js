// Sliders for CSS variables, shown only when the URL contains ?tune. Normal visits never see it.
// tune([{ name: "--speed", label: "Speed", min: 1, max: 6, step: 0.1, value: 2.6, unit: "s" }])
window.tune = function (vars) {
  if (!/[?&]tune\b/.test(location.search + location.hash)) return;
  const root = document.documentElement;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;z-index:9999;right:12px;bottom:12px;width:min(280px,calc(100vw - 24px));" +
    "padding:12px;border-radius:8px;background:#181818;color:#eee;font:14px/1.3 system-ui,sans-serif;box-shadow:0 4px 20px #000a";
  const values = () => vars.map(v => `${v.name}: ${v.value}${v.unit || ""};`).join("\n");
  for (const v of vars) {
    const row = document.createElement("label");
    row.style.cssText = "display:block;margin-bottom:10px";
    const head = document.createElement("div");
    const slider = document.createElement("input");
    Object.assign(slider, { type: "range", min: v.min, max: v.max, step: v.step ?? 0.1, value: v.value });
    slider.style.cssText = "width:100%;height:32px;margin:0;accent-color:#a78bc8";
    const show = () => {
      head.textContent = `${v.label || v.name}: ${v.value}${v.unit || ""}`;
      root.style.setProperty(v.name, v.value + (v.unit || ""));
    };
    slider.oninput = () => { v.value = slider.value; show(); };
    show();
    row.append(head, slider);
    box.append(row);
  }
  const copy = document.createElement("button");
  copy.textContent = "Copy values";
  copy.style.cssText = "width:100%;min-height:44px;border:0;border-radius:6px;background:#a78bc8;color:#111;font:inherit;font-weight:600";
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(values()); copy.textContent = "Copied"; }
    catch { window.prompt("Copy these values", values()); }
    setTimeout(() => { copy.textContent = "Copy values"; }, 1500);
  };
  box.append(copy);
  document.body.append(box);
};
