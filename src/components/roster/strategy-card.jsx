import {
  Typography
} from "@mui/material";
import ReactMarkdown from "react-markdown";

export const StrategyCard = (props) => {
  const { strategy } = props;
  return (
    <Typography>
      <ReactMarkdown
        children={`**${strategy.name} (${strategy.cost}):** ${strategy.description}`}
        className="rule-text"
      />
    </Typography>
  );
};
