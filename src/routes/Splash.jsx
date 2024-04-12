import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  CardActionArea,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Container from "@mui/material/Container";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useNavigate } from "react-router";
import library from "assets/library.png";
import { DataContext, useModal } from "hooks";
import { useContext } from "react";
import { useSnackbar } from "notistack";
import Rosters from "routes/rosters";
import { UserPreferences } from "./modals";

export default function Home(props) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [{ refreshAllData: refreshData, setAppState, userPrefs, setUserPrefs }] =
    useContext(DataContext);
  const { enqueueSnackbar } = useSnackbar();
  const games = [
    {
      name: "Dice Guild",
      background: library,
      image: "/data/vortex_gate.png",
    },
  ];

  const goToFaction = (faction) => navigate(`/games/vortex_gate/factions`);

  const refreshFactions = () => {
    refreshData()
      .then(() => {
        enqueueSnackbar(`Game data successfully updated.`, {
          appearance: "success",
        });
      })
      .catch((error) => {
        enqueueSnackbar(`Game data failed to refresh. ${error.message}`, {
          appearance: "error",
        });
      });
  };

  const [showUserPreferences, hideUserPreferences] = useModal(
    ({ extraProps }) => (
      <UserPreferences
        {...props}
        hideModal={hideUserPreferences}
        setUserPrefs={setUserPrefs}
        userPrefs={userPrefs}
        {...extraProps}
      />
    ),
    [userPrefs]
  );

  React.useEffect(() => {
    setAppState({
      enableSearch: false,
      contextActions: [
        {
          name: "Refresh",
          icon: <RefreshIcon />,
          onClick: () => {
            refreshFactions();
          },
        },
        {
          id: "settings",
          name: "Settings",
          icon: <SettingsIcon />,
          onClick: () => {
            showUserPreferences();
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

  return (
    <>
      <Container>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack justifyContent="center" alignItems="center" direction="row">
              <Typography sx={{ my: 2, mr: 2 }} variant="h5">
                {"Game Systems"}
              </Typography>
              <hr style={{ height: "1px", flex: 1 }} />
            </Stack>
            <Grid container spacing={2}>
              {games.map((faction, index) => {
                return (
                  <Grid item xs={6} sm={6} md={6}>
                    <CardActionArea
                      sx={{ p: 0, m: 0 }}
                      onClick={() => goToFaction(faction)}
                    >
                      {!!faction.image && (
                        <img
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: 0,
                            margin: 0,
                          }}
                          src={faction.image}
                          alt={faction.name}
                        />
                      )}
                    </CardActionArea>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6} sx={{ mb: 2 }}>
            <Rosters />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
