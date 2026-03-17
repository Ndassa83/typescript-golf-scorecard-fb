type Props = {
  avatarId: string | null | undefined;
  size?: number;
  initials?: string;
};

const AvatarIcon = ({ avatarId, size = 40, initials }: Props) => {
  if (!avatarId) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "var(--green-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "'Fredoka One', cursive",
          fontSize: size * 0.38,
          flexShrink: 0,
        }}
      >
        {initials?.charAt(0).toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/avatars/${avatarId}.png`}
        alt={avatarId}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

export default AvatarIcon;
