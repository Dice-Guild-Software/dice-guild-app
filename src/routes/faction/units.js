import {
  Card,
  CardActionArea,
  Chip,
  Grid,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import { useModal } from "hooks";
import { findIndex, get, groupBy, intersection, sortBy, uniq } from "lodash";
import React from "react";
import { ViewUnit } from "routes/Lists/modals";
import "./roster.css";

export const Units = React.memo((props) => {
  const {
    data,
    faction,
    nameFilter,
    unitFilter,
  } = props;
  const categories = {
    ...data.getRawCategories(),
  };
  const unitsUn = data.getUnits(faction);
  const unitsFiltered = unitsUn
    .filter((unit) =>
      nameFilter
        ? get(unit, "name", "").toLowerCase().includes(nameFilter.toLowerCase())
        : true
    )
    .filter((unit) => {
      return unitFilter.keywords && unitFilter.keywords.size
        ? intersection(Array.from(unitFilter.keywords), unit.keywords || [])
            .length === unitFilter.keywords.size
        : true;
    })
    .filter((unit) => {
      return unitFilter.categories && unitFilter.categories.size
        ? unitFilter.categories.has(unit.category)
        : true;
    });
  const sortOrder = ["pinned_units", ...Object.keys(categories)];
  const unitsSorted = sortBy(unitsFiltered, (unit) =>
    data.getUnitPoints(unit, faction)
  );
  const units = unitsSorted.sort((first, second) => {
    const firstIndex = findIndex(sortOrder, (o) => o === first.category);
    const secondIndex = findIndex(sortOrder, (o) => o === second.category);
    return firstIndex - secondIndex;
  });
  const unitCategories = { pinned_units: [], ...groupBy(units, "category") };
  const categoryOrder = [
    ...Object.keys(categories),
    undefined,
  ].filter(
    (cat) =>
      unitCategories[cat]
  );
  const [showViewUnit, hideViewUnit] = useModal(
    ({ extraProps }) => (
      <ViewUnit
        hideModal={hideViewUnit}
        data={data}
        showOptions
        {...extraProps}
      />
    ),
    []
  );
  return (
    <div>
      {!units.length && <p>{"No units found..."}</p>}
      {categoryOrder.map((category, catIndex) => {
        const categoryUnits = get(unitCategories, `[${category}]`, []);
        const categoryData = data.getCategory(category);
        return (
          <div key={catIndex}>
            <Stack justifyContent="center" alignItems="center" direction="row">
              <Typography sx={{ my: 2, mr: 2 }} variant="h6">
                {`${categoryData.name} Units` || "Misc Units"}
              </Typography>
              <hr style={{ height: "1px", flex: 1 }} />
            </Stack>
            <Grid container spacing={1}>
              {categoryUnits.map((unit, index) => {
                const unitPoints = data.getUnitPoints(unit, faction);
                const unitSubfactions = uniq(
                  get(unit, "subfactions", [])
                    .map((subfactionId) =>
                      data.getSubfaction(faction.id, subfactionId)
                    )
                    .map((subfac) => `${subfac.name || "No"} Focus`)
                );
                return (
                  <Grid item xs={12} sm={6} md={6}>
                    <Card>
                      <CardActionArea
                        onClick={() =>
                          showViewUnit({
                            unit,
                            faction: faction,
                          })
                        }
                      >
                        <ListItem key={index} sx={{ px: 1, py: 1 }}>
                          <Stack>
                            <ListItemText
                              sx={{ mt: 0 }}
                              primary={
                                <Typography variant="h6">
                                  {unit.name} {`(${unitPoints}pts)`}
                                </Typography>
                              }
                              secondary={unit?.description}
                            />
                            <Stack direction="row">
                              {[
                                faction.name,
                                ...unitSubfactions,
                                ...(unit.keywords || ["Infantry"]),
                              ].map((keyword) => (
                                <Chip
                                  size="small"
                                  sx={{ mr: 1 }}
                                  label={keyword}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        </ListItem>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </div>
        );
      })}
    </div>
  );
});
