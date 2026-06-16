# Checkpoint

## Essential notes for all slices

- Keep shared behaviour in single sources of truth wherever possible rather than duplicating logic per activity.
- Keep specification and checkpoint updates concise and high-signal.
- Avoid repeating shared requirements inside activity-specific documentation unless an activity overrides them.

## Current slice

Next implementation slice: Activity 1 as the first full interactive challenge, built on a reusable shared block-assembly feature.

Current progress within this slice:

- Shared block-assembly engine implemented in reusable source files.
- Bubble Sort page now uses the shared assembly engine instead of the placeholder shell.
- Bubble Sort includes demo animation, puzzle workspace, validation, hints, reset and success flow.

## Agreed decisions

- Build as a static HTML, CSS and JS site with no server-side code.
- Use five pages total: four visible activity pages and one hidden challenge page.
- Keep all shared styling and shared page logic in single-source files.
- Use a lightweight vendored CSS layer where it improves consistency, while keeping the visual identity custom to this project.
- Use localStorage for lightweight progress tracking and hidden challenge unlocking.
- Prioritise mobile-first layout and touch-friendly controls.
- Defer all real activity mechanics to later slices.

## Deliverables for completed slice

- challenge_spec.md populated with the agreed structure and behaviour baseline.
- Shared CSS theme file for the tropical visual direction.
- Shared JS file for activity metadata, status display and progress helpers.
- Index page listing all activities and showing the hidden challenge as locked.
- Placeholder pages for all activities using the shared shell and status display.

## Validation completed for prior slice

- Files load as a static site without build tooling.
- Hidden challenge appears locked until all four main activities are marked complete in storage.
- Shared status display renders consistently across pages.

## Notes for upcoming slice

- Treat Bubble Sort as a vertical slice of a shared block-assembly system, not as a one-off page feature.
- Design the block palette, workspace, slots, sockets, snap behaviour and nested container rendering so they can be reused by Algorithm Maze.

## Interaction library evaluation

- Research outcome: prefer a reputable plain-JS library for shared drag/drop and touch behaviour before extending the bespoke assembly engine further.
- Decision now adopted:
    - SortableJS is the shared drag/drop layer for block assembly.
    - The library is vendored locally under `public/js/vendor/Sortable.min.js` rather than loaded from a runtime CDN.
    - `public/js/assembly.js` remains the project-owned wrapper that maps SortableJS container moves into the activity state model.
    - interact.js remains the fallback candidate only if later slices need freer drop geometry than connected sortable containers support well.

## Deliverables for next slice

- Shared block-assembly engine for draggable pieces, relative slot creation, nested sockets and snap-to-nearest placement.
- Bubble Sort page implemented as the first full use of that shared assembly engine.
- Bubble Sort-specific validation, hint, reset, demo animation and success flow.
- Shared assembly logic placed in reusable source files rather than embedded only in bubble-sort.html.

## Validation target for next slice

- Bubble Sort page loads and runs as a static page with no build tooling.
- Users can assemble the Bubble Sort program using the shared block-assembly interaction on mobile-friendly layouts.
- Wrong-but-structurally-valid assemblies remain possible and validate correctly.
- Success updates shared progress and reveals the hidden-challenge key part.

Validation completed so far for this slice:

- app.js, assembly.js and bubble-sort.js pass `node --check`.
- bubble-sort.html serves successfully through a temporary static HTTP server.
- No editor-reported errors remain in the touched files.
- Bubble Sort renders and responds in-browser with the SortableJS-backed assembly layer.
- Bubble Sort now uses neutral Loop and Condition labels, adaptive hints, and a stronger celebratory success state.

## Next logical slice

Use the completed shared block-assembly feature to implement Algorithm Maze as the second full interactive challenge.
