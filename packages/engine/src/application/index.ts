/**
 * Couche application : cas d'usage (SimulatePlan, DeclareDeviation, RecalibrateCounter…).
 * Elle orchestre le domaine et ne dépend que de lui ; l'extérieur lui est fourni par injection.
 */
export {
  SimulatePlan,
  type PaceName,
  type SimulatedDay,
  type Simulation,
  type SimulationObjective,
  type SimulationRequest,
} from './simulate-plan';
