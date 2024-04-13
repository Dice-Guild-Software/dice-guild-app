import { get } from "lodash";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { CHAPTERS } from "routes/Rules";
import { useLocalStorage } from "./use-localstorage";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

export const DataContext = React.createContext({});

const breadCrumbDefaults = {
  "": "Home",
  factions: "Factions",
  rules: "Rules",
  games: "Games",
  missions: "Missions",
  quickstart: "Rules",
  updates: "Updates",
  privacy: "Privacy Policy",
  lists: "Rosters",
  scenarios: "Scenarios",
};

export function usePageTitle(opts = {}) {
  const { path: optPath, optData } = opts;
  const [lists] = useLocalStorage("lists", {});
  // const [{ data: contextData }] = React.useContext(DataContext);
  const contextData = {};
  const data = optData ?? contextData;
  const loc = useLocation();
  const path = optPath ?? loc.pathname;
  const [locationTitle] = path.split("/").slice(-1);
  const ignoredPathes = new Set([]);
  const titles = React.useMemo(() => {
    const breadCrumbTitles = {
      ...breadCrumbDefaults,
    };
    const game = get(data, `gameData`);
    Object.keys(get(game, "factions", {})).forEach((factionId) => {
      const faction = get(
        data,
        `gameData.factions[${factionId}]`
      );
      breadCrumbTitles[factionId] = faction.name;
    });
    Object.keys(lists).forEach((listId) => {
      const list = lists[listId];
      breadCrumbTitles[listId] = list.name;
    });
    Object.keys(CHAPTERS).forEach((chapterId) => {
      breadCrumbTitles[chapterId] = CHAPTERS[chapterId]?.name;
    });
    return breadCrumbTitles;
  }, [data, lists]);
  let title = titles[locationTitle] || locationTitle;
  title = ignoredPathes.has(title) ? null : title;
  return title;
}

export * from "./use-data-fetcher";
export * from "./use-modal";
