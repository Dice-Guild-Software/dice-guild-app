import { Box, ClickAwayListener, Tooltip } from "@mui/material";
import { useState } from "react";

export const EasyTooltip = (props) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Tooltip
        arrow
        disableFocusListener
        disableHoverListener
        disableTouchListener
        className="clickable"
        onClose={handleClose}
        open={open}
        title={props?.title}
        placement="top"
      >
        <Box
          style={{ display: "inline", textDecoration: "underline" }}
          onClick={handleOpen}
        >
          {props?.children}
        </Box>
      </Tooltip>
    </ClickAwayListener>
  );
};
