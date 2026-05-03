import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTemplateAction, updateTemplateStylesAction } from "@/lib/admin/template-actions";
import { ThemeControls } from "@/app/(app)/app/resource/theme-controls";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";
import { MenuStylePresetPicker } from "@/components/admin/menu-style-preset-picker";
import type { AdminMessages } from "@/lib/admin/i18n";
import type { MenuStylesLoaded } from "@/lib/admin/load-menu-styles-data";

type TemplatesLabels = AdminMessages["templates"];

export function MenuStyleEditorPanel(opts: {
  templatesLabels: TemplatesLabels;
  themeControlsLabels: AdminMessages["themeControls"];
  canUseAllTemplates: boolean;
  data: MenuStylesLoaded;
}) {
  const {
    templatesLabels,
    themeControlsLabels,
    canUseAllTemplates,
    data: {
      rawTemplate: currentTemplate,
      previewTheme: {
        primary: primaryColor,
        background: backgroundColor,
        surface: surfaceColor,
        text: textColor,
        border: borderColor,
        fontFamily,
        density,
      },
    },
  } = opts;
  const activePresetId =
    primaryColor === "#ffd400" &&
    backgroundColor === "#0d0d0d" &&
    surfaceColor === "#1a1a1a" &&
    textColor === "#f5f5f5" &&
    borderColor === "#333333"
      ? "dark-gold"
      : primaryColor === "#111827" &&
          backgroundColor === "#f8fafc" &&
          surfaceColor === "#ffffff" &&
          textColor === "#0f172a" &&
          borderColor === "#d1d5db"
        ? "minimal-light"
        : primaryColor === "#f59e0b" &&
            backgroundColor === "#1c1917" &&
            surfaceColor === "#292524" &&
            textColor === "#fef3c7" &&
            borderColor === "#57534e"
          ? "warm-bistro"
          : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{templatesLabels.styleTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canUseAllTemplates ? (
          <p className="text-sm text-muted-foreground">{templatesLabels.freePlanNotice}</p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
            <p className="text-sm font-medium">{templatesLabels.baseStructureTitle}</p>
            <p className="text-xs text-muted-foreground">{templatesLabels.formatDescription}</p>
            <div className="inline-flex flex-wrap items-center gap-2">
              {(["classic", "modern", "grid"] as const).map((templateId) => (
                <form key={templateId} action={updateTemplateAction}>
                  <input type="hidden" name="templateId" value={templateId} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className={
                      currentTemplate === templateId
                        ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
                        : undefined
                    }
                    disabled={
                      currentTemplate === templateId || (!canUseAllTemplates && templateId !== "classic")
                    }
                  >
                    {templateId[0].toUpperCase() + templateId.slice(1)}
                  </Button>
                </form>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
            <p className="text-sm font-medium">{templatesLabels.presetsTitle}</p>
            <p className="text-xs text-muted-foreground">{templatesLabels.stylePresetsHint}</p>
            <MenuStylePresetPicker
              initialActivePresetId={activePresetId}
            />
          </div>
        </div>
        <form action={updateTemplateStylesAction} className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{templatesLabels.visualDetailsTitle}</p>
            <p className="text-xs text-muted-foreground">{templatesLabels.visualDetailsDescription}</p>
          </div>
          <ThemeControls
            templateId={currentTemplate}
            initialFontFamily={fontFamily}
            initialDensity={density}
            initialValues={{
              primaryColor,
              backgroundColor,
              surfaceColor,
              textColor,
              borderColor,
            }}
            labels={themeControlsLabels}
            hints={{
              stylePresets: templatesLabels.stylePresetsHint,
              colorControls: templatesLabels.colorControlsHint,
            }}
            formLabels={{
              fontFamily: templatesLabels.fontFamily,
              density: templatesLabels.layoutDensity,
              densityComfortable: templatesLabels.densityComfortable,
              densityCompact: templatesLabels.densityCompact,
            }}
            sectionLabels={{
              baseStructure: templatesLabels.baseStructureTitle,
              presets: templatesLabels.presetsTitle,
            }}
            showPresetControls={false}
          />
          <div className="md:col-span-2">
            <Button type="submit">{templatesLabels.saveStyles}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MenuStyleMobilePreviewPanel(opts: {
  templatesLabels: TemplatesLabels;
  data: MenuStylesLoaded;
}) {
  const { templatesLabels, data } = opts;
  const {
    rawTemplate: currentTemplate,
    previewTitle,
    previewLocale,
    enabledLocales,
    localizedCategories,
    previewTheme,
    canShowAllergens,
    defaultCurrency,
  } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{templatesLabels.mobilePreviewTab}</CardTitle>
        <p className="text-sm text-muted-foreground">{templatesLabels.mobilePreviewDescription}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="mx-auto w-full max-w-[420px] rounded-[2rem] border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
          <div className="mx-auto mb-2 h-5 w-28 rounded-full bg-zinc-700" />
          <div className="h-[720px] overflow-y-auto rounded-[1.5rem] border border-zinc-800 bg-black p-2">
            {currentTemplate === "modern" ? (
              <ModernTemplate
                title={previewTitle}
                categories={localizedCategories}
                locale={previewLocale}
                locales={enabledLocales}
                theme={previewTheme}
                canShowAllergens={canShowAllergens}
                initialCurrency={defaultCurrency}
              />
            ) : currentTemplate === "grid" ? (
              <GridTemplate
                title={previewTitle}
                categories={localizedCategories}
                locale={previewLocale}
                locales={enabledLocales}
                theme={previewTheme}
                canShowAllergens={canShowAllergens}
                initialCurrency={defaultCurrency}
              />
            ) : (
              <ClassicTemplate
                title={previewTitle}
                categories={localizedCategories}
                locale={previewLocale}
                locales={enabledLocales}
                theme={previewTheme}
                canShowAllergens={canShowAllergens}
                initialCurrency={defaultCurrency}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
