# figma-code-context

## 1.5.5

### Patch Changes

- Adaptive pixel-perfect refinement: MVU-based top-to-bottom workflow with precision decision matrix
- Add depth parameter to get_node_css for deep component refinement
- Add includeCSS to get_component_variants for state/variant CSS diff output
- Support IMAGE fill type in CSS generation (background-image with scaleMode mapping)

## 1.5.4

### Patch Changes

- Enhance CSS/Tailwind generation: precision modes, token/variable resolution, z-index, aspect-ratio, counterAxisSpacing
- Improve MCP tool descriptions with workflow guidance (when to use, alternatives)

## 1.5.3

### Minor Changes

- Add gen-app skill: one-command full design-to-code pipeline with automated quality verification

## 1.5.2

### Patch Changes

- Fix: rebuild with correct bundled dist (previous publish had stale build artifacts)

## 1.5.1

### Patch Changes

- Fix: init subcommand no longer requires FIGMA_TOKEN to be set

## 1.5.0

### Minor Changes

- Use subcommand pattern: `npx figma-code-context init` replaces standalone `figma-code-init` binary

## 1.4.1

### Patch Changes

- Unify all naming references to figma-code-context/figma-code-init, include README in npm package
