import rafiqLogo from "@/assets/rafiq-logo.png";
export default function FooterSection() {
  return <footer className="border-t border-border/40 px-4 py-12">
      <div className="container mx-auto flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2.5">
          <img src={rafiqLogo} alt="Rafiq" className="h-9 w-auto" />
          
        </div>
        <p className="text-sm text-muted-foreground">
          Launching Ramadan 2026 · North America's Islamic Wealth Platform
        </p>
        <div className="flex gap-3">
          <div className="rounded-xl border border-border bg-muted/50 px-5 py-2.5 font-ui text-xs font-medium text-muted-foreground">
            App Store — Coming Soon
          </div>
          <div className="rounded-xl border border-border bg-muted/50 px-5 py-2.5 font-ui text-xs font-medium text-muted-foreground">
            Google Play — Coming Soon
          </div>
        </div>
      </div>
    </footer>;
}