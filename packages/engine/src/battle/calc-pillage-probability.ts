export const calcPillageProbability = (
  attackerArmySize: number,
  defenderArmySize: number,
  defenderLandSize: number,
  alpha: number = 1.2
) => {

  const density = defenderArmySize / defenderLandSize;
  const defendPower = Math.min(0.98, density / 100);


  const attackerDensity = attackerArmySize / (Math.sqrt(defenderArmySize) * alpha);
  console.log('defend power', defendPower);
  console.log('attac density', attackerDensity);

  const raw = 1 - defendPower * attackerDensity;
  console.log('raw', raw);

  return Math.min(Math.max(0.02, raw), 0.98);
}
