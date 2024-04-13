import BugReportIcon from "@mui/icons-material/BugReport";
import UploadIcon from "@mui/icons-material/Upload";
import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import CustomCircularProgress from "components/CustomCircularProgress";
import { DataContext } from "hooks";
import { get, omitBy } from "lodash";
import { set } from "lodash/fp";
import { useSnackbar } from "notistack";
import React, { useContext } from "react";
import { useParams } from "react-router";
import { DataAPI, mergeGlobalData } from "utils/data";
import { readFileContent } from "utils/files";
import { Factions } from "./factions";

const FactionsMain = () => {
  const { gameName } = useParams();
  const [
    {
      data: nope,
      coreData,
      fetchGame,
      setData,
      isLoading,
      appState,
      setAppState,
      userPrefs,
    },
  ] = useContext(DataContext);
  const nameFilter = appState?.searchText;

  const fileDialog = React.useRef();
  // const navigate = useNavigate();
  const handleClick = () => {
    fileDialog.current.click();
  };
  const game = get(nope, `gameData`, {});
  const coreGame = get(coreData, `gameData`, {});
  React.useEffect(() => {
    if (!game.factions || (!coreGame.factions && !isLoading)) {
      fetchGame(gameName);
    }
  }, [
    coreData,
    coreGame.factions,
    fetchGame,
    game.factions,
    gameName,
    isLoading,
  ]);
  const globalData = mergeGlobalData(game, nope);
  const data = DataAPI(game, globalData);
  const { enqueueSnackbar } = useSnackbar();
  const uploadFile = (event) => {
    uploadFaction(event);
  };
  const uploadFaction = (event) => {
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
            const newData = { ...get(nope, `customData`), ...armyObject };
            setCustomData(newData);
            enqueueSnackbar(`Core data successfully imported.`, {
              appearance: "success",
            });
          } else if (armyObject.id) {
            const newData = set(
              `factions[${armyObject.id}]`,
              {
                ...get(`factions[${armyObject.id}]`, {}),
                ...armyObject,
              },
              get(nope, "customData", {})
            );
            setCustomData(newData);
            enqueueSnackbar(`${armyObject.name} successfully imported.`, {
              appearance: "success",
            });
          } else {
            enqueueSnackbar(`Faction failed to find data to import.`, {
              appearance: "error",
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
  const deleteFaction = (factionId) => {
    const newFactionList = omitBy(
      get(nope, `customData.games[${gameName}].factions`, {}),
      (faction) => faction.id === factionId
    );
    const armyData = {
      ...get(nope, "customData", {}),
      games: {
        ...get(nope, "customData.games", {}),
        [gameName]: {
          ...get(nope, `customData.games[${gameName}]`, {}),
          factions: newFactionList,
        },
      },
    };
    enqueueSnackbar(
      `${data.getFaction(factionId).name} successfully deleted.`,
      {
        appearance: "success",
      }
    );
    setCustomData(armyData);
  };
  const setCustomData = (passedData) => {
    const newGameData = {
      ...coreData,
      customData: {
        ...get(nope, "customData", {}),
        ...passedData,
      },
    };
    setData(newGameData);
  };
  React.useEffect(() => {
    setAppState({
      enableSearch: false,
      contextActions: [
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
  // const [dialOpen, setDialOpen] = React.useState(false);
  if (!data) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <CustomCircularProgress />
        <input
          id="file-Form.Control"
          type="file"
          name="name"
          multiple
          ref={fileDialog}
          onChange={uploadFile}
          style={{ height: "0px", overflow: "hidden" }}
        />
      </Box>
    );
  }
  return (
    <>
      <Container>
        <Factions
          data={data}
          game={game}
          gameName={gameName}
          setData={setData}
          rawData={nope}
          userPrefs={userPrefs}
          deleteFaction={deleteFaction}
          nameFilter={nameFilter}
        />
        <input
          id="file-Form.Control"
          type="file"
          name="name"
          multiple
          ref={fileDialog}
          onChange={uploadFile}
          style={{ height: "0px", overflow: "hidden" }}
        />
      </Container>
    </>
  );
};

export default FactionsMain;
