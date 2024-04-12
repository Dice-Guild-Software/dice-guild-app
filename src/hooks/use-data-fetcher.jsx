import { get, isObject, merge } from "lodash";
import { mergeWith } from "lodash/fp";
import React, { useEffect, useState } from "react";

export const useDataFetcher = (myUrl) => {
  const localData = JSON.parse(localStorage.getItem("data") || "{}");
  const localPrefs = JSON.parse(localStorage.getItem("userPrefs") || "{}");
  const [data, setData] = useState(localData);
  const [userPrefs, setUserPrefs] = useState(localPrefs);
  const [appState, setAppState] = useState({});
  const [url, setUrl] = useState(
    myUrl ||
      "/data/"
  );
  // Directly overwrite faction related stuff
  const overwrite = new Set([
    "powerCategories",
    "weather",
    "secondaries",
    "missions",
    "buyLinks",
    "units",
    "powers",
    "terrain",
    "strategies",
    "weapons",
    "rules",
    "perks",
    "models",
    "subfactions",
    "setbacks",
    "relics",
    "categories",
    "organizations",
    "alliances",
  ]);

  const updateUserPrefs = (myData) => {
    const newData = {
      ...userPrefs,
      ...myData,
    };
    localStorage.setItem("userPrefs", JSON.stringify(newData));
    setUserPrefs(newData);
  };

  const updateData = (myData) => {
    localStorage.setItem("data", JSON.stringify(myData));
    setData(myData);
  };

  // const fetchTextData = async (someUrl) => {
  //   setIsError(false);
  //   setIsLoading(true);
  //   try {
  //     const result = await fetch(someUrl);
  //     const resultData = await result.text();
  //     setIsLoading(false);
  //     return resultData;
  //   } catch (error) {
  //     setIsError(true);
  //     setIsLoading(false);
  //     return Promise.reject(error);
  //   }
  // };

  const fetchData = async (someUrl) => {
    try {
      const result = await fetch(someUrl);
      const resultData = await result.json();
      return resultData;
    } catch (error) {
      return `${someUrl}: ${error}`;
    }
  };

  const updateGameData = (gameName, updatedData) => {};

  const fetchFaction = (gameName, factionName) => {};

  const fetchGame = (gameid) => {};

  const fetchCoreData = React.useCallback(async () => {
    return fetchData(`${url}index.json`)
      .then((resultData) => {
        return resultData;
      })
      .catch((e) => {});
  }, [url]);

  const fetchAllFactions = async (coreData) => {
    const factionPromises = Object.values(coreData?.factions).map((faction) => {
      return fetchData(`${url}/factions/${faction?.url}`)
        .then((resultData) => {
          return { [faction?.id]: resultData };
        })
        .catch((e) => {});
    });
    const data = await Promise.allSettled(factionPromises);
    let factionBlob = {};
    data?.forEach((faction) => {
      const factionData = isObject(faction?.value) ? faction?.value : {};
      factionBlob = {
        ...factionBlob,
        ...factionData,
      };
    });
    return factionBlob;
  };

  const fetchAllData = React.useCallback(async () => {
    const coreData = await fetchCoreData();
    const factionData = await fetchAllFactions(coreData);
    const allData = {
      lastFetch: Date.now(),
      gameData: {
        ...get(data, "gameData", {}),
        ...coreData,
        factions: merge(coreData?.factions, factionData),
      },
      customData: {},
    };
    updateData(allData);
    return allData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasGameData = !Object.keys(get(data, `gameData`, {})).length;
    const MAX_CACHE_AGE = 2 * 60 * 60 * 1000; // 2 hours
    if (hasGameData || Date.now() - get(data, `lastFetch`, 0) > MAX_CACHE_AGE) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAllData, url]);

  const refreshData = (gameid) => {};

  const deep = mergeWith(
    (objValue, srcValue, key, object, source, stack) => {
      if (overwrite.has(key)) {
        return srcValue;
      }
    },
    get(data, "gameData", {}),
    get(data, "customData", {})
  );
  const mergedData = {
    ...data,
    gameData: deep,
  };
  return [
    {
      data: mergedData,
      coreData: data,
      setUrl,
      fetchFaction,
      fetchGame,
      setData: updateData,
      updateGameData,
      refreshData,
      refreshAllData: fetchAllData,
      appState,
      setAppState,
      userPrefs,
      setUserPrefs: updateUserPrefs,
    },
  ];
};
