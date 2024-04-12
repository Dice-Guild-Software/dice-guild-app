import React from "react";

export const Dropdown = (props) => {
  const { children, defaultOpen } = props;
  const [isOpen, setIsOpen] = React.useState(defaultOpen || false);
  const [anchorElement, setAnchorElement] = React.useState(null);
  const handleClose = () => {
    setIsOpen(false);
    setAnchorElement(null);
  }
  const handleOpen = (event) => {
    setIsOpen(true);
    if (event) {
      setAnchorElement(event.currentTarget);
    }
  }
  if (!children || !(typeof children === 'function')) {
    return <></>;
  }
  return (
    <>
      {children({
        open: isOpen,
        handleClose,
        handleOpen,
        anchorElement
      })}
    </>
  );
};
