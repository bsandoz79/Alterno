import { describe, expect, it } from 'vitest';

import * as engine from './index';

describe('Moteur Alterno', () => {
  it("expose un point d'entrée public chargeable", () => {
    expect(engine).toBeDefined();
  });
});
