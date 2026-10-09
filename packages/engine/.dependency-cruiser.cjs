/**
 * Règles d'architecture du moteur, vérifiées en CI.
 * Elles garantissent que le domaine reste pur et que les couches ne dépendent que vers l'intérieur :
 * application → domain, jamais l'inverse.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Une dépendance circulaire rend le code difficile à tester et à faire évoluer.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-ne-depend-pas-des-couches-externes',
      comment: 'Le domaine est le cœur métier : il ne connaît ni les cas d\'usage, ni l\'infrastructure.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(application|infrastructure|presentation)' },
    },
    {
      name: 'domain-sans-dependance-externe',
      comment: 'Le domaine n\'importe aucune librairie ni module Node : uniquement du TypeScript pur.',
      severity: 'error',
      from: { path: '^src/domain', pathNot: '\\.test\\.ts$' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'core'] },
    },
    {
      name: 'application-ne-depend-pas-de-l-infrastructure',
      comment: 'Les cas d\'usage passent par des interfaces (ports), jamais par une implémentation concrète.',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/(infrastructure|presentation)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
