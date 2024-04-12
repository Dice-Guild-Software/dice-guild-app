import { Box, Stack, Typography } from "@mui/material";
import { StrategyCard } from "components/roster/strategy-card";
import { get, groupBy, sortBy } from "lodash";

export const Strategies = (props) => {
  const { data, faction, nameFilter } = props;
  const strategies = data
    .getStrategies(faction)
    .filter((strategy) =>
      nameFilter
        ? strategy.name.toLowerCase().includes(nameFilter.toLowerCase())
        : true
    )
    .filter((strategy) => !strategy.subfactions);
  const sortedStrategies = sortBy(strategies, [
    "sourceLength",
    "source",
    "cost",
  ]);
  return (
    <>
      <Stack justifyContent="center" alignItems="center" direction="row">
        <Typography sx={{ my: 2, mr: 2 }} variant="h6">
          {"Tactics"}
        </Typography>
        <hr style={{ height: "1px", flex: 1 }} />
      </Stack>
      {sortedStrategies.map((strategy, index) => (
        <div key={index} className="no-break">
          <Box sx={{ mb: 2 }}>
            <StrategyCard faction={faction} strategy={strategy} />
          </Box>
        </div>
      ))}
    </>
  );
};
