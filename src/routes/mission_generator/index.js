import {
  CardHeader,
  Container,
  Divider,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { useLocalStorage } from "hooks/use-localstorage";
import ReactMarkdown from "react-markdown";
import { getRandomItem, getRandomItems } from "utils/math";
import React from "react";
import { DataContext } from "hooks";
import { DataAPI, mergeGlobalData } from "utils/data";
import { PrettyHeader } from "components/pretty-header";
import RefreshIcon from "@mui/icons-material/Refresh";

export function MissionGenerator() {
  const [{ data: nope, appState, setAppState }] = React.useContext(DataContext);
  const nameFilter = appState?.searchText;
  const globalData = mergeGlobalData({ gameType: "battle" }, nope);
  const data = DataAPI({}, globalData);
  React.useEffect(() => {
    setAppState({
      enableSearch: false,
      contextActions: [
        {
          name: "Refresh",
          icon: <RefreshIcon />,
          onClick: () => {
            generateNewMission();
          },
        },
      ],
    });
    return () => {
      setAppState({
        contextActions: [],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const theme = useTheme();
  const missions = data
    .getMissionScenarios()
    .filter((mission) =>
      nameFilter
        ? mission.name.toLowerCase().includes(nameFilter.toLowerCase())
        : true
    );
  const weathers = data.getMissionWeather();
  const secondaries = data.getMissionSecondaries();
  const [randomMission, setRandomMission] = useLocalStorage(
    "mission_generator_randomMission",
    getRandomItem(missions)
  );
  const [randomWeather, setRandomWeather] = useLocalStorage(
    "mission_generator_randomWeather",
    getRandomItem(weathers)
  );
  const [randomSecondary, setRandomSecondary] = useLocalStorage(
    "mission_generator_randomSecondary",
    getRandomItems(secondaries, 3)
  );
  const primaries = data.getMissionPrimaries();
  const [randomPrimary, setRandomPrimary] = useLocalStorage(
    "mission_generator_randomPrimary",
    getRandomItem(primaries)
  );
  const generateNewMission = () => {
    setRandomMission(getRandomItem(missions));
    setRandomPrimary(getRandomItem(primaries));
    setRandomWeather(getRandomItem(weathers));
    setRandomSecondary(getRandomItems(secondaries, 3));
  };
  return (
    <>
      <PrettyHeader text="Scenarios" />
      <Container sx={{ mt: 2 }}>
        {!randomMission && (
          <>
            <div
              className="rule-card unit-card"
              style={{
                marginBottom: "15px",
                borderColor: theme.palette.primary.main,
              }}
            >
              <div
                className="unit-card-title"
                style={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.getContrastText(
                    theme.palette.primary.main
                  ),
                }}
              >
                <h5>None Found</h5>
              </div>
              <div className="unit-card-body">
                No missions found. Try rengerating...
              </div>
            </div>
          </>
        )}
        {!!randomMission && (
          <>
            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              <Grid item sx={{ mb: 2 }} md={6}>
                <Card
                  style={{ height: "100%" }}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <CardHeader
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.getContrastText(
                        theme.palette.primary.main
                      ),
                      p: 1,
                    }}
                    title={
                      <Typography
                        variant="h5"
                        component="div"
                        align="center"
                        fontSize="24px"
                      >
                        Battle Map
                      </Typography>
                    }
                  />
                  <CardContent>
                    <CardMedia
                      component="img"
                      image={randomMission.map}
                      alt={randomMission.name}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ mb: 2 }} md={6}>
                <Card
                  style={{ height: "100%" }}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <CardHeader
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.getContrastText(
                        theme.palette.primary.main
                      ),
                      p: 1,
                    }}
                    title={
                      <Typography
                        variant="h5"
                        component="div"
                        align="center"
                        fontSize="24px"
                      >
                        Primary Objective
                      </Typography>
                    }
                  />
                  <CardContent>
                    <div className="width-100">
                      <Typography variant="h5" component="div" gutterBottom>
                        {randomPrimary.name}
                      </Typography>
                      <div style={{ marginBottom: "0.5em" }}>
                        <ReactMarkdown
                          className="rule-text font-italic"
                          style={{ breakInside: "avoid-column" }}
                          children={randomPrimary.description}
                        />
                      </div>
                      <ReactMarkdown
                        className="rule-text"
                        style={{ breakInside: "avoid-column" }}
                        children={randomPrimary.rules}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ mb: 2 }} md={6}>
                <Card
                  style={{ height: "100%" }}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <CardHeader
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.getContrastText(
                        theme.palette.primary.main
                      ),
                      p: 1,
                    }}
                    title={
                      <Typography
                        variant="h5"
                        component="div"
                        align="center"
                        fontSize="24px"
                      >
                        Secondary Objectives
                      </Typography>
                    }
                  />
                  <CardContent>
                    {randomSecondary.map((secondary) => (
                      <div className="width-100">
                        <Typography variant="h5" component="div" gutterBottom>
                          {secondary.name}
                        </Typography>
                        <div style={{ marginBottom: "0.5em" }}>
                          <ReactMarkdown
                            className="rule-text font-italic"
                            style={{ breakInside: "avoid-column" }}
                            children={secondary.description}
                          />
                        </div>
                        <ReactMarkdown
                          className="rule-text"
                          style={{ breakInside: "avoid-column" }}
                          children={secondary.rules}
                        />
                        <Divider />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ mb: 2 }} md={6}>
                <Card
                  style={{ height: "100%" }}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <CardHeader
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.getContrastText(
                        theme.palette.primary.main
                      ),
                      p: 1,
                    }}
                    title={
                      <Typography
                        variant="h5"
                        component="div"
                        align="center"
                        fontSize="24px"
                      >
                        Twist
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Typography variant="h5" component="div" gutterBottom>
                      {randomWeather.name}
                    </Typography>
                    <div style={{ marginBottom: "0.5em" }}>
                      <ReactMarkdown
                        className="rule-text font-italic"
                        style={{ breakInside: "avoid-column" }}
                        children={randomWeather.description}
                      />
                    </div>
                    <ReactMarkdown
                      className="rule-text"
                      style={{ breakInside: "avoid-column" }}
                      children={randomWeather.rules}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
}
