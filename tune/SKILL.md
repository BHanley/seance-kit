---
name: tune-panel
description: Add a small slider panel to a web page so you can set visual values yourself (animation speed, size, spacing, color strength) and copy them back, instead of trading guesses in chat. Use on the second round of feedback on a visual value, or when asked for "tune" or "sliders". Web pages only, not native apps.
---

# Tuning sliders

The panel shows only when the URL has `?tune`, so normal visits don't change.

1. Turn each value into a CSS variable with the current value as its fallback: `animation: spin var(--spin, 2.6s) linear infinite`.
2. Copy `tune.js` from this folder next to the page, and load it only for `?tune` links:

```html
<script>
if (/[?&]tune\b/.test(location.search + location.hash)) {
  const s = document.createElement("script");
  s.src = "tune.js";
  s.onload = () => tune([{ name: "--spin", label: "Spin", min: 0.5, max: 6, step: 0.1, value: 2.6, unit: "s" }]);
  document.head.append(s);
}
</script>
```

3. Give the user the `?tune` link and name what each slider does. Keep it to the values in question, three or four at most.
4. They drag, tap Copy values and paste them into chat. Write those values in as the new fallbacks, leave the loader only if tuning continues, and remove it when they are done.
