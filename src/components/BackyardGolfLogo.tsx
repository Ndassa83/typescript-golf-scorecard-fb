export const BackyardGolfLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 340 130"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Backyard Golf"
  >
    {/* "Backyard" — red Fredoka One with dark outline */}
    <text
      x="170"
      y="54"
      textAnchor="middle"
      fontFamily="'Fredoka One', cursive"
      fontSize="54"
      fill="#D42B1E"
      stroke="#1a0808"
      strokeWidth="3"
      paintOrder="stroke fill"
    >
      Backyard
    </text>

    {/* "GOLF" — green block letters, dark outer stroke then white inner stroke */}
    <text
      x="170"
      y="118"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Impact', sans-serif"
      fontSize="66"
      fontWeight="900"
      fill="#1e6b30"
      stroke="#1a0808"
      strokeWidth="10"
      paintOrder="stroke fill"
      letterSpacing="4"
    >
      GOLF
    </text>
    <text
      x="170"
      y="118"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Impact', sans-serif"
      fontSize="66"
      fontWeight="900"
      fill="#1e6b30"
      stroke="white"
      strokeWidth="4"
      paintOrder="stroke fill"
      letterSpacing="4"
    >
      GOLF
    </text>
  </svg>
);
