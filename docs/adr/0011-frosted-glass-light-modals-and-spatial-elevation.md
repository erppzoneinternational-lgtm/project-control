# 0011. Frosted Glass Light Modals and 3D Spatial Elevation

## Context
User visual feedback and design reviews identified heavy, pitch-black modal backdrops (`bg-slate-950/60` and `bg-slate-950/80`) that conflicted with the mandated primary Light Theme ("Industrial Chic"). Modal dialogs and review drawers felt disconnected from the underlying application workspace.

## Decision
All modal dialogs, drawers, and inspection overlays adopt a unified light-first visual architecture:
1. **Translucent Frosted Glass Overlay**: Replace heavy dark backdrops with high-refinement frosted glass overlays (`backdrop-blur-md bg-slate-900/20` or `bg-slate-800/15`), preserving underlying page context without eye fatigue.
2. **3D Spatial Card Elevation**: Modal cards utilize crisp white backgrounds (`bg-white`), delicate borders (`border-slate-200/80`), and layered drop shadows (`shadow-2xl shadow-slate-900/10`) to provide natural Z-axis depth.
3. **Semantic Badge Palette**: Standardize status pills across tables and modals:
   - Emerald: Approved (`معتمد`)
   - Amber/Warm Gold: Under Review (`قيد المراجعة`)
   - Violet: Claim / Variation Order (`أمر تغيير / مطالبة`)
   - Rose: Rejected (`مرفوض`)

## Consequences
- Harmonizes the visual experience across all 7 portals and sub-dashboards with zero dark-mode jarring in default mode.
- Provides immediate visual hierarchy and spatial clarity during intensive data review sessions.
- Maintains full WCAG AAA color contrast ratios for text on light backgrounds.
