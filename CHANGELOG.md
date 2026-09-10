# Changelog

All notable changes to the suno-prompting-app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Lyrics settings panel with editable generation and extension prompts, Intro/Outro toggles, and a user-maintained banned-word list. Supported template variables are `{{topic}}`, `{{genre}}`, `{{mood}}`, and `{{banned_words}}`.
- Windows `run-web-app.bat` launcher for the Vite UI and Bun API development server.
- `createHandlerRunner()` utility function to eliminate duplicate handler patterns
- `formatMaxModePrompt()` shared function to consolidate MAX mode formatting
- `validateOllamaEndpoint()` function to enforce localhost-only access
- `InvalidOllamaEndpointError` error class for endpoint validation failures
- Session ID UUID format validation with `DeleteSessionSchema`
- `createMenuBootstrap()` startup controller for bounded macOS menu resilience
- `docs/desktop-menu.md` guidance for deterministic install + bounded retry/focus policy
- Behavior-test harness using `react-test-renderer` for non-DOM hook/component tests

### Changed
- Threaded lyrics settings through storage, RPC validation, AI configuration snapshots, standard generation, Direct Mode, Creative Boost, refinement, remix, and lyric extension flows.
- Made lyric structure prompts conditional: disabled Intro/Outro sections are removed from the positive output format and explicitly forbidden in every applicable prompt.
- Added complete-song AI correction instructions so a response that violates section settings is rewritten coherently rather than edited by string slicing.
- API-key configuration for the web app now comes from the project `.env`; the settings response/UI does not expose the endpoint.
- Refactored all RPC handlers to use `createHandlerRunner()` pattern
- Updated Ollama client and availability check to validate endpoints
- Enhanced SetOllamaSettingsSchema with localhost whitelist validation
- Updated `validate` script to use `test:coverage` instead of `test:precommit`
- Main-process menu startup now installs early and applies bounded macOS retries/reapply rules
- CI release-blocking jobs now run on both Linux and macOS (validate/test/build matrix)
- Coverage policy now fails when tracked files are missing from `lcov.info`

### Removed
- DOMPurify dependency (unused in codebase)
- @types/dompurify dev dependency

### Fixed
- Fixed Creative Boost generation/refinement capturing default lyric settings before persisted configuration was initialized.
- Fixed standard Creative Boost refinement dropping the active lyrics settings when generating lyrics.
- Fixed style-only and Direct Mode refinement paths returning existing lyrics with disabled Intro/Outro sections; affected lyrics are now repaired by AI while preserving the song's story and allowed sections.
- Fixed lyric extension validation to reject disabled Intro/Outro tags before an extension can be inserted.
- Intermittent missing macOS Edit menu after launch by restoring controlled reapply behavior
- Test flake risk from non-awaited `mock.module()` registration in dynamic-import tests

### Security
- Prevented the web settings API from returning the AI endpoint while keeping API keys sourced from `.env` on the server side.
- Added localhost whitelist validation for Ollama endpoints to prevent SSRF attacks
- Added UUID format validation for session IDs to prevent invalid storage operations
- Hardened audit policy to fail closed on unexpected `bun audit --json` payload shapes

## [0.1.0] - 2025-01-27

### Added
- Initial release
- Desktop app for generating Suno V5 prompts
- Local LLM support with Ollama (100% offline, private)
- Three generation modes: Full Prompt, Quick Vibes, Creative Boost
- Max Mode for higher quality output
- Story Mode for narrative prose generation
- AI providers: Ollama, Groq, OpenAI, Anthropic
- Comprehensive genre/mood/instrument guidance
- 60 single genres, 108 multi-genre combinations
- 20 mood categories (~150 moods)
- 1,000+ Suno V5 styles support
- Encrypted local storage for API keys
- Session history management
- Debug trace collection
- 4,670 tests with 100% pass rate

---

## Version Guide

### Major (X.0.0)
- Breaking changes to the public API
- Removed or renamed functionality
- Requires manual migration

### Minor (x.Y.0)
- New features (backward compatible)
- Enhancements to existing functionality

### Patch (x.y.Z)
- Bug fixes
- Non-breaking changes
- Documentation updates
