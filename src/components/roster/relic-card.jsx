import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  useTheme,
} from "@mui/material";
import { EasyTooltip } from "components/easytootlip";
import { RuleList } from "components/roster/rule-list";
import { WeaponList } from "components/roster/weapon-list";
import ReactMarkdown from "react-markdown";

const dummyModel = {
  name: "Battle Brother",
  courage: 7,
  shoot: 6,
  fight: 6,
  defense: 7,
  movement: 5,
  reflexes: 7,
  agility: 6,
  wounds: 3,
  weapons: [
    { id: "marine_rifle" },
    "at_grenade",
    { id: "ccw", count: 2 },
    "marine_pistol",
  ],
  min: 4,
  max: 9,
};

export const RelicCard = (props) => {
  const { faction, relic, data } = props;
  const theme = useTheme();
  const weaponData = relic.weapon
    ? data.getWeapon(relic.weapon, faction)
    : undefined;
  const ruleData = relic.rule ? data.getRule(relic.rule, faction) : undefined;
  const weaponRules = relic.weapon
    ? data.getRules(
        [
          {
            models: [
              {
                ...dummyModel,
                rules: [],
                weapons: [relic.weapon],
              },
            ],
          },
        ],
        faction
      )
    : [];
  const relicCost = Math.round(data.getRelicCost(relic, faction));
  return (
    <>
      {!!relic.description && !!weaponData && (
        <div className="legend-description">
          <ReactMarkdown
            children={`${`__${relic.name} (${relicCost}pts):__ `} ${
              relic.description
            }`}
            className="rule-text"
          />
        </div>
      )}
      <div>
        {!!ruleData && !weaponData && (
          <ReactMarkdown
            children={`${`__${relic.name} (${relicCost}pts):__ `} ${
              ruleData.description
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
