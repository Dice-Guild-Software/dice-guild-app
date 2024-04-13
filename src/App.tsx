// @ts-nocheck

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import "App.css";
import { Footer } from "components/footer";
import { MainNav } from "components/MainNav";
import { useDataFetcher, usePageTitle } from "hooks";
import { SnackbarProvider } from "notistack";
import React from "react";
import { Navigate, Route, Routes } from "react-router";
import Faction from "routes/faction";
import Factions from "routes/factions";
import Lists from "routes/Lists";
import PageNotFound from "routes/PageNotFound";
import Rosters from "routes/rosters";
import { CHAPTERS } from "routes/Rules";
import Splash from "routes/Splash";
import Updates from "routes/Updates";
import LoadingSplash from "routes/loading";
import { BASE_THEME } from "utils/constants";
import { DataContext, ModalProvider } from "./hooks";
import { MissionGenerator } from "routes/mission_generator";

const App = () => {
  const dataFetcher = useDataFetcher();
  const [{ data }] = dataFetcher;
  const themeId = "dark";
  const theme = createTheme({
    ...BASE_THEME,
    palette: {
      mode: themeId,
      primary: { main: "#6933b5" },
      secondary: { main: "#803ede" },
    },
    typography: {
      fontSize: 12,
      fontFamily: "Noto Sans JP",
      h1: {
        fontSize: "4rem",
        fontWeight: "bold",
      },
      h2: {
        fontSize: "3rem",
        fontWeight: "bold",
      },
      h3: {
        fontSize: "2.5rem",
        fontWeight: "bold",
      },
      h4: {
        fontSize: "2rem",
        fontWeight: "bold",
      },
      h5: {
        fontSize: "1.5rem",
        fontWeight: "bold",
      },
      h6: {
        fontSize: "1rem",
      },
    },
  });
  const fullScreen = useMediaQuery(theme.breakpoints.up("md"));
  const title = usePageTitle({ optData: data });
  React.useEffect(() => {
    document.title = `Dice Guild - ${title}`;
  }, [title]);
  const notistackRef = React.createRef();
  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };
  const firstChapter = Object.keys(CHAPTERS)[0] || "introduction";
  return (
    <ThemeProvider theme={theme}>
      <ModalProvider>
        <SnackbarProvider
          ref={notistackRef}
          maxSnack={3}
          action={(key) => (
            <IconButton sx={{ color: "inherit" }} onClick={onClickDismiss(key)}>
              <CloseIcon />
            </IconButton>
          )}
        >
          <DataContext.Provider value={dataFetcher}>
            <CssBaseline />
            <>
              <LoadingSplash />
              <MainNav />
              <div className="main">
                <Routes>
                  <Route path="/" element={<Splash />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route
                    path="games"
                    element={<Navigate replace to={`/`} />}
                  />
                  <Route path="/games/vortex_gate/factions" element={<Factions />} />
                  <Route path="/games/vortex_gate/factions/:factionName" element={<Faction />} />
                  <Route
                    path="lists"
                    element={<Rosters />}
                  />
                  <Route path="/lists/:listId" element={<Lists />} />
                  <Route path="/scenarios" element={<MissionGenerator />} />
                  <Route element={<PageNotFound />} />
                </Routes>
              </div>
            </>
          </DataContext.Provider>
        </SnackbarProvider>
      </ModalProvider>
    </ThemeProvider>
  );
};

export default App;
