/**
 * Erreur de base du domaine.
 * Toutes les erreurs métier en héritent : la couche présentation peut ainsi les distinguer
 * d'une erreur technique et afficher leur message (rédigé en français) à l'utilisateur.
 */
export abstract class DomainError extends Error {
  /**
   * @param message - Explication lisible par l'utilisateur
   */
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Levée quand une valeur ne respecte pas les invariants d'un objet du domaine
 * (heure hors de 00h00–23h59, durée non entière, plage dont la fin précède le début…).
 */
export class InvalidValueError extends DomainError {}
