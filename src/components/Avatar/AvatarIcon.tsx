type Props = {
  avatarId: string | null | undefined;
  size?: number;
  initials?: string;
};

const FACE = { cx: 30, cy: 36, r: 18 };

const BaseEyes = () => (
  <>
    <circle cx="24" cy="33" r="2.3" fill="#333" />
    <circle cx="36" cy="33" r="2.3" fill="#333" />
  </>
);

const Smile = () => (
  <path d="M 24 41 Q 30 47 36 41" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
);

const avatarMap: Record<string, () => JSX.Element> = {
  // 1 — Short brown hair
  face_01: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="22" rx="16" ry="11" fill="#6B3A2A" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <BaseEyes /><Smile />
    </svg>
  ),
  // 2 — Long black hair
  face_02: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="18" width="36" height="34" rx="4" fill="#1a1a1a" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFE4C4" stroke="#333" strokeWidth="1.5" />
      <BaseEyes /><Smile />
    </svg>
  ),
  // 3 — Red curly hair
  face_03: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="22" r="7" fill="#CC2200" />
      <circle cx="23" cy="16" r="7" fill="#CC2200" />
      <circle cx="30" cy="14" r="7" fill="#CC2200" />
      <circle cx="37" cy="16" r="7" fill="#CC2200" />
      <circle cx="45" cy="22" r="7" fill="#CC2200" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <BaseEyes />
      <path d="M 22 41 Q 30 48 38 41" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 4 — Bald, big smile
  face_04: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#C68642" stroke="#333" strokeWidth="1.5" />
      <BaseEyes />
      <path d="M 22 40 Q 30 49 38 40" stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 5 — Blonde spiky hair
  face_05: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,24 17,8 24,20" fill="#F0C040" stroke="#333" strokeWidth="1" />
      <polygon points="27,21 26,5 32,19" fill="#F0C040" stroke="#333" strokeWidth="1" />
      <polygon points="34,21 35,5 40,20" fill="#F0C040" stroke="#333" strokeWidth="1" />
      <polygon points="40,24 43,8 46,23" fill="#F0C040" stroke="#333" strokeWidth="1" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFE4C4" stroke="#333" strokeWidth="1.5" />
      <BaseEyes />
      <path d="M 25 41 Q 31 45 37 41" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 6 — Baseball cap
  face_06: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="24" rx="20" ry="12" fill="#2255CC" />
      <rect x="10" y="24" width="40" height="6" rx="3" fill="#2255CC" />
      <rect x="8" y="27" width="16" height="4" rx="2" fill="#1a44aa" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <BaseEyes /><Smile />
    </svg>
  ),
  // 7 — Brown hair + glasses
  face_07: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="21" rx="15" ry="10" fill="#8B5E3C" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFE4C4" stroke="#333" strokeWidth="1.5" />
      <rect x="19" y="30" width="10" height="7" rx="3" fill="none" stroke="#333" strokeWidth="1.5" />
      <rect x="31" y="30" width="10" height="7" rx="3" fill="none" stroke="#333" strokeWidth="1.5" />
      <line x1="29" y1="33" x2="31" y2="33" stroke="#333" strokeWidth="1.5" />
      <Smile />
    </svg>
  ),
  // 8 — Dark hair + sunglasses
  face_08: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="22" rx="16" ry="10" fill="#1a1a1a" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#C68642" stroke="#333" strokeWidth="1.5" />
      <rect x="18" y="30" width="11" height="7" rx="3.5" fill="#1a1a1a" />
      <rect x="31" y="30" width="11" height="7" rx="3.5" fill="#1a1a1a" />
      <line x1="29" y1="33" x2="31" y2="33" stroke="#555" strokeWidth="1.5" />
      <path d="M 24 42 Q 30 47 36 42" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 9 — Short hair + beard
  face_09: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="22" rx="15" ry="9" fill="#4a2c10" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <path d="M 16 42 Q 30 54 44 42 Q 44 50 30 52 Q 16 50 16 42 Z" fill="#4a2c10" />
      <BaseEyes />
      <path d="M 24 40 Q 30 45 36 40" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 10 — Pigtails
  face_10: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="30" r="7" fill="#E06030" />
      <circle cx="50" cy="30" r="7" fill="#E06030" />
      <ellipse cx="30" cy="21" rx="14" ry="9" fill="#E06030" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFE4C4" stroke="#333" strokeWidth="1.5" />
      <BaseEyes /><Smile />
    </svg>
  ),
  // 11 — Brown hair + green headband
  face_11: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="21" rx="16" ry="11" fill="#6B3A2A" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <rect x="12" y="23" width="36" height="6" rx="3" fill="#22AA44" />
      <BaseEyes /><Smile />
    </svg>
  ),
  // 12 — Purple mohawk
  face_12: () => (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,28 27,6 30,2 33,6 35,28" fill="#9933CC" />
      <circle cx={FACE.cx} cy={FACE.cy} r={FACE.r} fill="#FFCD94" stroke="#333" strokeWidth="1.5" />
      <BaseEyes />
      <path d="M 24 40 Q 30 44 36 40" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
};

const AvatarIcon = ({ avatarId, size = 40, initials }: Props) => {
  const FaceFn = avatarId ? avatarMap[avatarId] : null;

  if (!FaceFn) {
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
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FaceFn />
    </div>
  );
};

export default AvatarIcon;
