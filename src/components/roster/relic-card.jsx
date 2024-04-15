import { WeaponList } from "components/roster/weapon-list";
import ReactMarkdown from "react-markdown";

export const RelicCard = (props) => {
  const { faction, relic, data } = props;
  const weaponData = relic.weapon
    ? data.getWeapon(relic.weapon, faction)
    : undefined;
  const ruleData = relic.rule ? data.getRule(relic.rule, faction) : undefined;
  const relicCost = Math.round(data.getRelicCost(relic, faction));
  return (
    <>
      {!!relic.description && !!weaponData && (
        <div className="legend-description">
          <ReactMarkdown
            children={`${`__${relic.name} (${relicCost}pts):__ `} ${relic.description
              }`}
            className="rule-text"
          />
        </div>
      )}
      <div>
        {!!ruleData && !weaponData && (
          <ReactMarkdown
            children={`${`__${relic.name} (${relicCost}pts):__ `} ${ruleData.description
              }`}
            className="rule-text"
          />
        )}
        {!!weaponData && (
          <WeaponList weapons={[weaponData]} faction={faction} data={data} />
        )}
      </div>
    </>
  );
};
