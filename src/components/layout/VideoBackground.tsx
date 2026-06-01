/**
 * Shared video background for all pages.
 * Home page: lighter overlay (video visible).
 * Inner pages: heavy overlay (video as texture only).
 */
type VideoBackgroundProps = {
  overlay?: number; // 0–1, default 0.86
};

export default function VideoBackground({ overlay = 0.86 }: VideoBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <video
        className="h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
      >
        <source src="/video/site-bg.mp4" type="video/mp4" />
      </video>

      {/* Darkness overlay — controls how visible the video is */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />

      {/* Very faint precision grid — futuristic texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
        backgroundSize: "120px 120px",
      }} />

      {/* Edge vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)",
      }} />
    </div>
  );
}
