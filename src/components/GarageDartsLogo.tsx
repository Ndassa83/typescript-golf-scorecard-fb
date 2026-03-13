export const GarageDartsLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 340 130"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Garage Darts"
  >
    {/* "Garage" — red Fredoka One with dark outline */}
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
      Garage
    </text>

    {/* "DARTS" — navy block letters, dark outer stroke then white inner stroke */}
    <text
      x="170"
      y="118"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Impact', sans-serif"
      fontSize="62"
      fontWeight="900"
      fill="#1a2e80"
      stroke="#0a0a1a"
      strokeWidth="10"
      paintOrder="stroke fill"
      letterSpacing="3"
    >
      DARTS
    </text>
    <text
      x="170"
      y="118"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Impact', sans-serif"
      fontSize="62"
      fontWeight="900"
      fill="#1a2e80"
      stroke="white"
      strokeWidth="4"
      paintOrder="stroke fill"
      letterSpacing="3"
    >
      DARTS
    </text>
  </svg>
);
