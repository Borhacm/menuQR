import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrEditorForm } from "@/app/(app)/app/qr/qr-editor-form";
import { deleteQrDesignAction, renameQrDesignAction } from "@/lib/admin/qr-actions";
import type { AdminMessages } from "@/lib/admin/i18n";
import type { QrDesign } from "@prisma/client";

type QrDesignRow = Pick<QrDesign, "id" | "name" | "createdAt" | "resourceId"> & {
  configJson: unknown;
};

export function MenuQrDashboard(opts: {
  resourceId: string;
  localeBundle: AdminMessages["qr"];
  canBrandQr: boolean;
  designs: QrDesignRow[];
}) {
  const { resourceId, localeBundle: t, canBrandQr, designs } = opts;
  const activeDesignId = designs[0]?.id;
  const activeConfig = (designs[0]?.configJson ?? {}) as {
    dotsColor?: string;
    bgColor?: string;
    dotStyle?: string;
    cornerStyle?: string;
    logoUrl?: string;
    logoColor?: string;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.designTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <QrEditorForm
            canBrandQr={canBrandQr}
            resourceId={resourceId}
            designId={activeDesignId}
            initial={{
              dotsColor: activeConfig.dotsColor ?? "#111111",
              bgColor: activeConfig.bgColor ?? "#ffffff",
              dotStyle: activeConfig.dotStyle ?? "square",
              cornerStyle: activeConfig.cornerStyle ?? "square",
              logoUrl: activeConfig.logoUrl ?? "",
              logoColor: activeConfig.logoColor ?? "#111111",
            }}
            labels={t}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.savedDesignsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {designs.map((d) => (
            <div key={d.id} className="rounded-md border p-3">
              <form action={renameQrDesignAction} className="mb-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="designId" value={d.id} />
                <input
                  name="name"
                  defaultValue={d.name}
                  placeholder={t.designNamePlaceholder}
                  className="h-9 min-w-60 rounded-md border border-input bg-background px-3 text-sm"
                />
                <button
                  type="submit"
                  className="h-9 rounded-md border border-input px-3 text-xs font-medium text-foreground hover:bg-accent/20"
                >
                  {t.renameDesign}
                </button>
              </form>
              <div className="text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`/api/qr/export?resourceId=${encodeURIComponent(resourceId)}&designId=${encodeURIComponent(d.id)}&format=png`}
                  className="text-xs text-primary underline underline-offset-4"
                >
                  {t.exportPng}
                </a>
                <a
                  href={`/api/qr/export?resourceId=${encodeURIComponent(resourceId)}&designId=${encodeURIComponent(d.id)}&format=svg`}
                  className="text-xs text-primary underline underline-offset-4"
                >
                  {t.exportSvg}
                </a>
                <a
                  href={`/api/qr/export?resourceId=${encodeURIComponent(resourceId)}&designId=${encodeURIComponent(d.id)}&format=pdf`}
                  className="text-xs text-primary underline underline-offset-4"
                >
                  {t.exportPdf}
                </a>
                <form action={deleteQrDesignAction}>
                  <input type="hidden" name="designId" value={d.id} />
                  <button type="submit" className="text-xs text-destructive underline underline-offset-4">
                    {t.deleteDesign}
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!designs.length ? <p className="text-muted-foreground">{t.empty}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
