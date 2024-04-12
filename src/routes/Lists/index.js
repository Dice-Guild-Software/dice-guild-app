import { Add as AddIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BadgeIcon from "@mui/icons-material/Badge";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import ErrorIcon from '@mui/icons-material/Error';
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import PrintIcon from "@mui/icons-material/Print";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  ScopedCssBaseline,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { InputNumber } from "components/bootstrap";
import CustomCircularProgress from "components/CustomCircularProgress";
import { Dropdown } from "components/dropdown";
import { PrintView } from "components/print";
import { DataContext, useModal } from "hooks";
import { useLocalStorage } from "hooks/use-localstorage";
import {
  every,
  find,
  get,
  isEqual,
  isNil,
  sum,
  toNumber,
  uniqBy,
} from "lodash";
import { useSnackbar } from "notistack";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Link as RouterLink } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { UpdateList } from "routes/factions/modals";
import styled from "styled-components";
import { BASE_THEME } from "utils/constants";
import { DataAPI, mergeGlobalData } from "utils/data";
import { downloadFile, readFileContent } from "utils/files";
import { formatLevel } from "utils/format";
import { insert } from "utils/misc";
import {
  AddForce,
  AddLegend,
  AddUnit,
  ChooseSubFaction,
  EditUnit,
  EditUnitCampaign,
  RenameUnit,
  ViewErrors,
  ViewLegend,
  ViewPowers,
  ViewStrategies,
  ViewUnit,
} from "./modals";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { PrettyHeader } from "components/pretty-header";

const PrintStyles = styled.div``;

const pageStyle = `
`;

export default React.memo((props) => {
  const { listId } = useParams();
  const [{ data: someData, userPrefs, setAppState }] = useContext(DataContext);
  const [lists, setRawLists] = useLocalStorage("lists", {});
  const list = get(lists, `[${listId}]`, {});
  const gameName = get(list, "gameId");
  const game = get(someData, `gameData`, {});
  const isSkirmish = false;
  const globalData = mergeGlobalData(game, someData);
  const data = DataAPI(game, globalData);
  const fileDialog = React.useRef();
  const orgs = data.getRawOrganizations();
  const { enqueueSnackbar } = useSnackbar();
  const shouldStartEditMode = !get(list, "forces", []).length;
  const [editMode, setEditMode] = useState(shouldStartEditMode);
  const [showReserves, setShowReserves] = useState({});
  const theme = useTheme();
  const componentRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const factionId = queryParams?.get("factionId");
  const doPrint = useReactToPrint({
    pageStyle: pageStyle,
    content: () => componentRef.current,
  });
  const handlePrint = () => {
    doPrint();
  };
  const LIST_TYPES = [
    { label: "Competitive", value: "competitive" },
    { label: "Narrative", value: "narrative" },
    { label: "Campaign", value: "campaign" },
  ];
  const [victoryPoints, setVictoryPoints] = useLocalStorage("victoryPoints", 0);
  const [strategyPoints, setStrategyPoints] = useLocalStorage(
    "strategyPoints",
    0
  );
  const [collapseTrackers, setCollapseTracker] = useLocalStorage(
    "collapseTracker",
    false
  );
  const calculateUnitPoints = React.useCallback(
    (
      unit,
      faction,
      options,
      selectedOptions,
      selectedPerks,
      selectedSetbacks
    ) => {
      let cost = data.getUnitPoints(unit, faction);
      let unitModels = sum(
        get(unit, "models", []).map((model) => toNumber(get(model, "min", 0)))
      );
      // First scan for any new models in the unit
      options.forEach((option, idx) => {
        option.list.forEach((item, itemIdx) => {
          const selected = toNumber(
            get(selectedOptions, `[${idx}][${itemIdx}]`, 0)
          );
          if (item.models && selected) {
            unitModels += selected;
          }
        });
      });
      options.forEach((option, idx) => {
        option.list.forEach((item, itemIdx) => {
          const selected = get(selectedOptions, `[${idx}][${itemIdx}]`);
          if (item.all && selected) {
            cost += item.points * unitModels;
          } else if (selected) {
            cost += item.points * selected;
          }
        });
      });
      selectedPerks.forEach((perk) => {
        cost += data.resolvePoints(
          get(data.getPerk(faction, perk), "points", 0),
          { unit }
        );
      });
      selectedSetbacks.forEach((setback) => {
        cost += data.resolvePoints(
          get(data.getSetback(faction, setback), "points", 0),
          { unit }
        );
      });
      return cost;
    },
    [data]
  );
  const mapForces = React.useCallback(
    (force, forceId) => {
      const forceFaction = data.getFactionWithSubfaction(
        force.factionId,
        force.subFactionId || "none"
      );
      if (!get(forceFaction, "units")) {
        return force;
      }
      const forceReserves = get(list, `reserves[${force.factionId}]`, []);
      const availablePerks = new Set(
        data.getPerks(forceFaction).map((perk) => perk.id)
      );
      const availableSetbacks = new Set(
        data.getSetbacks(forceFaction).map((setback) => setback.id)
      );
      const forceUnits = get(force, "units", []);
      const processUnits = (daUnits) => {
        return daUnits
          .filter((theUnit) => !!data.getUnit(forceFaction, theUnit.id))
          .map((theUnit, unitId) => {
            const unitKey = theUnit.id;
            const unit = data.getUnit(forceFaction, unitKey);
            const selectedOptions = get(theUnit, `selectedOptions`, []);
            // Get raw option list
            let optionList = data.getOptionsList(unit, forceFaction);
            const modelCounts = {};
            get(unit, "models", []).forEach((model, index) => {
              const count = model.min || 0;
              if (!isNil(modelCounts[index])) {
                modelCounts[index] += count;
              } else {
                modelCounts[index] = count;
              }
            });
            optionList.forEach((option, idx) => {
              option.list.forEach((optItem, optIdx) => {
                const selections = get(
                  selectedOptions,
                  `[${idx}][${optIdx}]`,
                  0
                );
                const optModels = get(optItem, "modelIds", [])
                  .flat()
                  .map((model) => model.id || model);
                optModels.forEach((model) => {
                  if (!isNil(modelCounts[model])) {
                    modelCounts[model] += selections;
                  } else {
                    modelCounts[model] = selections;
                  }
                });
              });
            });
            const oldModelCounts = { ...modelCounts };
            optionList.forEach((option, idx) => {
              option.list.forEach((optItem, optIdx) => {
                const selections = get(
                  selectedOptions,
                  `[${idx}][${optIdx}]`,
                  0
                );
                const optReplacedModels = get(optItem, "replacedModel", [])
                  .flat()
                  .map((model) => model.id || model);
                optReplacedModels.forEach((model) => {
                  if (!isNil(modelCounts[model])) {
                    modelCounts[model] -= selections;
                  } else {
                    modelCounts[model] = -selections;
                  }
                });
              });
            });
            // Adjust for model counts
            optionList = data.getOptionsList(unit, forceFaction, {
              selectedModels: modelCounts,
              selectedModelsRaw: oldModelCounts,
            });
            const selectedModels = uniqBy(
              [
                ...optionList.map((option, idx) => {
                  return [
                    ...option.list
                      .filter((optItem, optIdx) => {
                        const selections = get(
                          selectedOptions,
                          `[${idx}][${optIdx}]`,
                          0
                        );
                        return selections > 0;
                      })
                      .map((opt) => get(opt, "model", []).flat())
                      .flat(),
                  ];
                }, []),
              ].flat(),
              (item) => item.id || item
            );
            const unitModels = [
              ...get(unit, "models", []),
              ...data.getModelList(selectedModels, forceFaction),
            ];
            const selectedPerks = get(theUnit, "selectedPerks", []).filter(
              (perk) => availablePerks.has(perk)
            );
            const selectedSetbacks = get(
              theUnit,
              "selectedSetbacks",
              []
            ).filter((setback) => availableSetbacks.has(setback));
            const thing = {
              ...unit,
              customName: theUnit.customName,
              experience: theUnit.experience,
              modelCounts,
              selectedOptionsList: optionList
                .map((option, idx) => {
                  return {
                    ...option,
                    list: option.list
                      .map((optItem, optIdx) => {
                        const selections = get(
                          selectedOptions,
                          `[${idx}][${optIdx}]`,
                          0
                        );
                        return {
                          ...optItem,
                          text:
                            optItem.text +
                            ` (${selections} ${selections > 1 ? "selections" : "selection"
                            })`,
                        };
                      })
                      .filter((optItem, optIdx) => {
                        const selections = get(
                          selectedOptions,
                          `[${idx}][${optIdx}]`,
                          0
                        );
                        return selections > 0;
                      }),
                  };
                })
                .filter((option) => option.list.length),
              selectedModels,
              selectedWeapons: uniqBy(
                [
                  ...unitModels
                    .map((model) => get(model, "weapons", []))
                    .flat(),
                  ...optionList.map((option, idx) => {
                    return [
                      ...option.list
                        .filter((optItem, optIdx) => {
                          const selections = get(
                            selectedOptions,
                            `[${idx}][${optIdx}]`,
                            0
                          );
                          return selections > 0;
                        })
                        .map((opt) => get(opt, "weapons", []).flat())
                        .flat(),
                    ];
                  }, []),
                ].flat(),
                (item) => item.id || item
              ),
              selectedRules: uniqBy(
                [
                  ...get(unit, "rules", []),
                  ...unitModels.map((model) => get(model, "rules", [])).flat(),
                  ...optionList.map((option, idx) => {
                    return [
                      ...option.list
                        .filter((optItem, optIdx) => {
                          const selections = get(
                            selectedOptions,
                            `[${idx}][${optIdx}]`,
                            0
                          );
                          return selections > 0;
                        })
                        .map((opt) => get(opt, "rules", []).flat())
                        .flat(),
                    ];
                  }, []),
                ].flat(),
                (item) => item.id || item
              ),
              id: unitId,
              optionList,
              selectedPerks,
              selectedSetbacks,
              totalModels: sum(Object.values(modelCounts)),
              selectedOptions: optionList.map((option, idx) => {
                if (option.list) {
                  const indValue = get(selectedOptions, `[${idx}]`, []);
                  return option.list.map((opt, optIdx) =>
                    !isNil(indValue[optIdx]) ? indValue[optIdx] : 0
                  );
                }
                return !isNil(selectedOptions[idx]) ? selectedOptions[idx] : [];
              }),
              powerSpecialty: theUnit?.powerSpecialty,
            };
            thing.points = calculateUnitPoints(
              thing,
              forceFaction,
              optionList,
              selectedOptions,
              selectedPerks,
              selectedSetbacks
            );
            return thing;
          });
      };
      return {
        ...force,
        ...get(orgs, `[${force.id}]`, {}),
        faction: forceFaction,
        legends: get(force, "legends", []).map((theLegend, relicId) => {
          const legendKey = theLegend.id;
          const relic = data.getRelic(forceFaction, legendKey);
          return {
            ...relic,
            id: relicId,
            points: data.getRelicCost(relic, forceFaction),
          };
        }),
        units: processUnits(forceUnits),
        reserves: processUnits(forceReserves),
      };
    },
    [calculateUnitPoints, data, list, orgs]
  );
  const forces = React.useMemo(
    () =>
      get(list, "forces", [])
        .filter(
          (force) =>
            !!data.getFactionWithSubfaction(
              force.factionId,
              force.subFactionId || "none"
            )
        )
        .map(mapForces),
    [data, list, mapForces]
  );
  const [showAddForce, hideAddForce] = useModal(
    ({ extraProps }) => (
      <AddForce
        list={list}
        hideModal={hideAddForce}
        data={data}
        userPrefs={userPrefs}
        addForce={addForce}
        forces={forces}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showViewErrors, hideViewErrors] = useModal(
    ({ extraProps }) => (
      <ViewErrors
        hideModal={hideViewErrors}
        errors={validationErrors}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  useEffect(() => {
    setShowReserves({});
  }, [forces.length]);
  useEffect(() => {
    if (shouldStartEditMode) {
      showAddForce({ factionId });
      queryParams.delete("factionId");
      navigate(
        {
          search: queryParams?.toString(),
        },
        { replace: true }
      );
    }
  }, [shouldStartEditMode, showAddForce]);
  const allFactionsLoaded = every(forces, (force) => {
    const factionName = force.factionId;
    const faction = get(
      someData,
      `gameData.games[${gameName}].factions[${factionName}]`
    );
    const factionUnits = get(faction, "units");
    const factionUrl = get(faction, "url");
    return !!factionUnits || !factionUrl;
  });
  const downloadList = React.useCallback(() => {
    downloadFile(
      JSON.stringify(
        {
          ...list,
        },
        null,
        2
      ),
      "data:text/json",
      `${list.name}.json`
    );
  }, [list]);
  const uploadList = (event) => {
    event.preventDefault();
    const file = get(event, "target.files[0]");
    if (file) {
      readFileContent(file)
        .then((content) => {
          let listObject = {};
          try {
            listObject = JSON.parse(content);
          } catch (e) {
            return Promise.reject(e);
          }
          if (listObject.forces) {
            const newArmyData = {
              ...listObject,
            };
            updateList(newArmyData);
            enqueueSnackbar(`List successfully imported.`, {
              appearance: "success",
            });
          }
        })
        .catch((error) => {
          enqueueSnackbar(`List failed to import. ${error.message}`, {
            appearance: "error",
          });
        });
    }
    fileDialog.current.value = null;
  };
  const setLists = (listData) => {
    const newGameData = {
      ...lists,
      ...listData,
    };
    setRawLists(newGameData);
  };
  const updateList = (newData) => {
    setLists({
      ...lists,
      [listId]: {
        ...list,
        ...newData,
      },
    });
  };
  const renderPrintMode = () => {
    const theme = createTheme(BASE_THEME);
    return (
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline>
          <PrintView list={list} data={data} forces={forces} />
        </ScopedCssBaseline>
      </ThemeProvider>
    );
  };
  const updateForce = (forceId, newData) => {
    const mappedForces = get(list, "forces", []).map((force, index) =>
      index === forceId ? { ...force, ...newData } : force
    );
    updateList({
      forces: mappedForces,
    });
  };
  // const setFaction = (forceId, factionId) => {
  //   updateForce(forceId, {
  //     factionId,
  //   });
  // };
  const setSubFaction = (forceId, subFactionId) => {
    const factionId = get(list, `forces[${forceId}].factionId`, []);
    const forceFaction = data.getFactionWithSubfaction(
      factionId,
      subFactionId || "none"
    );
    const forceUnits = get(list, `forces[${forceId}].units`, []);
    const forceLegends = get(list, `forces[${forceId}].legends`, []);
    updateForce(forceId, {
      subFactionId,
      legends: forceLegends.filter(
        (relic) => !!data.getRelic(forceFaction, relic.id)
      ),
      units: forceUnits.filter((unit) => !!data.getUnit(forceFaction, unit.id)),
    });
  };
  const addLegend = (forceId, legend) => {
    let newArr = [];
    newArr = [...get(list, `forces[${forceId}].legends`, []), legend];
    updateForce(forceId, {
      legends: newArr,
    });
  };
  const addUnitToForce = (forceId, unit, index) => {
    const showingReserves = !!showReserves[forceId];
    const theForce = get(list, `forces[${forceId}]`, []);
    const factionId = get(theForce, "factionId");
    if (showingReserves) {
      let newArr = [];
      if (index) {
        newArr = insert(get(list, `reserves[${factionId}]`, []), index, unit);
      } else {
        newArr = [...get(list, `reserves[${factionId}]`, []), unit];
      }
      updateList({
        reserves: {
          ...get(list, `reserves`, []),
          [factionId]: newArr,
        },
      });
    } else {
      let newArr = [];
      if (index) {
        newArr = insert(get(list, `forces[${forceId}].units`, []), index, unit);
      } else {
        newArr = [...get(list, `forces[${forceId}].units`, []), unit];
      }
      updateForce(forceId, {
        units: newArr,
      });
    }
  };
  const updateUnit = (forceId, unitId, newData) => {
    const showingReserves = !!showReserves[forceId];
    const theForce = get(list, `forces[${forceId}]`, []);
    const factionId = get(theForce, "factionId");
    const forceReserves = get(list, `reserves[${factionId}]`, []);
    if (showingReserves) {
      updateList({
        reserves: {
          ...get(list, `reserves`, []),
          [factionId]: forceReserves.map((unit, index) =>
            index === unitId ? { ...unit, ...newData } : unit
          ),
        },
      });
    } else {
      updateForce(forceId, {
        units: get(list, `forces[${forceId}].units`, []).map((unit, index) =>
          index === unitId ? { ...unit, ...newData } : unit
        ),
      });
    }
  };
  const getUnit = (forceId, unitId) => {
    const showingReserves = !!showReserves[forceId];
    if (showingReserves) {
      return get(forces, `[${forceId}].reserves[${unitId}]`, {});
    } else {
      return get(forces, `[${forceId}].units[${unitId}]`, {});
    }
  };
  const deleteUnit = (forceId, unitId) => {
    const showingReserves = !!showReserves[forceId];
    const theForce = get(list, `forces[${forceId}]`, []);
    const factionId = get(theForce, "factionId");
    const forceReserves = get(list, `reserves[${factionId}]`, []);
    if (showingReserves) {
      updateList({
        reserves: {
          ...get(list, `reserves`, []),
          [factionId]: forceReserves.filter((unit, idx) => idx !== unitId),
        },
      });
    } else {
      updateForce(forceId, {
        units: get(list, `forces[${forceId}].units`, []).filter(
          (unit, idx) => idx !== unitId
        ),
      });
    }
  };
  const moveUnitReserves = (forceId, unitId) => {
    const theForce = get(list, `forces[${forceId}]`, []);
    const theUnit = get(list, `forces[${forceId}].units[${unitId}]`, []);
    const factionId = get(theForce, "factionId");
    const forceReserves = get(list, `reserves[${factionId}]`, []);
    updateList({
      reserves: {
        ...get(list, `reserves`, []),
        [factionId]: [...forceReserves, theUnit],
      },
      forces: get(list, "forces", []).map((force, index) =>
        index === forceId
          ? {
            ...force,
            units: get(list, `forces[${forceId}].units`, []).filter(
              (unit, idx) => idx !== unitId
            ),
          }
          : force
      ),
    });
  };
  const moveUnitForce = (forceId, unitId) => {
    const theForce = get(list, `forces[${forceId}]`, []);
    const factionId = get(theForce, "factionId");
    const theUnit = get(list, `reserves[${factionId}][${unitId}]`, []);
    const forceReserves = get(list, `reserves[${factionId}]`, []);
    updateList({
      forces: get(list, "forces", []).map((force, index) =>
        index === forceId
          ? {
            ...force,
            units: [...get(list, `forces[${forceId}].units`, []), theUnit],
          }
          : force
      ),
      reserves: {
        ...get(list, `reserves`, []),
        [factionId]: forceReserves.filter((unit, idx) => idx !== unitId),
      },
    });
  };
  const deleteLegend = (forceId, legendId) => {
    updateForce(forceId, {
      legends: get(list, `forces[${forceId}].legends`, []).filter(
        (unit, idx) => idx !== legendId
      ),
    });
  };
  const setUnitOptions = (forceId, unitId, data) => {
    updateUnit(forceId, unitId, {
      selectedOptions: data,
    });
  };
  const setUnitPowerSpecialty = (forceId, unitId, data) => {
    updateUnit(forceId, unitId, {
      powerSpecialty: data,
    });
  };
  const setUnitPerks = (forceId, unitId, data) => {
    updateUnit(forceId, unitId, {
      selectedPerks: data,
    });
  };
  const setUnitSetbacks = (forceId, unitId, data) => {
    updateUnit(forceId, unitId, {
      selectedSetbacks: data,
    });
  };
  const setUnitName = (forceId, unitId, data) => {
    updateUnit(forceId, unitId, {
      customName: data,
    });
  };
  const addForce = (force) => {
    updateList({
      forces: [...get(list, "forces", []), force],
    });
  };
  const deleteForce = (id) => {
    updateList({
      forces: get(list, "forces", []).filter((force, index) => index !== id),
    });
  };
  const [showChooseSubfaction, hideChooseSubfaction] = useModal(
    ({ extraProps }) => (
      <ChooseSubFaction
        hideModal={hideChooseSubfaction}
        data={data}
        setSubFaction={setSubFaction}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showAddUnit, hideAddUnit] = useModal(
    ({ extraProps }) => (
      <AddUnit
        hideModal={hideAddUnit}
        data={data}
        addUnit={addUnitToForce}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showAddLegend, hideAddLegend] = useModal(
    ({ extraProps }) => (
      <AddLegend
        hideModal={hideAddLegend}
        list={list}
        data={data}
        addLegend={addLegend}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showEditUnit, hideEditUnit] = useModal(
    ({ extraProps }) => (
      <EditUnit
        hideModal={hideEditUnit}
        data={data}
        list={list}
        forces={forces}
        setUnitName={setUnitName}
        setUnitPowerSpecialty={setUnitPowerSpecialty}
        setUnitOptions={setUnitOptions}
        getUnit={getUnit}
        {...extraProps}
      />
    ),
    [list, forces]
  );
  const [showRenameUnit, hideRenameUnit] = useModal(
    ({ extraProps }) => (
      <RenameUnit
        hideModal={hideRenameUnit}
        data={data}
        list={list}
        forces={forces}
        setUnitName={setUnitName}
        setUnitPowerSpecialty={setUnitPowerSpecialty}
        setUnitOptions={setUnitOptions}
        getUnit={getUnit}
        {...extraProps}
      />
    ),
    [list, forces]
  );
  const [showEditUnitCampaign, hideEditUnitCampaign] = useModal(
    ({ extraProps }) => (
      <EditUnitCampaign
        editMode={editMode}
        hideModal={hideEditUnitCampaign}
        data={data}
        list={list}
        forces={forces}
        getUnit={getUnit}
        updateUnit={updateUnit}
        setUnitPerks={setUnitPerks}
        setUnitSetbacks={setUnitSetbacks}
        {...extraProps}
      />
    ),
    [list, forces]
  );
  const [showViewUnit, hideViewUnit] = useModal(
    ({ extraProps }) => (
      <ViewUnit
        hideModal={hideViewUnit}
        data={data}
        getUnit={getUnit}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showViewLegend, hideViewLegend] = useModal(
    ({ extraProps }) => (
      <ViewLegend hideModal={hideViewLegend} data={data} {...extraProps} />
    ),
    [forces, list]
  );
  const [showViewStrategies, hideViewStrategies] = useModal(
    ({ extraProps }) => (
      <ViewStrategies
        hideModal={hideViewStrategies}
        data={data}
        {...extraProps}
      />
    ),
    [forces, list]
  );
  const [showViewPowers, hideViewPowers] = useModal(
    ({ extraProps }) => (
      <ViewPowers hideModal={hideViewPowers} data={data} {...extraProps} />
    ),
    [forces, list]
  );
  const showViewActionReference = () => {
    window.open("/#/rules", "_blank");
  };
  const showScenarioBuilder = () => {
    window.open("/#/scenarios", "_blank");
  };
  const [showUpdateList, hideUpdateList] = useModal(
    ({ extraProps }) => (
      <UpdateList
        hideModal={hideUpdateList}
        lists={lists}
        listId={listId}
        data={data}
        updateList={(listId, data) => {
          updateList(data);
        }}
        {...extraProps}
      />
    ),
    [forces, lists, listId]
  );
  React.useEffect(() => {
    setAppState({
      contextActions: [
        ...(!editMode
          ? [
            {
              name: "Edit",
              icon: <EditIcon />,
              onClick: () => setEditMode(true),
            },
          ]
          : []),
        ...(!!editMode
          ? [
            {
              name: "View",
              icon: <VisibilityIcon />,
              onClick: () => setEditMode(false),
            },
          ]
          : []),
        ...(!!editMode
          ? [
            {
              name: "Add",
              icon: <AddIcon />,
              onClick: () => showAddForce(),
            },
          ]
          : []),
        {
          name: "Errors",
          icon: <Badge badgeContent={validationErrors.length} color="error">
            <ErrorIcon />
          </Badge>,
          onClick: () => showViewErrors(),
        },
        {
          name: "Download",
          icon: <DownloadIcon />,
          onClick: () => downloadList(),
        },
        {
          name: "Print",
          icon: <PrintIcon />,
          onClick: () => handlePrint(),
        },
        {
          name: "Settings",
          icon: <SettingsIcon />,
          onClick: () => showUpdateList(),
        },
      ],
    });
    return () => {
      setAppState({
        contextActions: [],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, downloadList]);
  if (!someData || !allFactionsLoaded) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <CustomCircularProgress />
      </Box>
    );
  }
  const listType = list.type || "competitive";
  const listTypeName =
    (find(LIST_TYPES, (myType) => myType.value === list.type) || {}).label ||
    "Competitive";
  const currentForcePoints = sum(
    forces.map((force) => {
      const unitPoints = sum(
        get(force, "units", []).map((unit) => unit.points)
      );
      const legendPoints = sum(
        get(force, "legends", []).map((legend) => legend.points)
      );
      return unitPoints + legendPoints;
    })
  );
  const totalForcePoints =
    list.pointLimit ||
    sum(
      forces.map((force) => {
        const unitPoints = sum(
          get(force, "units", []).map((unit) => unit.points)
        );
        const legendPoints = sum(
          get(force, "legends", []).map((legend) => legend.points)
        );
        return unitPoints + legendPoints;
      })
    );
  const totalForceReservePoints = sum(
    forces.map((force) => {
      const unitPoints = sum(
        get(force, "reserves", []).map((unit) => unit.points)
      );
      return unitPoints;
    })
  );
  const detachmentLimitMult = isSkirmish ? 100 : 500;
  const SPMult = isSkirmish ? 50 : 500;
  const LegendMult = isSkirmish ? 100 : 1000;
  const totalSP =
    2 +
    Math.round(totalForcePoints / SPMult) -
    sum(forces.map((force) => force.cost));
  const legendLimit = Math.max(Math.floor(totalForcePoints / LegendMult), 1);
  const validationErrors = [];
  if (listType !== "narrative") {
    const totalLegends = sum(
      forces.map((force) => {
        return get(force, "legends", []).length;
      })
    );
    if (currentForcePoints > totalForcePoints) {
      const exceedsPoints = currentForcePoints - totalForcePoints;
      validationErrors.push({
        type: "error",
        text: `List is ${exceedsPoints} too many points`,
      });
    }
    if (totalLegends > legendLimit) {
      const exceededLegends = totalLegends - legendLimit;
      validationErrors.push({
        type: "error",
        text: `List has ${exceededLegends} too many legends`,
      });
    }
    const totalForces = forces?.length;
    const forceLimit = Math.max(
      Math.floor(totalForcePoints / detachmentLimitMult),
      1
    );
    if (totalForces > forceLimit) {
      const exceededLegends = totalForces - forceLimit;
      validationErrors.push({
        type: "error",
        text: `List has ${exceededLegends} too many forces.`,
      });
    }
    const limitedUnitMap = {};
    forces.forEach((force) => {
      const forceUnits = get(force, "units", []);
      // Check for limited units here
      forceUnits.forEach((unit) => {
        if (limitedUnitMap[unit?.name]) {
          limitedUnitMap[unit?.name] = {
            ...unit,
            limitedCount: limitedUnitMap[unit?.name]?.limitedCount + 1,
          };
        } else if (!limitedUnitMap[unit?.name]) {
          limitedUnitMap[unit?.name] = {
            ...unit,
            limitedCount: 1,
          };
        }
      });
    });
    (Object.values(limitedUnitMap) || []).forEach((unit) => {
      // Max of each unit allowed
      const unitLimit = 3;
      if (unitLimit && unit?.limitedCount > unitLimit) {
        const limitDiff = unit?.limitedCount - unitLimit;
        validationErrors.push({
          type: "error",
          text: `Roster has ${limitDiff} too many ${unit?.name} units`,
        });
      }
    });
  }
  const allPowerSpecialties = [];
  forces.forEach((force) => {
    force?.units.forEach((unit) => {
      const powerSp = unit?.powerSpecialty;
      if (powerSp) {
        allPowerSpecialties.push(powerSp);
      }
    });
  });
  if (!list) {
    return (
      <Container>
        <Typography align="center">
          This list does not exist. Click{" "}
          <Link component={RouterLink} to={"/lists"}>
            here
          </Link>{" "}
          to return to the rosters screen.
        </Typography>
      </Container>
    );
  }
  return (
    <>
      <div style={{ display: "none" }}>
        <PrintStyles ref={componentRef}>{renderPrintMode()}</PrintStyles>
      </div>
      <Container sx={{ mt: 1 }}>
        <Stack
          justifyContent="center"
          alignItems="center"
          direction="row"
          sx={{ mb: 2 }}
        >
          <hr style={{ height: "1px", flex: 1 }} />
          <Typography variant="h6" sx={{ mx: 2 }}>
            {`${list.name} (${currentForcePoints}/${totalForcePoints} pts)`}
          </Typography>
          <hr style={{ height: "1px", flex: 1 }} />
        </Stack>
        {forces.map((force, index) => {
          const forceFactionId = get(force, "faction.id");
          const forceSubFactionId = get(force, "subFactionId");
          const forceFaction = data.getFactionWithSubfaction(
            forceFactionId,
            forceSubFactionId || "none"
          );
          const rawForceFaction = data.getRawFaction(forceFactionId);
          const forceSubfaction = data.getSubfaction(
            forceFactionId,
            forceSubFactionId || "none"
          );
          const textColor = "white";
          const forceCategories = Object.keys(get(force, "categories", {}));
          const showingReserves = !!showReserves[index];
          const forceUnits = showingReserves
            ? get(force, "reserves", [])
            : get(force, "units", []);
          const factionRelics = data.getRelics(forceFaction);
          const factionPowers = data.getPowers(forceFaction);
          const hasPowers =
            !isNil(rawForceFaction.powers) &&
            !isEqual(rawForceFaction.powers, {});
          const rawSubfactions = data.getFactionSubfactions(forceFactionId);
          const hasSubfactions = !!Object.keys(rawSubfactions || {}).length;
          const factionStrategies = data.getStrategies(forceFaction);
          const units = data.getUnits(forceFaction);
          const forceLegends = get(force, "legends", []);
          const listLegendSet = new Set(
            get(list, "forces", [])
              .map((force) =>
                get(force, "legends", []).map((legend) => legend.id)
              )
              .flat()
          );
          const filteredLegends =
            listType === "narrative"
              ? factionRelics
              : factionRelics.filter((legend) => !listLegendSet.has(legend.id));
          const filteredCategories = forceCategories
            .filter(
              (catKey) =>
                editMode ||
                forceUnits.filter((myUnit) => myUnit.category === catKey).length
            )
            .filter((catKey) => {
              const categoryData = data.getOrganizationCategory(force, catKey);
              return categoryData.max > 0 || listType === "narrative";
            });
          return (
            <>
              <Dropdown>
                {({ handleClose, open, handleOpen, anchorElement }) => (
                  <Card>
                    <CardHeader
                      onClick={handleOpen}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: textColor,
                        p: 0,
                      }}
                      title={
                        <ListItem
                          secondaryAction={
                            !!editMode && (
                              <IconButton sx={{ color: "inherit", mr: -1 }}>
                                <MoreVertIcon />
                              </IconButton>
                            )
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="h6">
                                {forceFaction.name}
                              </Typography>
                            }
                            secondary={`${showingReserves
                              ? "Reserves"
                              : `${force.name} Detachment`
                              }${!forceSubFactionId || forceSubFactionId === "none"
                                ? ""
                                : ` - ${forceSubfaction.name} Focus`
                              }`}
                          />
                        </ListItem>
                      }
                    />
                    {!!editMode && (
                      <Menu
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        anchorEl={anchorElement}
                        id="basic-menu"
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                          dense: false,
                          onClick: handleClose,
                          "aria-labelledby": "basic-button",
                        }}
                      >
                        {listType === "campaign" && (
                          <>
                            <MenuItem
                              onClick={() =>
                                setShowReserves({
                                  ...showReserves,
                                  [index]: !showReserves[index],
                                })
                              }
                            >
                              <ListItemIcon>
                                <GroupIcon />
                              </ListItemIcon>
                              <ListItemText>
                                {showingReserves ? "Force" : "Reserves"}
                              </ListItemText>
                            </MenuItem>
                          </>
                        )}
                        {!!editMode && hasSubfactions && index === 0 && (
                          <MenuItem
                            onClick={() =>
                              showChooseSubfaction({
                                forceId: index,
                                faction: forceFaction,
                              })
                            }
                          >
                            <ListItemIcon>
                              <EditIcon />
                            </ListItemIcon>
                            <ListItemText>Change Focus</ListItemText>
                          </MenuItem>
                        )}
                        {!!editMode && (
                          <MenuItem onClick={() => deleteForce(index)}>
                            <ListItemIcon>
                              <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText>Delete</ListItemText>
                          </MenuItem>
                        )}
                      </Menu>
                    )}
                  </Card>
                )}
              </Dropdown>
              <CardContent
                style={{
                  padding: 0,
                }}
              >
                <>
                  {(!!factionStrategies.length || !!factionPowers.length) && (
                    <ListItem key={index} disablePadding>
                      <ListSubheader
                        sx={{ flex: 1, zIndex: 0, color: "inherit" }}
                      >
                        <Typography sx={{ py: 1.5 }} fontSize="15px">
                          Abilities
                        </Typography>
                      </ListSubheader>
                    </ListItem>
                  )}
                  {!!factionStrategies.length && index === 0 && (
                    <Card sx={{ mb: 1 }}>
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          sx={{ py: 1.5 }}
                          onClick={() =>
                            showViewStrategies({
                              forceId: index,
                              faction: forceFaction,
                            })
                          }
                        >
                          <ListItemText
                            primary="View Tactics"
                            secondary="Tactics are additional army bonuses you can activate with Tactic Points (TP)."
                          />
                        </ListItemButton>
                      </ListItem>
                    </Card>
                  )}
                  {!!factionPowers.length && hasPowers && (
                    <Card>
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          sx={{ py: 1.5 }}
                          onClick={() =>
                            showViewPowers({
                              forceId: index,
                              faction: forceFaction,
                              powerSpecialties: allPowerSpecialties,
                            })
                          }
                        >
                          <ListItemText
                            primary="View Powers"
                            secondary="Powers are special abilities certain units can call upon to provide bonuses or do damage."
                          />
                        </ListItemButton>
                      </ListItem>
                    </Card>
                  )}
                  {!!factionRelics.length &&
                    !showingReserves &&
                    (!!editMode || !!forceLegends.length) && index === 0 && (
                      <>
                        <ListItem
                          key={index}
                          secondaryAction={
                            <>
                              {!!editMode && (
                                <IconButton
                                  disabled={filteredLegends?.length === 0}
                                  sx={{ mr: -1 }}
                                  onClick={() =>
                                    showAddLegend({
                                      forceId: index,
                                      faction: forceFaction,
                                    })
                                  }
                                >
                                  <AddIcon />
                                </IconButton>
                              )}
                            </>
                          }
                          disablePadding
                        >
                          <ListSubheader
                            sx={{ flex: 1, zIndex: 0, color: "inherit" }}
                          >
                            <Typography sx={{ py: 1.5 }} fontSize="15px">
                              Legends
                            </Typography>
                          </ListSubheader>
                        </ListItem>
                        {forceLegends.map((legend, unitIdx) => {
                          return (
                            <Card sx={{ mb: 1 }}>
                              <ListItem
                                key={index}
                                secondaryAction={
                                  <Dropdown>
                                    {({
                                      handleClose,
                                      open,
                                      handleOpen,
                                      anchorElement,
                                    }) => (
                                      <>
                                        <IconButton
                                          sx={{ mr: -1 }}
                                          onClick={handleOpen}
                                        >
                                          <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                          anchorOrigin={{
                                            vertical: "bottom",
                                            horizontal: "right",
                                          }}
                                          transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right",
                                          }}
                                          anchorEl={anchorElement}
                                          id="basic-menu"
                                          open={open}
                                          onClose={handleClose}
                                          MenuListProps={{
                                            dense: false,
                                            onClick: handleClose,
                                            "aria-labelledby": "basic-button",
                                          }}
                                        >
                                          <MenuItem
                                            onClick={() =>
                                              showViewLegend({
                                                faction: forceFaction,
                                                legend,
                                              })
                                            }
                                          >
                                            <ListItemIcon>
                                              <VisibilityIcon />
                                            </ListItemIcon>
                                            <ListItemText>View</ListItemText>
                                          </MenuItem>
                                          {!!editMode && (
                                            <MenuItem
                                              onClick={() =>
                                                deleteLegend(index, legend.id)
                                              }
                                            >
                                              <ListItemIcon>
                                                <DeleteIcon />
                                              </ListItemIcon>
                                              <ListItemText>
                                                Delete
                                              </ListItemText>
                                            </MenuItem>
                                          )}
                                        </Menu>
                                      </>
                                    )}
                                  </Dropdown>
                                }
                                disablePadding
                              >
                                <ListItemButton
                                  sx={{ py: 1.5 }}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    showViewLegend({
                                      faction: forceFaction,
                                      legend,
                                    });
                                  }}
                                >
                                  <ListItemText
                                    primary={`${legend.name} (${legend.points} pts)`}
                                    secondary={
                                      <ReactMarkdown
                                        children={legend.flavor}
                                        className="rule-text"
                                      />
                                    }
                                  />
                                </ListItemButton>
                              </ListItem>
                            </Card>
                          );
                        })}
                      </>
                    )}
                  {filteredCategories.map((catKey, catIndex) => {
                    const category = data.getCategory(catKey);
                    const categoryData = data.getOrganizationCategory(
                      force,
                      catKey
                    );
                    const unitCatCount = units.filter(
                      (unit) => unit.category === catKey
                    ).length;
                    return (
                      <>
                        <ListItem
                          key={index}
                          secondaryAction={
                            <>
                              {!!editMode && (
                                <IconButton
                                  sx={{ mr: -1 }}
                                  disabled={unitCatCount === 0}
                                  onClick={() =>
                                    showAddUnit({
                                      forceId: index,
                                      faction: forceFaction,
                                      units: units.filter(
                                        (unit) => unit.category === catKey
                                      ),
                                    })
                                  }
                                >
                                  <AddIcon />
                                </IconButton>
                              )}
                            </>
                          }
                          disablePadding
                        >
                          <ListSubheader
                            sx={{
                              flex: 1,
                              zIndex: 0,
                              backgroundColor: "background.paper",
                              color: "inherit",
                            }}
                          >
                            <Typography sx={{ py: 1.5 }} fontSize="15px">
                              {category.name}
                            </Typography>
                          </ListSubheader>
                        </ListItem>
                        {forceUnits
                          .filter((unit) => unit.category === catKey)
                          .map((unit, unitIdx) => {
                            const unitCopy = showingReserves
                              ? get(
                                list,
                                `reserves[${forceFactionId}][${unit.id}]`
                              )
                              : get(list, `forces[${index}].units[${unit.id}]`);
                            const unitSetbacksCount = get(
                              unit,
                              "selectedSetbacks",
                              []
                            ).length;
                            const unitLevel = Math.floor(
                              get(unit, "experience", 0) / 5
                            );
                            const hasPowerRule = find(
                              get(unit, "selectedRules", []),
                              (rule) =>
                                rule.id === "power" ||
                                rule === "power" ||
                                rule === "conclave"
                            );
                            const hasOptions = !!unit?.optionList?.length;
                            return (
                              <Card sx={{ mb: 1 }}>
                                <ListItem
                                  key={index}
                                  secondaryAction={
                                    <Dropdown>
                                      {({
                                        handleClose,
                                        open,
                                        handleOpen,
                                        anchorElement,
                                      }) => (
                                        <>
                                          <IconButton
                                            sx={{ mr: -1 }}
                                            onClick={handleOpen}
                                          >
                                            <MoreVertIcon />
                                          </IconButton>
                                          <Menu
                                            anchorOrigin={{
                                              vertical: "bottom",
                                              horizontal: "right",
                                            }}
                                            transformOrigin={{
                                              vertical: "top",
                                              horizontal: "right",
                                            }}
                                            anchorEl={anchorElement}
                                            id="basic-menu"
                                            open={open}
                                            onClose={handleClose}
                                            MenuListProps={{
                                              dense: false,
                                              onClick: handleClose,
                                              "aria-labelledby": "basic-button",
                                            }}
                                          >
                                            <MenuItem
                                              onClick={() =>
                                                showViewUnit({
                                                  unit,
                                                  faction: forceFaction,
                                                })
                                              }
                                            >
                                              <ListItemIcon>
                                                <VisibilityIcon />
                                              </ListItemIcon>
                                              <ListItemText>View</ListItemText>
                                            </MenuItem>
                                            {!!editMode && (
                                              <MenuItem
                                                onClick={() =>
                                                  addUnitToForce(
                                                    index,
                                                    unitCopy,
                                                    unit.id + 1
                                                  )
                                                }
                                              >
                                                <ListItemIcon>
                                                  <ContentCopyIcon />
                                                </ListItemIcon>
                                                <ListItemText>
                                                  Copy
                                                </ListItemText>
                                              </MenuItem>
                                            )}
                                            {!!editMode &&
                                              (hasOptions || hasPowerRule) && (
                                                <MenuItem
                                                  onClick={() => {
                                                    showEditUnit({
                                                      faction: forceFaction,
                                                      unitId: unit.id,
                                                      forceId: index,
                                                    });
                                                  }}
                                                >
                                                  <ListItemIcon>
                                                    <EditIcon />
                                                  </ListItemIcon>
                                                  <ListItemText>
                                                    Edit
                                                  </ListItemText>
                                                </MenuItem>
                                              )}
                                            {!!editMode &&
                                              new Set([
                                                "campaign",
                                                "narrative",
                                              ]).has(listType) && (
                                                <MenuItem
                                                  onClick={() => {
                                                    showRenameUnit({
                                                      faction: forceFaction,
                                                      unitId: unit.id,
                                                      forceId: index,
                                                    });
                                                  }}
                                                >
                                                  <ListItemIcon>
                                                    <BadgeIcon />
                                                  </ListItemIcon>
                                                  <ListItemText>
                                                    Rename
                                                  </ListItemText>
                                                </MenuItem>
                                              )}
                                            {listType === "campaign" && (
                                              <MenuItem
                                                onClick={() => {
                                                  showEditUnitCampaign({
                                                    faction: forceFaction,
                                                    unitId: unit.id,
                                                    forceId: index,
                                                  });
                                                }}
                                              >
                                                <ListItemIcon>
                                                  <MilitaryTechIcon />
                                                </ListItemIcon>
                                                <ListItemText>
                                                  Campaign
                                                </ListItemText>
                                              </MenuItem>
                                            )}
                                            {!!editMode &&
                                              listType === "campaign" &&
                                              !showingReserves && (
                                                <MenuItem
                                                  onClick={() =>
                                                    moveUnitReserves(
                                                      index,
                                                      unit.id
                                                    )
                                                  }
                                                >
                                                  <ListItemIcon>
                                                    <ArrowForwardIcon />
                                                  </ListItemIcon>
                                                  <ListItemText>
                                                    To Reserves
                                                  </ListItemText>
                                                </MenuItem>
                                              )}
                                            {!!editMode &&
                                              listType === "campaign" &&
                                              showingReserves && (
                                                <MenuItem
                                                  onClick={() =>
                                                    moveUnitForce(
                                                      index,
                                                      unit.id
                                                    )
                                                  }
                                                >
                                                  <ListItemIcon>
                                                    <ArrowBackIcon />
                                                  </ListItemIcon>
                                                  <ListItemText>
                                                    To Force
                                                  </ListItemText>
                                                </MenuItem>
                                              )}
                                            {!!editMode && (
                                              <MenuItem
                                                onClick={() =>
                                                  deleteUnit(index, unit.id)
                                                }
                                              >
                                                <ListItemIcon>
                                                  <DeleteIcon />
                                                </ListItemIcon>
                                                <ListItemText>
                                                  Delete
                                                </ListItemText>
                                              </MenuItem>
                                            )}
                                          </Menu>
                                        </>
                                      )}
                                    </Dropdown>
                                  }
                                  disablePadding
                                >
                                  <ListItemButton
                                    sx={{
                                      py: 1.5,
                                      alignItems: "center",
                                      display: "flex",
                                    }}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      showViewUnit({
                                        unit,
                                        faction: forceFaction,
                                      });
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <>
                                          {`${unit.customName || unit.name}
                                          (${unit.points} pts)`}
                                          {unitLevel > 0 &&
                                            listType === "campaign" && (
                                              <Chip
                                                sx={{ ml: 1 }}
                                                size="small"
                                                variant="outlined"
                                                color="secondary"
                                                label={
                                                  listType === "campaign" &&
                                                    unitLevel > 0
                                                    ? ` ${formatLevel(
                                                      unitLevel
                                                    )}`
                                                    : ""
                                                }
                                              />
                                            )}
                                          {unitSetbacksCount > 0 &&
                                            listType === "campaign" && (
                                              <Chip
                                                size="small"
                                                sx={{ ml: 1 }}
                                                variant="outlined"
                                                color="error"
                                                label={
                                                  listType === "campaign" &&
                                                    unitSetbacksCount > 0
                                                    ? `${unitSetbacksCount} ${unitSetbacksCount > 1
                                                      ? "Injuries"
                                                      : "Injury"
                                                    }`
                                                    : ""
                                                }
                                              />
                                            )}
                                        </>
                                      }
                                      secondary={
                                        <ReactMarkdown
                                          children={unit.description}
                                          className="rule-text"
                                        />
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              </Card>
                            );
                          })}
                      </>
                    );
                  })}
                </>
              </CardContent>
            </>
          );
        })}
        <input
          id="file-input"
          type="file"
          name="name"
          multiple
          ref={fileDialog}
          onChange={uploadList}
          style={{ height: "0", overflow: "hidden", display: "none" }}
        />
      </Container>
    </>
  );
});
