import {
  Button,
  CardActionArea,
  CardActions,
  CardMedia,
  Grid,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import Card from "@mui/material/Card";
import { get, groupBy, sortBy } from "lodash";
import { useNavigate } from "react-router";
import { DataAPI } from "utils/data";
import "./factions.css";

export const Factions = (props) => {
  const { game, gameName, nameFilter, deleteFaction, userPrefs } = props;
  const navigate = useNavigate();
  const data = DataAPI(game);
  const alliances = data.getRawAlliances();
  const showBeta = userPrefs.showBeta;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const factions = sortBy(
    data
      .getFactions(gameName)
      .filter((unit) =>
        nameFilter
          ? unit.name.toLowerCase().includes(nameFilter.toLowerCase())
          : true
      ),
    "name"
  ).filter((game) =>
    showBeta ? true : game.version && Number(game.version) >= 1
  );
  const unitCategories = groupBy(factions, "alliance");
  const categoryOrder = [...Object.keys(alliances), undefined].filter(
    (cat) => unitCategories[cat] && unitCategories[cat].length
  );
  const goToFaction = (faction) => navigate(`/games/vortex_gate/factions/${faction.id}`);
  if (!data) {
    return <p>{"Ohai"}</p>;
  }
  return (
    <>
      {categoryOrder.map((allianceKey, index) => {
        const factions = get(unitCategories, `[${allianceKey}]`, []);
        const allianceData = data.getAlliance(allianceKey);
        return (
          <>
            <Stack justifyContent="center" alignItems="center" direction="row">
              <Typography sx={{ my: 2, mr: 2 }} variant="h5">
                {allianceData.name || "Unaligned"}
              </Typography>
              <hr style={{ height: "1px", flex: 1 }} />
            </Stack>
            <Grid container spacing={1} columns={{ xs: 4, sm: 8, md: 12 }}>
              {factions.map((faction, index) => {
                return (
                  <Grid item xs={2} sm={4} md={4}>
                    <Card sx={{ my: 1 }}>
                      <CardActionArea onClick={() => goToFaction(faction)}>
                        {!!faction.image && (
                          <CardMedia
                            sx={{ height: isMobile ? 150 : 200 }}
                            image={faction.image}
                            title="green iguana"
                          />
                        )}
                        <ListItem key={index} sx={{ px: 1, py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="h6" align="center">
                                {faction.name}
                              </Typography>
                            }
                          />
                          {!faction.url && (
                            <CardActions>
                              <Button
                                size="small"
                                color="primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteFaction(game.id);
                                }}
                              >
                                Delete
                              </Button>
                            </CardActions>
                          )}
                        </ListItem>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        );
      })}
    </>
  );
};
