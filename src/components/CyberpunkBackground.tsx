/**
 * Minimal ambient background for inner pages.
 * Futuristic but restrained — no animations, no noise, no bars.
 */
export default function CyberpunkBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ background: "#000000" }}
    >
      {/* Faint pink bloom — top-right */}
      <div style={{
        position: "absolute",
        top: "-20%", right: "-10%",
        width: "55vw", height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,0,144,0.055) 0%, transparent 65%)",
        filter: "blur(60px)",
      }} />

      {/* Very faint secondary bloom — bottom-left */}
      <div style={{
        position: "absolute",
        bottom: "-15%", left: "-8%",
        width: "45vw", height: "45vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,0,144,0.03) 0%, transparent 65%)",
        filter: "blur(70px)",
      }} />

      {/* Barely-visible precision grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "120px 120px",
      }} />

      {/* Edge vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
      }} />
    </div>
  );
}
