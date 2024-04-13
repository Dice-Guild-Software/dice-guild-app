import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Button,
  CardActionArea,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Container from "@mui/material/Container";
import { DataContext, useModal } from "hooks";
import { useLocalStorage } from "hooks/use-localstorage";
import { sortBy } from 'lodash';
import { useSnackbar } from "notistack";
import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { UserPreferences } from "./modals";
import { RosterList } from "./rosters";
import { AddList } from "./rosters/modals";

export default function Home(props) {
  const navigate = useNavigate();
  const [{ data: nope, refreshAllData: refreshData, setAppState, userPrefs, setUserPrefs }] =
    useContext(DataContext);

  const [lists, setRawLists] = useLocalStorage("lists", {});

  const { enqueueSnackbar } = useSnackbar();
  const games = [
    {
      name: "Dice Guild",
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

  const setLists = React.useCallback(
    (listData) => {
      const newGameData = {
        ...listData,
      };
      setRawLists(newGameData);
    },
    [setRawLists]
  );

  const goToList = (listId) => navigate(`/lists/${listId}`);
  const addList = (listName, data) => {
    const listId = uuidv4();
    setLists({
      ...lists,
      [listId]: {
        created: Date.now(),
        name: listName,
        ...data,
      },
    });
    goToList(listId);
  };

  const [showAddList, hideAddList] = useModal(
    ({ extraProps }) => (
      <AddList
        {...props}
        rawData={nope}
        userPrefs={userPrefs}
        hideModal={hideAddList}
        lists={lists}
        addList={addList}
        {...extraProps}
      />
    ),
    [lists]
  );

  const filteredLists = sortBy(Object.keys(lists)
  .map((listId) => {
    return {
      ...lists[listId],
      id: listId,
    };
  }), 'created').slice(0, 8);

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
            <Stack justifyContent="center" alignItems="center" direction="row">
              <Typography sx={{ my: 2, mr: 2 }} variant="h5">
                {"Recent Rosters"}
              </Typography>
              <hr style={{ height: "1px", flex: 1 }} />
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Button style={{ minHeight: '50px' }} fullWidth variant="outlined" color="secondary" onClick={() => showAddList()}>Create Roster</Button>
                <Button style={{ minHeight: '50px' }} fullWidth variant="outlined" color="secondary" onClick={() => navigate(`/lists`)}>Manage Rosters</Button>
              </Stack>
              <RosterList goToList={goToList} lists={filteredLists} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
