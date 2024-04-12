import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material";

export const RuleList = (props) => {
  const { rules, toggler, twoColumn, showName = true } = props;
  const theme = useTheme();
  const [showRules, setShowRules] = useState(false);
  const borderColor = theme.palette.primary.main;
  const btnStyle = { borderColor };
  return (
    <div>
      {!!toggler && (
        <div className="text-center" style={{ marginBottom: "0.5rem" }}>
          <Button
            sx={{ color: 'inherit', textTransform: 'none' }}
            size="small"
            fullWidth
            variant="outlined"
            block
            style={btnStyle}
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? "Hide" : "Special Rules"}
          </Button>
        </div>
      )}
      <Collapse in={!toggler || showRules}>
        <div>
          <div className={twoColumn ? "two-columns" : ""}>
            {rules.map((rule) => {
              const ruleName = `${rule.name}${
                rule.inputs
                  ? `(${rule.inputs
                      .map((input) => input.toUpperCase())
                      .join(", ")})`
                  : ``
              }`;
              const stuff = `${showName ? `**${ruleName}**: ` : ""}${
                rule.description
              }`;
              return (
                <div className="no-break">
                  <>
                    <ReactMarkdown children={stuff} className="rule-text" />
                  </>
                </div>
              );
            })}
          </div>
        </div>
      </Collapse>
    </div>
  );
};
