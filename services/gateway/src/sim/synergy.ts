// Re-export the shared evaluator from protocol so the gateway sim and the
// companion-web preview agree on synergy logic without duplication.
export {
  evaluateTeamSynergies,
  applyBonusToUnit,
  type SynergyCatalogView
} from "@nyrvexis/protocol";
