import rafiqLogo from "@/assets/rafiq-logo.png";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src={rafiqLogo} alt="Rafiq" className="h-12 w-auto animate-pulse" />
        <p className="font-ui text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
