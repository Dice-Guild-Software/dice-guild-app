import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from "@mui/material";
import { WeaponList } from "components/roster/weapon-list";
import { sortBy } from "lodash";
import React from "react";

export const Weapons = React.memo((props) => {
  const { data, faction, nameFilter } = props;
  const theme = useTheme();
  const weapons = data
    .getAllWeapons(faction)
    .filter((strategy) =>
      nameFilter
        ? (strategy.name || "").toLowerCase().includes(nameFilter.toLowerCase())
        : true
    );
  const weaponsSorted = sortBy(weapons, "name");
  return (
    <Box sx={{ mt: 2 }}>
      {!weapons.length && <p>{"No weapons found..."}</p>}
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
                  {!!rule.description && (
                    <>
                      <i>{rule.description}</i>
                      <hr />
                    </>
                  )}
                  <WeaponList
                    twoColumns={false}
                    faction={faction}
                    data={data}
                    weapons={[rule]}
                    rules={data.getAllWeaponRules([rule], faction)}
                  />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
});
