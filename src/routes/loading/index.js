import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DataContext } from "hooks";
import logo from "assets/vortex_gate_small.png";
import { get } from 'lodash';
import React, {
  useContext
} from "react";

export default React.memo((props) => {
  const [
    {
      data,
    },
  ] = useContext(DataContext);
  const hasGameData = !!Object.keys(get(data, `gameData`, {})).length;
  if (hasGameData) {
    return (<></>);
  }
  return (
    <Backdrop
      open={true}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 5 }}
      onClick={(event) => { event.stopPropagation(); event.preventDefault() }}
    >
      <Paper elevation={0} sx={{ p: 5, width: '80%', borderRadius: '2px' }}>
        <Stack sx={{ alignItems: 'center'}} spacing={3}>
          <img
            flex={1}
            className={"d-block text-center"}
            style={{ width: '150px'}}
            src={logo}
            alt="logo"
          />
          <CircularProgress />
          <Typography>Fetching app data...</Typography>
        </Stack>
      </Paper>
    </Backdrop>
  );
});
