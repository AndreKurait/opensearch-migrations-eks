# Technology Stack Decisions

## Stack Overview

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Astro + Starlight | Astro 6 |
| Linting | ESLint + typescript-eslint (strict, type-checked) | ESLint 10 |
| Formatting | Prettier | 3 |
| Type checking | TypeScript (strict mode + extra flags) | TypeScript 6 |
| Unit/component tests | Vitest | 4 |
| E2E tests | Playwright | 1.59 |
| Accessibility (lint) | eslint-plugin-jsx-a11y | latest |
| Accessibility (runtime) | @axe-core/playwright | latest |
| CSS linting | Stylelint | Only if custom CSS justifies it |
| Git hooks | husky + lint-staged | Optional, for pre-commit enforcement |

## Key Decisions

### Astro + Starlight

The right choice for a fast, docs-focused static site. Starlight provides built-in docs features (navigation, search, i18n) out of the box.

### ESLint over Biome

ESLint remains the safest option for Astro projects. Plugin support and ecosystem maturity are stronger than newer alternatives like Biome. Use `@typescript-eslint/strict-type-checked` and `@typescript-eslint/stylistic-type-checked` rule sets — everything set to `error`, not `warn`.

### Prettier for formatting

Biome is worth watching for a more consolidated toolchain, but it is not yet the clear default for Astro docs projects. Prettier 3 remains the standard.

### TypeScript strict mode + extra flags

Beyond `strict: true`, enable these additional flags:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Vitest for unit/component testing

Native Astro integration, fast execution, compatible API.

### Playwright for E2E testing

Mature, fast, CI-friendly, and purpose-built for deterministic browser testing. Paired with `@axe-core/playwright` for accessibility regression coverage.

### Amazon Nova Act — not recommended

Nova Act is built for agentic browser workflows, not standard deterministic site testing. It is not the right default choice for validating a Starlight docs site. Playwright covers this need.

## Summary

The production stack is:

**Astro 6 + Starlight + ESLint 10 + typescript-eslint strict rules + Prettier 3 + TypeScript 6 + Vitest 4 + Playwright 1.59 + @axe-core/playwright**

This gives the best balance of correctness, maintainability, ecosystem support, and long-term stability.
