import { Box, Stack, Typography } from "@mui/material";
import { RelicCard } from "components/roster/relic-card";
import { get, groupBy, sortBy } from "lodash";

export const Relics = (props) => {
  const { data, faction, nameFilter } = props;

  const nameFilterer = (relic) => {
    if (!nameFilter) {
      return true;
    }
    const relicData = relic.weapon
      ? data.getWeapon(relic.weapon, faction)
      : data.getRule(relic.rule, faction);
    return relicData.name.toLowerCase().includes(nameFilter.toLowerCase());
  };

  const relics = data.getRelics(faction).filter(nameFilterer).filter((relic) => !relic.subfactions);
  const sortedRelics = sortBy(relics, ["sourceLength", "source", "cost"]);
  return (
    <>
      <Stack justifyContent="center" alignItems="center" direction="row">
        <Typography sx={{ my: 2, mr: 2 }} variant="h6">
          {"Legends"}
        </Typography>
        <hr style={{ height: "1px", flex: 1 }} />
      </Stack>
      {sortedRelics.map((relic, index) => {
        return (
          <Box sx={{ mb: 2 }} style={{ breakInside: "avoid" }} key={index}>
            <RelicCard faction={faction} relic={relic} data={data} />
          </Box>
        );
      })}
    </>
  );
};
