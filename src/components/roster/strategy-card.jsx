import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  useTheme,
} from "@mui/material";
import { EasyTooltip } from "components/easytootlip";
import ReactMarkdown from "react-markdown";

export const StrategyCard = (props) => {
  const { strategy } = props;
  const theme = useTheme();
  return (
    <Typography>
      <ReactMarkdown
        children={`**${strategy.name} (${strategy.cost}):** ${strategy.description}`}
        className="rule-text"
      />
    </Typography>
  );
};
