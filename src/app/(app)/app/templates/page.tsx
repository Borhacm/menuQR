import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireTenantContext } from "@/lib/auth/guards";
import { updateTemplateAction, updateTemplateStylesAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { canUseTemplates } from "@/config/plans";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { ThemeControls } from "@/app/(app)/app/resource/theme-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const labels = getAdminMessages(locale).templates;
  const params = (await searchParams) ?? {};
  const saved = params.saved === "styles";
  const currentTemplate = ctx.resource?.templateId ?? "classic";
  const canUseAllTemplates = canUseTemplates(ctx.organization.planId, 3);
  const theme = (ctx.resource?.themeJson && typeof ctx.resource.themeJson === "object"
    ? ctx.resource.themeJson
    : {}) as Record<string, unknown>;
  const primaryColor =
    typeof theme.primary === "string" && theme.primary ? theme.primary : "#ffd400";
  const backgroundColor =
    typeof theme.background === "string" && theme.background ? theme.background : "#0d0d0d";
  const surfaceColor =
    typeof theme.surface === "string" && theme.surface ? theme.surface : "#1a1a1a";
  const textColor = typeof theme.text === "string" && theme.text ? theme.text : "#f5f5f5";
  const borderColor =
    typeof theme.border === "string" && theme.border ? theme.border : "#333333";
  const fontFamily = typeof theme.fontFamily === "string" && theme.fontFamily ? theme.fontFamily : "Inter";
  const density = typeof theme.density === "string" && theme.density ? theme.density : "comfortable";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{labels.title}</h1>
      {saved ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {labels.stylesSaved}
        </div>
      ) : null}
      {!canUseAllTemplates ? (
        <p className="text-sm text-muted-foreground">
          {labels.freePlanNotice}
        </p>
      ) : null}
      <Tabs defaultValue={currentTemplate}>
        <TabsList>
          <TabsTrigger value="classic">Classic</TabsTrigger>
          <TabsTrigger value="modern" disabled={!canUseAllTemplates}>Modern</TabsTrigger>
          <TabsTrigger value="grid" disabled={!canUseAllTemplates}>Grid</TabsTrigger>
        </TabsList>
        {["classic", "modern", "grid"].map((templateId) => (
          <TabsContent key={templateId} value={templateId}>
            <Card>
              <CardHeader>
                <CardTitle>{templateId} {labels.templateSuffix}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {labels.liveControlsNotice}
                <form action={updateTemplateAction} className="mt-3">
                  <input type="hidden" name="templateId" value={templateId} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={currentTemplate === templateId ? "default" : "outline"}
                    disabled={!canUseAllTemplates && templateId !== "classic"}
                  >
                    {currentTemplate === templateId ? labels.currentTemplate : labels.useTemplate}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle>{labels.styleTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTemplateStylesAction} className="grid gap-4 md:grid-cols-2">
            <ThemeControls
              initialValues={{
                primaryColor,
                backgroundColor,
                surfaceColor,
                textColor,
                borderColor,
              }}
              labels={getAdminMessages(locale).themeControls}
            />
            <div className="space-y-2">
              <Label>{labels.fontFamily}</Label>
              <Input name="fontFamily" defaultValue={fontFamily} />
            </div>
            <div className="space-y-2">
              <Label>{labels.layoutDensity}</Label>
              <Input name="density" defaultValue={density} placeholder={labels.layoutDensityPlaceholder} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{labels.saveStyles}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
