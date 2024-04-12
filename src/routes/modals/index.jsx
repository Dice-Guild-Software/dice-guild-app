import {
  Checkbox, FormControl, FormControlLabel, FormGroup, Paper, Typography, useMediaQuery, useTheme
} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";

export const UserPreferences = (props) => {
  const { hideModal, userPrefs, setUserPrefs } = props;
  const [localUserPrefs, setLocalUserPrefs] = useState(userPrefs);
  return (
    <>
      <Dialog open fullWidth maxWidth="sm" onClose={hideModal}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Paper sx={{ px: 3, py: 2 }} style={{ height: '100%', borderRadius: 0, overflowY: 'auto' }}>
            <FormGroup>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={() =>
                        setLocalUserPrefs({
                          ...localUserPrefs,
                          showBeta: !localUserPrefs.showBeta,
                        })
                      }
                      checked={localUserPrefs.showBeta}
                    />
                  }
                  label="Show Beta Content"
                />
              </FormControl>
            </FormGroup>
            <FormGroup>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={() =>
                        setLocalUserPrefs({
                          ...localUserPrefs,
                          developerMode: !localUserPrefs.developerMode,
                        })
                      }
                      checked={localUserPrefs.developerMode}
                    />
                  }
                  label="Enable Developer Mode"
                />
              </FormControl>
            </FormGroup>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={hideModal}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() => {
              setUserPrefs(localUserPrefs);
              hideModal();
            }}
          >
            Save
          </Button>{" "}
        </DialogActions>
      </Dialog>
    </>
  );
};

export const ShowInfo = (props) => {
  const { hideModal, contextTitle, author, version, id } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <Dialog open onClose={hideModal} fullScreen={fullScreen} maxWidth="sm" fullWidth>
        <DialogTitle closeButton>{contextTitle}</DialogTitle>
        <DialogContent style={{ padding: 0 }} sx={{ backgroundColor: "background.paper" }}>
          <Paper sx={{ p: 2 }} style={{ height: '100%', borderRadius: 0, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>ID: {id}</Typography>
            <Typography variant="h6" gutterBottom>Version: {version}</Typography>
            <Typography variant="h6">Created By: {author}</Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={hideModal}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
