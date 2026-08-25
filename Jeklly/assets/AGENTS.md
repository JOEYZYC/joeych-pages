# Archived Assets Guide

## Overview

This directory retains the archived global presentation and shared browser-behavior source. The [design contract](../DESIGN.md) records the associated design contract. Semantic records and their colocated public files are owned by the [Profile bundles](../../Profile/).

## Retained Structure

- `css/main.css` retains the global tokens, reset, shared components, responsive rules, and motion states.
- `js/main.js` retains the shared browser behavior.
- `img/`, when present as an ignored mirror, contains published portraits, icons, and certificate files. Certificate paths remain literal data associations.

## Archived Contracts

- `main.css` is the single global token and component stylesheet for the preserved pages.
- `main.js` is a dependency-free IIFE that contains language, header, navigation, scroll, reveal, and certificate-modal behavior.
- Selectors, state classes, ARIA attributes, and data attributes are shared contracts with the preserved templates.
- Chinese and English copy use `data-en` and related attributes; `applyLang()` replaces `textContent`.
- The preserved source keeps keyboard access, visible focus, focus restoration, readable no-script content, reduced-motion behavior, literal media names, and certificate associations.

## Archive Boundaries

- Do not split shared styles into page-local copies or introduce a framework, bundler, dependency, or alternate runtime model.
- Do not rename or broaden shared selectors, classes, ARIA attributes, or `data-certs` payloads.
- Do not add arbitrary colors, `transition: all`, layout-property animation, hover-only information, or unaffiliated media.
- This is reference material only. It does not provide an active editing, testing, or deployment workflow.
