import { Typography } from "@mui/material";
import { EasyTooltip } from "components/easytootlip";
import ReactMarkdown from "react-markdown";

export const PowerCard = (props) => {
  const { power } = props;
  return (
    <Typography>
      <ReactMarkdown
        children={`**${power.name} (${power.charge}):** ${power.description}`}
        className="rule-text"
      />
    </Typography>
  );
};
