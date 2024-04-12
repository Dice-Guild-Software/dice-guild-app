import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddIcon from "@mui/icons-material/Add";
import BugReportIcon from "@mui/icons-material/BugReport";
import UploadIcon from "@mui/icons-material/Upload";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, Stack, Typography } from "@mui/material";
import Container from "@mui/material/Container";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import useMediaQuery from "@mui/material/useMediaQuery";
import CustomCircularProgress from "components/CustomCircularProgress";
import { Dropdown } from "components/dropdown";
import { DataContext, useModal } from "hooks";
import useQueryParams from "hooks/use-query-params";
import { get, isNil, set } from "lodash";
import { useSnackbar } from "notistack";
import React, { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DataAPI, mergeGlobalData } from "utils/data";
import { readFileContent } from "utils/files";
import { Overview } from "./overview";
import { Powers } from "./powers";
import { Relics } from "./relics";
import { Rules } from "./rules";
import { Strategies } from "./strategies";
import { Units } from "./units";
import { Weapons } from "./weapons";
import { ShowInfo } from "routes/modals";
import { PrettyHeader } from "components/pretty-header";
import { AddList } from "routes/rosters/modals";
import { v4 as uuidv4 } from "uuid";
import { useLocalStorage } from "hooks/use-localstorage";

export default React.memo((props) => {
  const { factionName, gameName } = useParams();
  const [
    { data: someData, coreData, setData, appState, setAppState, userPrefs },
  ] = useContext(DataContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const nameFilter = appState?.searchText;
  let [activeTab, setActiveTab] = useQueryParams("tab", 0);
  const [filterByFocus] = useState(false);
  const game = get(someData, `gameData`, {});
  const globalData = mergeGlobalData(game, someData);
  const data = DataAPI(game, globalData);
  const faction = data.getFaction(factionName);
  const buyLinks = get(faction, "buyLinks", []);
  const rawFaction = data.getRawFaction(factionName);
  const DEFAULT_FILTER = {
    keywords: new Set(),
    categories: new Set(),
  };
  const [unitFilter] = useState(DEFAULT_FILTER);
  const powers =
    !isNil(rawFaction.powers) && Object.keys(rawFaction.powers).length;
  const { enqueueSnackbar } = useSnackbar();
  const fileDialog = React.useRef();
  const subfactions = Object.values(faction.subfactions || []);
  const [lists, setRawLists] = useLocalStorage("lists", {});
  const navigate = useNavigate();
  const goToList = (listId) => navigate(`/lists/${listId}?factionId=${faction.id}`);
  const setLists = React.useCallback(
    (listData) => {
      const newGameData = {
        ...listData,
      };
      setRawLists(newGameData);
    },
    [setRawLists]
  );
  const handleClick = () => {
    fileDialog.current.click();
  };
  const setCustomData = (passedData) => {
    const newGameData = {
      ...coreData,
      customData: {
        ...get(someData, "customData", {}),
        ...passedData,
      },
    };
    setData(newGameData);
  };
  const uploadFaction = (event) => {
    event.preventDefault();
    const file = get(event, "target.files[0]");
    if (file) {
      readFileContent(file)
        .then((content) => {
          let armyObject = {};
          try {
            armyObject = JSON.parse(content);
          } catch (e) {
            return Promise.reject(e);
          }
          if (armyObject.factions) {
            const newData = {
              ...get(someData, `customData`),
              ...armyObject,
            };
            setCustomData(newData);
            enqueueSnackbar(`Core data successfully imported.`, {
              appearance: "success",
            });
          } else {
            // const hasArmy = nope.factions[armyObject.id];
            const factionId = faction.id;
            const newData = set(
              { ...get(someData, "customData", {}) },
              `factions[${factionId}]`,
              {
                ...get(someData, `customData.factions[${factionId}]`, {}),
                ...armyObject,
                id: faction.id,
                color: faction.color,
              }
            );
            setCustomData(newData);
            enqueueSnackbar(`${armyObject.name} successfully imported.`, {
              appearance: "success",
            });
          }
        })
        .catch((error) => {
          enqueueSnackbar(`Faction failed to import. ${error.message}`, {
            appearance: "error",
          });
        });
    }
    fileDialog.current.value = null;
  };

  const addList = (listName, data) => {
    const listId = uuidv4();
    setLists({
      ...lists,
      [listId]: {
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
        rawData={someData}
        userPrefs={userPrefs}
        hideModal={hideAddList}
        lists={lists}
        addList={addList}
        {...extraProps}
      />
    ),
    [lists]
  );
  React.useEffect(() => {
    setAppState({
      enableSearch: false,
      contextActions: [
        {
          name: "Create",
          icon: <AddIcon />,
          onClick: () => {
            showAddList({name: faction.name});
          },
        },
        ...(!!userPrefs.developerMode
          ? [
              {
                name: "Import",
                icon: <UploadIcon />,
                onClick: () => handleClick(),
              },
            ]
          : []),
        ...(!!game.reportUrl
          ? [
              {
                name: "Report",
                icon: <BugReportIcon />,
                onClick: () => window.open(game.reportUrl, "_blank"),
              },
            ]
          : []),
      ],
    });
    return () => {
      setAppState({
        contextActions: [],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrefs.developerMode]);
  //const [dialOpen, setDialOpen] = React.useState(false);
  if (
    !someData ||
    !faction ||
    !faction.name ||
    !get(someData, `gameData.factions[${factionName}].units`)
  ) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <CustomCircularProgress />
        <input
          id="file-input"
          type="file"
          name="name"
          multiple
          ref={fileDialog}
          onChange={uploadFaction}
          style={{ height: "0", overflow: "hidden", display: "none" }}
        />
      </Box>
    );
  }
  const isModified = Object.values(
    get(someData, `customData.games[${gameName}].factions[${factionName}]`, {})
  ).length;
  const hiddenTabs = new Set([]);
  if (!powers) {
    hiddenTabs.add("Powers");
  }
  if (!subfactions.length) {
    hiddenTabs.add("Focus");
  }
  if (!buyLinks.length) {
    hiddenTabs.add("Buy");
  }
  return (
    <>
      <PrettyHeader
        image={faction.image}
        text={
          <Stack>
            {`${faction.name}`}
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              onClick={() => showAddList({ name: faction.name})}
            >
              <AddIcon /> Create List
            </Button>
          </Stack>
        }
      />
      <Container>
        <Overview data={data} faction={faction} />
        <Relics data={data} faction={faction} nameFilter={nameFilter} />
        <Strategies data={data} faction={faction} nameFilter={nameFilter} />
        <Powers data={data} faction={faction} nameFilter={nameFilter} />
        <Units
          data={data}
          faction={faction}
          setData={setData}
          rawData={someData}
          userPrefs={userPrefs}
          nameFilter={nameFilter}
          unitFilter={unitFilter}
          filterByFocus={filterByFocus}
        />
        <input
          id="file-input"
          type="file"
          name="name"
          multiple
          ref={fileDialog}
          onChange={uploadFaction}
          style={{ height: "0", overflow: "hidden", display: "none" }}
        />
      </Container>
    </>
  );
});
