import { useMediaQuery, useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import { EasyTooltip } from "components/easytootlip";
import { StyledTableRow } from "components/styled-table";
import { isNumber } from "lodash";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { formatRuleVariables } from "utils/data";
import {
  formatModel,
  formatModelCount,
  formatModelSpecial,
  formatModelWeapons,
} from "utils/format";

export const UnitStats = (props) => {
  const { data, unit, faction, toggler, models, printMode = false } = props;
  const [showOptions, setShowOptions] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.up("md")) || printMode;
  const borderColor = theme.palette.primary.main;
  const thStyle = {
    backgroundColor: theme.palette.primary.main,
  };
  const btnStyle = { borderColor };
  const unitModels = (models ? models : data.getModels(unit, faction)).filter(
    (model) =>
      (!!model.shoot && model.shoot !== "-") ||
      (!!model.fight && model.fight !== "-") ||
      (!!model.save && model.save !== "-")
  );
  if (!unit) {
    return null;
  }
  return (
    <div>
      {!!toggler && (
        <div align="center" style={{ padding: "0.5rem 0px" }}>
          <Button
            variant="outline-primary"
            size="sm"
            style={btnStyle}
            block
            onClick={() => setShowOptions(!showOptions)}
          >
            {showOptions ? "Hide" : "Unit Stats"}
          </Button>
        </div>
      )}
      <Collapse in={!toggler || showOptions}>
        <div>
          {/* <>{renderAdditionalModels(unit, faction)}</> */}
          {!!unitModels.length && (
            <>
              <TableContainer sx={{ borderRadius: "2px" }}>
                <Table
                  size="small"
                  aria-label="simple table"
                  style={{ padding: 0 }}
                >
                  <TableHead>
                    <StyledTableRow style={thStyle}>
                      <TableCell>{"Model"}</TableCell>
                      <TableCell align="center">{"Mov"}</TableCell>
                      <TableCell align="center">{"Acc"}</TableCell>
                      <TableCell align="center">{"Str"}</TableCell>
                      <TableCell align="center">{"Res"}</TableCell>
                      <TableCell align="center">{"HP"}</TableCell>
                      <TableCell align="center">{"Init"}</TableCell>
                      <TableCell align="center">{"Co"}</TableCell>
                      {!!fullScreen && <TableCell>{"Special"}</TableCell>}
                    </StyledTableRow>
                  </TableHead>
                  <TableBody>
                    {unitModels.map((model) => {
                      const ruleMap = formatRuleVariables(model?.rules || []);
                      const modelWounds = model.wounds || ruleMap?.wounds?.x;
                      const modelSpecials =
                        formatModelSpecial(model, unit, faction, data) || "-";
                      return (
                        <StyledTableRow>
                          <TableCell>
                            {!fullScreen && (
                              <EasyTooltip
                                title={
                                  <ReactMarkdown
                                    className="rule-text font-16"
                                    children={formatModel(
                                      model,
                                      unit,
                                      faction,
                                      data
                                    )}
                                  />
                                }
                              >
                                {formatModelCount(model)}
                              </EasyTooltip>
                            )}
                            {!!fullScreen &&
                              formatModelWeapons(model, unit, faction, data)}
                          </TableCell>
                          <TableCell align="center">
                            {`${
                              isNumber(model.movement)
                                ? `${model.movement}"`
                                : model.movement
                            }`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!model.shoot ? `${model.shoot}+` : "-"}`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!model.fight ? `${model.fight}+` : "-"}`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!model.defense ? `${model.defense}` : "-"}`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!modelWounds ? `${modelWounds}` : 1}`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!model.reflexes ? `${model.reflexes}` : "-"}`}
                          </TableCell>
                          <TableCell align="center">
                            {`${!!model.courage ? `${model.courage}` : "-"}`}
                          </TableCell>
                          {!!fullScreen && (
                            <TableCell>{modelSpecials}</TableCell>
                          )}
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </div>
      </Collapse>
    </div>
  );
};
