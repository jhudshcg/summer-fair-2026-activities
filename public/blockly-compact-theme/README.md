# Blockly Compact Theme

Reusable compact Blockly layer for lesson-set puzzles.

This folder owns Blockly presentation only: theme tokens, renderer constants,
compact fields and small CSS fallbacks. Activity-specific blocks and generators
belong beside the activity that uses them.

## Files

- `tokens.js`: shared colours, font choices and compact defaults.
- `compact-theme.js`: Blockly theme creation and compact renderer registration.
- `compact-fields.js`: no-arrow compact field classes/factories.
- `compact.css`: shared visual CSS for Blockly-hosted pages.
- `shapes/`: notes or helpers for custom connector / outline shapes.

## Current Caution

CSS can hide rendered dropdown arrows, but it cannot reliably reclaim space that
Blockly has already measured. Width reduction comes from compact field classes
and renderer constants; CSS remains a fallback for stock Blockly fields.
