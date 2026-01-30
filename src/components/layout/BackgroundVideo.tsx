export default function BackgroundVideo() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Mobile */}
      <video
        className="block sm:hidden h-full w-full object-cover"
        src="/video/mobiles-pages-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* Desktop */}
      <video
        className="hidden sm:block h-full w-full object-cover"
        src="/video/pages-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
