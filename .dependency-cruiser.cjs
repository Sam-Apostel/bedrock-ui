/**
 * Two of the non-negotiables are packaging claims, and packaging claims break
 * silently: a convenience re-export added in an unrelated diff is enough. Both
 * are checked here instead of trusted.
 */
module.exports = {
  forbidden: [
    {
      name: 'default-entry-stays-uncontrolled',
      comment:
        'src/index.ts must not reach the controlled layer by any path. The exports map ' +
        'promises that an app which never imports /controlled never pays for ' +
        'reconciliation; one re-export would make that promise false without changing ' +
        'a single public type.',
      severity: 'error',
      from: { path: '^src/index\\.ts$' },
      to: {
        path: '^src/(controlled\\.ts|create-controlled-root\\.ts|.+/controlled-root\\.tsx)$',
        reachable: true,
      },
    },
    {
      name: 'no-runtime-deps',
      comment:
        'Zero runtime dependencies. react and react-dom are peers and resolve as ' +
        'npm-peer, so they pass; anything landing in "dependencies" does not.',
      severity: 'error',
      from: { path: '^src' },
      to: { dependencyTypes: ['npm', 'npm-bundled', 'npm-optional', 'npm-no-pkg', 'npm-unknown'] },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require'] },
  },
}
