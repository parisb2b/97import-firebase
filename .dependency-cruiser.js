// V172 — Architecture validation rules for 97import-firebase
// dependency-cruiser configuration
// Usage: npx depcruise src --config .dependency-cruiser.js

export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'No circular dependencies allowed between modules',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Every module should be imported by at least one other module',
      from: { orphan: true },
      to: {},
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: 'Source code should not import test utilities',
      from: { path: '^(src)' },
      to: { path: '^(tests|node_modules/.+)' },
    },
    {
      name: 'admin-imports-front',
      severity: 'warn',
      comment: 'Admin pages should not directly import front components',
      from: { path: '^src/admin' },
      to: { path: '^src/front/pages' },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'functions'],
    },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    exclude: {
      path: ['node_modules', 'functions', 'dist', '.claude'],
    },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/[^/]+' },
      archi: { collapsePattern: 'node_modules/[^/]+' },
    },
  },
};
