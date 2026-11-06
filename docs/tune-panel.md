# Tune panel (`tune.js`)

A small slider panel for any web page, for setting visual values (animation speed, size, spacing, color strength) by hand instead of trading guesses. It shows only when the URL has `?tune`, so normal visits never see it. Drag the sliders, tap **Copy values**, paste the result back into your editor or chat.

Files: `tune/tune.js` (the panel, about 35 lines, no dependencies) and `tune/SKILL.md` (a Claude Code skill that tells Claude how to wire it up; copy the folder to `~/.claude/skills/tune-panel/` to use it). Invoke's client already ships a copy at `invoke/web/tune.js` and loads it for `?tune` in `invoke/web/index.html`.

Use:

1. Turn each value into a CSS variable with the current value as its fallback: `animation: flicker var(--flicker, 2.6s) ease-in-out infinite`.
2. Load `tune.js` only for `?tune` links and describe the sliders:

```html
<script>
if (/[?&]tune\b/.test(location.search + location.hash)) {
  const s = document.createElement("script");
  s.src = "tune.js";
  s.onload = () => tune([{ name: "--flicker", label: "Flame shape", min: 0.8, max: 6, step: 0.1, value: 2.6, unit: "s" }]);
  document.head.append(s);
}
</script>
```

3. Open the page with `?tune` (for Invoke: `https://<your ORIGIN>/?tune`). Keep it to three or four sliders.
4. Copy the values, write them in as the new fallbacks, remove the loader when you're done.
