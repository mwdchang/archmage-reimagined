export const arcaneBackground = () => {
  const canvas = document.getElementById("arcane") as HTMLCanvasElement;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Arcane symbol set (runes, alchemy, occult)
  const symbols = [
    "ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ",
    "ᛉ","ᛋ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ",
    "☉","☽","☿","♀","♂","♃","♄","♆","♇",
    "✶","✷","✸","✹","✺","✧","✦","✩","✪"
  ];

  const fontSize = 40;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(99);

  function draw() {
    if (!ctx) { return; }

    // Fade effect (trails)
    ctx.fillStyle = "rgba(10, 5, 20, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = "center";

    for (let i = 0; i < drops.length; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Glow effect
      // ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#c084fc";

      ctx.fillText(symbol, x, y);

      // Reset drop randomly
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  // Resize handling
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  });

  setInterval(draw, 500);
}
