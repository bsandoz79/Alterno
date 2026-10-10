/**
 * Couleurs de la charte L4 « Rouge et crème » (thème clair).
 * Nommées par rôle plutôt que par teinte : changer de charte (ou ajouter le thème sombre L3)
 * ne demandera de modifier que ce fichier.
 */
export const COLORS = {
  /** Fond des écrans. */
  background: '#FBF6EE',
  /** Fond des cartes et de la barre d'onglets. */
  surface: '#FFFFFF',
  /** Rouge de l'entreprise : actions principales, onglet actif. */
  primary: '#C81F2A',
  /** Rouge appuyé (bouton pressé, lien survolé). */
  primaryPressed: '#9E1720',
  /** Rouge très clair : fonds de boutons secondaires. */
  primarySoft: '#FBE3E0',
  /** Texte principal. */
  text: '#33221C',
  /** Texte secondaire (dates, légendes). */
  textMuted: '#77615A',
  /** Bordures discrètes. */
  border: '#F3E2D8',
  /** Valeur positive (compteur créditeur). */
  positive: '#2F5A3A',
  /** Fond des alertes « attention ». */
  warningBackground: '#FBE7C6',
  /** Texte des alertes « attention ». */
  warningText: '#6B4100',
} as const;
