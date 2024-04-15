import {
  Box,
  Stack,
  Typography
} from "@mui/material";
import { EasyCollapse } from "components/easy-collapse/easy-collapse";
import ReactMarkdown from "react-markdown";

export const Overview = (props) => {
  const { faction } = props;
  const lore = faction.lore;
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
