# Implementation Plan - Rama AI Gemini UI & Modular OS Upgrade

## 1. Objectives & UI/UX Architecture
- **Gemini-Style Layout**: Transform Rama Floating Hub into a polished, minimalist executive assistant interface featuring:
  - Slide-out sidebar menu with recent chats, categories, and system shortcuts.
  - Center prompt screen with greeting, dynamic suggestion pills, and clean typography.
  - Fixed bottom input bar with voice/mic input, image/attachment button, and intelligent command dispatching.
- **Reactive Component & Intent Integration**: Seamlessly render dynamic cards (contact lists, media player controls, contract previews) inline within the chat stream using `RamaComponentRegistry` and `RamaIntentRegistry`.
- **Background Execution & Telephony/Messaging Bridge**: Ensure all telephony, WhatsApp/SMS messaging, soundscapes, and lockdown PIN generators execute silently in the background with zero UI clutter.

## 2. Proposed Changes

### A. Rama Floating Hub UI Overhaul (`src/components/RamaFloatingHub.tsx`)
- Implement Gemini-inspired drawer/sidebar for chat history and categories.
- Build gorgeous center greeting / prompt screen with rotating/dynamic suggestion pills.
- Refactor chat input bar to match the native Gemini floating input bar with voice & action triggers.
- Support expandable inline cards for contact selection, media streaming, and contract summaries.

### B. Styling & Design Token Polish (`src/index.css` / Tailwind)
- Ensure sleek dark theme aesthetics, zero-pill discipline (except prompt suggestions), custom scrollbars, and smooth slide transitions.

## 3. Verification Plan
- Compile applet with `compile_applet`.
- Verify linting with `lint_applet`.
