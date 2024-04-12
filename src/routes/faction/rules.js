import { Box, Card, CardContent, CardHeader, Typography, useTheme } from "@mui/material";
import { RuleList } from "components/roster/rule-list";
import { sortBy } from "lodash";

export const Rules = (props) => {
  const { data, faction, nameFilter } = props;
  const theme = useTheme();
  const units = data.getUnits(faction);
  const weapons = data
    .getRules(units, faction)
    .filter((strategy) =>
      nameFilter
        ? strategy.name.toLowerCase().includes(nameFilter.toLowerCase())
        : true
    );
  const weaponsSorted = sortBy(weapons, "name");
  return (
    <Box sx={{ mt: 2 }}>
      {!weapons.length && <p>{"No rules found..."}</p>}
      {!!weapons.length && (
        <div>
          {weaponsSorted.map((rule, index) => (
            <div style={{ breakInside: "avoid-column" }} key={index}>
              <Card
                className="no-break"
                sx={{
                  border: `2px solid ${theme.palette.primary.main}`,
                  mb: 2,
                }}
              >
                <CardHeader
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    py: 1,
                  }}
                  title={
                    <Typography fontWeight="bold" variant="h6" component="div">
                      {rule.name}
                    </Typography>
                  }
                />
                <CardContent>
                  <RuleList faction={faction} rules={[rule]} showName={false} />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
};
