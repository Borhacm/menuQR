import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Environment and deployment settings are managed via `.env` and platform
          dashboards (Vercel/Neon/Stripe/Resend).
        </CardContent>
      </Card>
    </div>
  );
}
