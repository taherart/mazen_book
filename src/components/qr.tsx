import QRCode from "qrcode";

/** QR code as inline SVG. Pure computation, so it renders on the server and prints crisply at any size. */
export function Qr({ value, className, title }: { value: string; className?: string; title?: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const size = modules.size;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`-2 -2 ${size + 4} ${size + 4}`} shapeRendering="crispEdges" role="img" aria-label={title ?? "رمز QR"} className={className}>
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={d} fill="#1d1f26" />
    </svg>
  );
}
