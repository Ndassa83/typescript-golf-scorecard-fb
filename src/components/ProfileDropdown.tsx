import { useState } from "react";
import { Menu, MenuItem, Divider, Button, Typography } from "@mui/material";
import Select from "react-select";
import { User } from "firebase/auth";
import { PlayerOptionType } from "../types";

type Props = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  currentUser: User;
  playerOptions: PlayerOptionType[];
  onSignOut: () => void;
  onLinkPlayer: (userId: number, googleUid: string) => Promise<void>;
};

const ProfileDropdown = ({
  anchorEl,
  onClose,
  currentUser,
  playerOptions,
  onSignOut,
  onLinkPlayer,
}: Props) => {
  const [selectedOption, setSelectedOption] = useState<PlayerOptionType | null>(null);
  const [linking, setLinking] = useState(false);

  const linkedPlayer = playerOptions.find(
    (o) => o.value.googleUid === currentUser.uid
  );

  const handleLink = async () => {
    if (!selectedOption) return;
    setLinking(true);
    await onLinkPlayer(selectedOption.value.userId, currentUser.uid);
    setSelectedOption(null);
    setLinking(false);
  };

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{ sx: { minWidth: 260, padding: "8px 0" } }}
    >
      <MenuItem disableRipple disableTouchRipple sx={{ cursor: "default", "&:hover": { backgroundColor: "transparent" } }}>
        <Typography variant="body2" color="text.secondary">
          {currentUser.displayName ?? currentUser.email}
        </Typography>
      </MenuItem>

      {linkedPlayer ? (
        <MenuItem disableRipple disableTouchRipple sx={{ cursor: "default", "&:hover": { backgroundColor: "transparent" } }}>
          <Typography variant="body2">
            Linked as <strong>{linkedPlayer.value.userName}</strong> ✓
          </Typography>
        </MenuItem>
      ) : (
        <MenuItem
          disableRipple
          disableTouchRipple
          sx={{ flexDirection: "column", alignItems: "stretch", gap: "8px", cursor: "default", "&:hover": { backgroundColor: "transparent" } }}
        >
          <Typography variant="body2" color="text.secondary">
            Link to existing player:
          </Typography>
          <div style={{ zIndex: 9999 }}>
            <Select
              options={playerOptions}
              value={selectedOption}
              onChange={(opt) => setSelectedOption(opt)}
              placeholder="Select player..."
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <Button
            variant="contained"
            size="small"
            disabled={!selectedOption || linking}
            onClick={handleLink}
            sx={{ backgroundColor: "var(--green-primary)", "&:hover": { backgroundColor: "var(--green-primary)" } }}
          >
            {linking ? "Linking..." : "Link"}
          </Button>
        </MenuItem>
      )}

      <Divider />

      <MenuItem onClick={handleSignOut}>
        <Typography variant="body2" color="error">
          Sign Out
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default ProfileDropdown;
