import React from 'react';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';

type props = {
  children: any,
  buttonProps: any,
  openText: string,
  closeText: string,
  collapsedSize?: string | number
}

export const EasyCollapse = (props: props) => {
  const { children, buttonProps, collapsedSize } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const handleToggle = () => {
    setIsOpen(!isOpen);
  }
  return (
    <>
      <Collapse collapsedSize={collapsedSize} in={isOpen} timeout="auto">
        {children}
      </Collapse>
      {!isOpen && <Button fullWidth onClick={handleToggle} { ...buttonProps }>{props.openText || 'Read More'}</Button>}
      {!!isOpen && <Button fullWidth onClick={handleToggle} { ...buttonProps }>{props.closeText || 'Read Less'}</Button>}
    </>
  );
};
