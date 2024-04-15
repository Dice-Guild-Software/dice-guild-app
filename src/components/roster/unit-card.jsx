import { faBook, faBug } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography
} from "@mui/material";
import { Dropdown } from "components/dropdown";
import { EasyTooltip } from "components/easytootlip";
import { DescriptionModal, UnitDebugModal } from "components/roster/modals";
import { OptionList } from "components/roster/option-list";
import { RuleList } from "components/roster/rule-list";
import { UnitStats } from "components/roster/unit-stats";
import { WeaponList } from "components/roster/weapon-list";
import { useModal } from "hooks";
import { get, uniq } from "lodash";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { formatLevel } from "utils/format";

export const UnitCard = (props) => {
  const {
    unit,
    data,
    faction,
    subfactionId = "none",
    showOptions = true,
    unitOptions,
    points,
    weapons,
    rules,
    weaponRules,
    models,
    embeddedOptions = false,
    toggler: toggle = true,
    focusView = true,
    perks,
    level,
    setbacks,
    showContext = false,
    userPrefs,
    powerSpecialty,
    printMode,
  } = props;
  const toggler = !printMode && toggle;
  const unitPoints = useMemo(() => {
    return points ? points : data.getUnitPoints(unit, faction);
  }, [points, data, unit, faction]);
  const unitWeapons = weapons ? weapons : data.getWeapons(unit, faction) || [];
  const unitRules = rules ? rules : data.getModelRules([unit], faction);
  const weaponRuleList = weaponRules
    ? weaponRules
    : data.getWeaponRules([unit], faction);
  const unitSubfactions = focusView
    ? [
        subfactionId !== "none"
          ? `${
              { ...data.getSubfaction(faction.id, subfactionId) }.name || "No"
            } Focus`
          : "",
      ].filter((name) => !!name)
    : uniq(
        get(unit, "subfactions", [])
          .map((subfactionId) => data.getSubfaction(faction.id, subfactionId))
          .map((subfac) => `${subfac.name || "No"} Focus`)
      );
  const unitSetbacksCount = (setbacks || []).length;
  const [showUnitDescription, hideUnitDescription] = useModal(
    ({ extraProps }) => (
      <DescriptionModal
        {...props}
        hideModal={hideUnitDescription}
        unit={unit}
        {...extraProps}
      />
    ),
    [unit]
  );
  const [showUnitDebug, hideUnitDebug] = useModal(
    ({ extraProps }) => (
      <UnitDebugModal
        {...props}
        hideModal={hideUnitDebug}
        unit={unit}
        data={data}
        faction={faction}
        {...extraProps}
      />
    ),
    [unit, data, faction]
  );
  // const handleSearch = () => {
  //   const query = unit.searchTerms || `${faction.name} ${unit.name}`;
  //   const url = "http://www.google.com/search?q=" + query + "&tbm=isch";
  //   window.open(url, "_blank");
  // };
  const renderModelRules = (rules) => {
    if (!rules.length) {
      return;
    }
    return (
      <>
        {!toggler && <Divider />}
        <div className="unit-specialrules">
          <RuleList
            twoColumn
            toggler={toggler}
            faction={faction}
            rules={rules}
          />
        </div>
      </>
    );
  };
  const renderModelExtraRules = (perks) => {
    if (!perks.length) {
      return;
    }
    return (
      <>
        <Divider />
        <div className={"two-columns"}>
          {perks.map((perk) => {
            const ruleName = `${perk.name}`;
            const stuff = `**${ruleName}**: ${perk.description}`;
            return (
              <div className="no-break">
                <>
                  <ReactMarkdown children={stuff} className="rule-text" />
                </>
              </div>
            );
          })}
        </div>
      </>
    );
  };
  function renderOptions(data, unit, faction) {
    let options = unitOptions
      ? unitOptions
      : data.getOptionsList(unit, faction);
    if (!options.length) {
      return;
    }
    return (
      <>
        <Divider />
        <div style={{ marginBottom: "0.5em" }}>
          <OptionList faction={faction} options={options} toggler={toggler} />
        </div>
      </>
    );
  }

  const getExtraActions = () => {
    if (showContext && (unit.background || !!userPrefs.developerMode)) {
      return (
        <Dropdown>
          {({ handleClose, open, handleOpen, anchorElement }) => (
            <>
              <IconButton onClick={handleOpen} sx={{ color: "inherit" }}>
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
                {!!unit.background && (
                  <MenuItem onClick={showUnitDescription}>
                    <ListItemIcon>
                      <FontAwesomeIcon icon={faBook} />
                    </ListItemIcon>
                    <ListItemText>Read More</ListItemText>
                  </MenuItem>
                )}
                {!!userPrefs.developerMode && (
                  <MenuItem onClick={showUnitDebug}>
                    <ListItemIcon>
                      <FontAwesomeIcon icon={faBug} />
                    </ListItemIcon>
                    <ListItemText>Debug Unit</ListItemText>
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Dropdown>
      );
    } else {
      return <></>;
    }
  };
  const perkString =
    perks && perks.length
      ? `${perks.length > 1 ? "perks" : "the perk"} (${perks
          .map((perk) => perk.name)
          .join(", ")})`
      : "";
  const setbackString =
    setbacks && setbacks.length
      ? `${setbacks.length > 1 ? "injuries" : "the injury"} (${setbacks
          .map((setback) => setback.name)
          .join(", ")})`
      : "";
  const combinedString = [perkString, setbackString]
    .filter((str) => str.length)
    .join(" and ");
  const unitPowerSpecialty = powerSpecialty;
  // const renderAdditionalModels = (unit, faction) => {
  //   return (
  //     <ul className="ul-indent" style={{ marginBottom: 0, marginTop: 0 }}>
  //       {(unit.models || [])
  //         .filter((model) => model.min > 0)
  //         .map((model) => formatModel(model, unit, faction, data))
  //         .map((modelString) => (
  //           <li>{modelString}</li>
  //         ))}
  //     </ul>
  //   );
  // };
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {printMode ? (
          <span style={{ marginRight: "5px" }}>
            {unit.customName || unit.name}
          </span>
        ) : (
          <EasyTooltip
            title={
              <ReactMarkdown
                className="rule-text font-16"
                children={unit?.description}
              />
            }
          >
            <span style={{ marginRight: "5px" }}>
              {unit.customName || unit.name}
            </span>
          </EasyTooltip>
        )}
        <small style={{ fontSize: "1rem" }}>{`(${unitPoints}pts)`}</small>
        {level > 0 && (
          <Chip
            size="small"
            color="secondary"
            sx={{ ml: 1 }}
            label={level ? `${formatLevel(level)}` : ""}
          />
        )}
        {unitSetbacksCount > 0 && (
          <Chip
            size="small"
            color="error"
            sx={{ ml: 1 }}
            label={
              unitSetbacksCount > 0
                ? `${unitSetbacksCount} ${
                    unitSetbacksCount > 1 ? "Injuries" : "Injury"
                  }`
                : ""
            }
          />
        )}
      </Typography>
      <div style={{ marginBottom: "0.5em" }} className="unit-stats">
        <UnitStats
          powerSpecialty={powerSpecialty}
          models={models}
          unit={unit}
          faction={faction}
          data={data}
          perks={perks}
          setbacks={setbacks}
          options={embeddedOptions ? unitOptions : undefined}
          printMode={printMode}
        />
      </div>
      {!!unitWeapons.length && !printMode && (
        <div style={{ marginBottom: "0.5em" }} className="unit-weapons">
          <WeaponList
            printMode={printMode}
            toggler={toggler}
            weapons={unitWeapons}
            faction={faction}
            data={data}
            rules={weaponRuleList}
          />
        </div>
      )}
      {!printMode && (
        <div style={{ marginBottom: "0.5em" }} className="unit-weapons">
          {renderModelRules(unitRules)}
        </div>
      )}
      {!!showOptions && renderOptions(data, unit, faction)}
      {renderModelExtraRules([...(perks || []), ...(setbacks || [])])}
      <div>
        {!!unitOptions?.length && (
          <>
            <Divider />
            <OptionList
              faction={faction}
              options={unitOptions}
              toggler={false}
            />
          </>
        )}
      </div>
      {!!unitPowerSpecialty && (
        <div style={{ marginBottom: "0.5rem" }}>
          <ul className="optionUl">
            {!!unitPowerSpecialty && (
              <li>The unit has the "{unitPowerSpecialty}" Power specialty</li>
            )}
          </ul>
        </div>
      )}
      <div style={{ marginBottom: "0.5rem" }}>
        <ul className="optionUl">
          {!!combinedString && <li>The unit has {combinedString}</li>}
        </ul>
      </div>
      <Divider />
      <span className="unit-keywords">
        <b>Keywords: </b>
        {[
          faction.name,
          ...unitSubfactions,
          ...(unit.keywords || ["Infantry"]),
        ].join(", ")}
      </span>
    </Box>
  );
};
