import { describe, expect, it } from 'vitest';

import { withNonBreakingSpaces } from './french-typography';

describe('Typographie des explications', () => {
  it('rend insécables les espaces de la ponctuation française', () => {
    expect(withNonBreakingSpaces('Ta semaine : « ok ? »')).toBe('Ta semaine : « ok ? »');
  });

  it('ne touche pas au reste du texte', () => {
    expect(withNonBreakingSpaces('Départ à 16h00.')).toBe('Départ à 16h00.');
  });
});
