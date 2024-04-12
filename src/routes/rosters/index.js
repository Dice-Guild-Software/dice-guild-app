import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Card,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  useTheme
} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CustomCircularProgress from "components/CustomCircularProgress";
import { Dropdown } from "components/dropdown";
import { DataContext, useModal } from "hooks";
import { useLocalStorage } from "hooks/use-localstorage";
import { get, omit, startCase } from "lodash";
import { useSnackbar } from "notistack";
import React from "react";
import { useLocation, useNavigate } from "react-router";
import { AddList, ShareList, UpdateList } from "routes/rosters/modals";
import { downloadFile, readFileContent } from "utils/files";
import { v4 as uuidv4 } from "uuid";

export default React.memo((props) => {
  const [{ data: nope, appState, userPrefs, setAppState }] =
    React.useContext(DataContext);
  const nameFilter = appState?.searchText;
  const fileDialog = React.useRef();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const [lists, setRawLists] = useLocalStorage("lists", {});
  const shareData = queryParams?.get("share");
  const { enqueueSnackbar } = useSnackbar();
  const setLists = React.useCallback(
    (listData) => {
      const newGameData = {
        ...listData,
      };
      setRawLists(newGameData);
    },
    [setRawLists]
  );
  const importList = React.useCallback(
    (listObject) => {
      if (listObject.forces) {
        const newArmyData = {
          ...listObject,
        };
        const listName = listObject.name;
        const listId = uuidv4();
        setLists({
          ...lists,
          [listId]: {
            name: listName,
            ...newArmyData,
          },
        });
        enqueueSnackbar(`List '${listName}' successfully imported.`, {
          appearance: "success",
        });
      }
    },
    [enqueueSnackbar, lists, setLists]
  );
  React.useEffect(() => {
    if (!shareData) {
      return;
    }
    let listObject = {};
    try {
      listObject = JSON.parse(atob(shareData));
    } catch (e) {
      return Promise.reject(e);
    }
    importList(listObject);
    queryParams.delete("share");
    navigate(
      {
        search: queryParams?.toString(),
      },
      { replace: true }
    );
  }, [navigate, importList, queryParams, shareData]);
  const addList = (listName, data) => {
    const listId = uuidv4();
    setLists({
      ...lists,
      [listId]: {
        name: listName,
        ...data,
      },
    });
    goToList(listId);
  };
  const updateList = (listId, newData) => {
    setLists({
      ...lists,
      [listId]: {
        ...get(lists, `[${listId}]`, {}),
        ...newData,
      },
    });
  };
  const goToList = (listId) => navigate(`/lists/${listId}`);
  const handleClick = () => {
    fileDialog.current.click();
  };

  const copyToClipboard = (message, text) => {
    navigator.clipboard.writeText(text).then(
      function () {
        enqueueSnackbar(message, {
          appearance: "success",
        });
      },
      function (err) {
        enqueueSnackbar(`Failed to write to clipboard.`, {
          appearance: "error",
        });
      }
    );
  };
  const uploadFile = (event) => {
    uploadList(event);
  };
  const uploadList = (event) => {
    event.preventDefault();
    const file = get(event, "target.files[0]");
    if (file) {
      readFileContent(file)
        .then((content) => {
          let listObject = {};
          try {
            listObject = JSON.parse(content);
          } catch (e) {
            return Promise.reject(e);
          }
          importList(listObject);
        })
        .catch((error) => {
          enqueueSnackbar(`List failed to import. ${error.message}`, {
            appearance: "error",
          });
        });
    }
    fileDialog.current.value = null;
  };
  const [showAddList, hideAddList] = useModal(
    ({ extraProps }) => (
      <AddList
        {...props}
        rawData={nope}
        userPrefs={userPrefs}
        hideModal={hideAddList}
        lists={lists}
        addList={addList}
        {...extraProps}
      />
    ),
    [lists]
  );
  const [showShareList, hideShareList] = useModal(
    ({ extraProps }) => (
      <ShareList
        {...props}
        hideModal={hideShareList}
        copyToClipboard={copyToClipboard}
        {...extraProps}
      />
    ),
    [lists]
  );
  const [showEditList, hideEditList] = useModal(
    ({ extraProps }) => (
      <UpdateList
        {...props}
        hideModal={hideEditList}
        lists={lists}
        updateList={updateList}
        {...extraProps}
      />
    ),
    [lists]
  );

  const deleteList = (id) => {
    setLists(omit(lists, [id]));
  };
  const downloadList = (id) => {
    downloadFile(
      JSON.stringify(
        {
          ...get(lists, `[${id}]`),
        },
        null,
        2
      ),
      "data:text/json",
      `${get(lists, `[${id}].name`, id)}.json`
    );
  };
  const shareList = (id) => {
    const list = get(lists, `[${id}]`);
    const listData = btoa(JSON.stringify(list));
    showShareList({ listData, listName: list?.name });
  };
  React.useEffect(() => {
    setAppState({
      enableSearch: true,
      contextActions: [
        {
          name: "Create",
          icon: <AddIcon />,
          onClick: () => {
            showAddList();
          },
        },
        {
          name: "Import",
          icon: <UploadIcon />,
          onClick: () => {
            handleClick();
          },
        },
      ],
    });
    return () => {
      setAppState({
        contextActions: [],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // const [dialOpen, setDialOpen] = React.useState(false);
  if (!lists) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <CustomCircularProgress />
      </Box>
    );
  }
  const factionColor = theme.palette.primary.main;
  const filteredLists = Object.keys(lists)
    .map((listId) => {
      return {
        ...lists[listId],
        id: listId,
      };
    })
    ?.filter((list) =>
      nameFilter
        ? list?.name?.toLowerCase()?.includes(nameFilter?.toLowerCase())
        : true
    );
  return (
    <>
      <Stack justifyContent="center" alignItems="center" direction="row">
        <Typography sx={{ my: 2, mr: 2 }} variant="h5">
          {"Manage Rosters"}
        </Typography>
        <hr style={{ height: "1px", flex: 1 }} />
      </Stack>
      {filteredLists.map((list, unitIdx) => {
        const { pointLimit, type } = list;
        return (
          <Card sx={{ mb: 1 }}>
            <ListItem
              key={unitIdx}
              secondaryAction={
                <Dropdown>
                  {({ handleClose, open, handleOpen, anchorElement }) => (
                    <>
                      <IconButton sx={{ mr: -1 }} onClick={handleOpen}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        anchorEl={anchorElement}
                        id="basic-menu"
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                          dense: false,
                          onClick: handleClose,
                          "aria-labelledby": "basic-button",
                        }}
                      >
                        <MenuItem onClick={() => goToList(list.id)}>
                          <ListItemIcon>
                            <EditIcon />
                          </ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => downloadList(list.id)}>
                          <ListItemIcon>
                            <DownloadIcon />
                          </ListItemIcon>
                          <ListItemText>Download</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => shareList(list.id)}>
                          <ListItemIcon>
                            <ShareIcon />
                          </ListItemIcon>
                          <ListItemText>Share</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => deleteList(list.id)}>
                          <ListItemIcon>
                            <DeleteIcon />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Dropdown>
              }
              disablePadding
            >
              <ListItemButton
                sx={{ py: 1.5 }}
                onClick={() => goToList(list.id)}
              >
                <ListItemText
                  primary={list.name}
                  secondary={[
                    pointLimit ? `${pointLimit}pts` : undefined,
                    startCase(type),
                  ].join(" - ")}
                />
              </ListItemButton>
            </ListItem>
          </Card>
        );
      })}
      {!filteredLists.length && (
        <>
          <Typography>
            No created rosters. Choose a game system and a faction to get started.
          </Typography>
        </>
      )}
    </>
  );
});
