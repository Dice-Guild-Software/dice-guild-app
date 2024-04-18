import { Box, Stack, Typography } from "@mui/material";
import { PowerCard } from "components/roster/power-card";
import { sortBy } from "lodash";

export const Powers = (props) => {
  const { data, faction, nameFilter } = props;
  const strategies = data
    .getPowers(faction)
    .filter((power) =>
      nameFilter
        ? power.name.toLowerCase().includes(nameFilter.toLowerCase())
        : true
    ).filter((power) => !power.category);
  const sortedStrategies = sortBy(strategies, [
    "sourceLength",
    "source",
    "charge",
  ]);
  return (
    <>
      <Stack justifyContent="center" alignItems="center" direction="row">
        <Typography sx={{ my: 2, mr: 2 }} variant="h6">
          {"Powers"}
        </Typography>
        <hr style={{ height: "1px", flex: 1 }} />
      </Stack>
      {sortedStrategies.map((power, index) => (
        <div key={index} className="no-break">
          <Box sx={{ mb: 2 }}>
            <PowerCard faction={faction} power={power} />
          </Box>
        </div>
      ))}
    </>
  );
};
