import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Box,
  CardHeader,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { EasyCollapse } from "components/easy-collapse/easy-collapse";
import { get, sortBy } from "lodash";
import ReactMarkdown from "react-markdown";

export const Overview = (props) => {
  const { faction, nameFilter } = props;
  const theme = useTheme();
  const background = faction.background;
  const description = faction.description;
  const lore = faction.lore;
  const powers = get(faction, "buyLinks", []).filter((list) =>
    nameFilter
      ? list.name.toLowerCase().includes(nameFilter.toLowerCase())
      : true
  );
  const sortedPowers = sortBy(powers, (power) => power.name);
  return (
    <Box sx={{ mt: 2 }}>
      {!!lore && (
        <>
          <Stack justifyContent="center" alignItems="center" direction="row">
            <Typography variant="h6" sx={{ mr: 2 }}>Background</Typography>
            <hr style={{ height: "1px", flex: 1 }} />
          </Stack>
          <EasyCollapse
            collapsedSize={300}
            style={{ paddingBottom: 0, paddingTop: 0 }}
          >
            <ReactMarkdown children={lore} />
          </EasyCollapse>
        </>
      )}
    </Box>
  );
};
