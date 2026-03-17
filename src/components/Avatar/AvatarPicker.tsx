import { AVATARS } from "./avatarData";
import AvatarIcon from "./AvatarIcon";
import "./AvatarPicker.css";

type Props = {
  selected: string | null;
  onSelect: (id: string) => void;
};

const AvatarPicker = ({ selected, onSelect }: Props) => (
  <div className="avatarPickerGrid">
    {AVATARS.map(({ id, label }) => (
      <button
        key={id}
        className={`avatarPickerBtn${selected === id ? " avatarPickerBtnSelected" : ""}`}
        onClick={() => onSelect(id)}
        title={label}
        type="button"
      >
        <AvatarIcon avatarId={id} size={44} />
      </button>
    ))}
  </div>
);

export default AvatarPicker;
