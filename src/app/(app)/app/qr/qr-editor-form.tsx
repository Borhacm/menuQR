"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveQrDesignAction } from "@/lib/admin/qr-actions";
import { qrLogoPresets } from "@/config/qr-logo-presets";

type QrEditorFormProps = {
  canBrandQr: boolean;
  resourceId: string;
  designId?: string;
  initial: {
    dotsColor: string;
    bgColor: string;
    dotStyle: string;
    cornerStyle: string;
    logoUrl: string;
    logoColor: string;
  };
  labels: {
    dotsColor: string;
    backgroundColor: string;
    dotStyle: string;
    dotStyleSquare: string;
    dotStyleRounded: string;
    dotStyleDots: string;
    dotStyleHeart: string;
    cornerStyle: string;
    cornerStyleSquare: string;
    cornerStyleRounded: string;
    cornerStyleDot: string;
    cornerStyleHeart: string;
    icon: string;
    iconPresets: string;
    iconColor: string;
    noIcon: string;
    uploadIcon: string;
    iconUploadHelp: string;
    qrPaidOnly: string;
    saveDesign: string;
    exportPng: string;
    exportSvg: string;
    exportPdf: string;
    preview: string;
  };
};

export function QrEditorForm({ canBrandQr, resourceId, designId, initial, labels }: QrEditorFormProps) {
  const [dotsColor, setDotsColor] = useState(initial.dotsColor);
  const [bgColor, setBgColor] = useState(initial.bgColor);
  const [dotStyle, setDotStyle] = useState(initial.dotStyle);
  const [cornerStyle, setCornerStyle] = useState(initial.cornerStyle);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [logoColor, setLogoColor] = useState(initial.logoColor);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const autoSaveButtonRef = useRef<HTMLButtonElement | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!canBrandQr) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      formRef.current?.requestSubmit(autoSaveButtonRef.current ?? undefined);
    }, 500);
    return () => clearTimeout(timeout);
  }, [bgColor, canBrandQr, cornerStyle, dotStyle, dotsColor, logoColor, logoUrl]);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({
      resourceId,
      format: "png",
      dotsColor,
      bgColor,
      logoUrl,
      logoColor,
      dotStyle,
      cornerStyle,
    });
    return `/api/qr/export?${params.toString()}`;
  }, [bgColor, cornerStyle, dotStyle, dotsColor, logoColor, logoUrl, resourceId]);

  const exportBase = useMemo(() => {
    const params = new URLSearchParams({ resourceId });
    if (designId) params.set("designId", designId);
    return `/api/qr/export?${params.toString()}`;
  }, [designId, resourceId]);

  const cornerOptions = [
    { value: "square", label: labels.cornerStyleSquare, glyph: "■" },
    { value: "rounded", label: labels.cornerStyleRounded, glyph: "▢" },
    { value: "dot", label: labels.cornerStyleDot, glyph: "◉" },
    { value: "heart", label: labels.cornerStyleHeart, glyph: "❤" },
  ];

  const dotOptions = [
    { value: "square", label: labels.dotStyleSquare, glyph: "⋮⋮" },
    { value: "rounded", label: labels.dotStyleRounded, glyph: "••" },
    { value: "dots", label: labels.dotStyleDots, glyph: "⋯" },
    { value: "heart", label: labels.dotStyleHeart, glyph: "❤" },
  ];

  async function onPickLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", "qr-logo");
      const res = await fetch("/api/uploads", { method: "POST", body });
      if (!res.ok) return;
      const data = (await res.json()) as { url?: string };
      if (data.url) setLogoUrl(data.url);
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <form id="qr-editor-form" ref={formRef} action={saveQrDesignAction} className="space-y-4">
        <input type="hidden" name="designId" value={designId ?? ""} />
        <button
          ref={autoSaveButtonRef}
          type="submit"
          name="saveMode"
          value="update"
          className="hidden"
          title="Auto save"
          aria-label="Auto save"
          aria-hidden
          tabIndex={-1}
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{labels.cornerStyle}</Label>
            <input type="hidden" name="cornerStyle" value={cornerStyle} />
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-4">
              {cornerOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCornerStyle(option.value)}
                  disabled={!canBrandQr}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    cornerStyle === option.value
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="mr-1">{option.glyph}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{labels.dotStyle}</Label>
            <input type="hidden" name="dotStyle" value={dotStyle} />
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-4">
              {dotOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDotStyle(option.value)}
                  disabled={!canBrandQr}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    dotStyle === option.value
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="mr-1">{option.glyph}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
              <div className="space-y-1.5">
                <Label>{labels.dotsColor}</Label>
                <Input
                  name="dotsColor"
                  type="color"
                  className="h-9 w-full"
                  value={dotsColor}
                  onChange={(event) => setDotsColor(event.target.value)}
                  disabled={!canBrandQr}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{labels.backgroundColor}</Label>
                <Input
                  name="bgColor"
                  type="color"
                  className="h-9 w-full"
                  value={bgColor}
                  onChange={(event) => setBgColor(event.target.value)}
                  disabled={!canBrandQr}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{labels.iconColor}</Label>
                <Input
                  name="logoColorPicker"
                  type="color"
                  className="h-9 w-full"
                  value={logoColor}
                  onChange={(event) => setLogoColor(event.target.value)}
                  disabled={!canBrandQr}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{labels.icon}</Label>
                {logoUrl ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => setLogoUrl("")}
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
              <input type="hidden" name="logoUrl" value={logoUrl} />
              <input type="hidden" name="logoColor" value={logoColor} />
              <div className="grid grid-cols-4 gap-2 rounded-lg border p-2">
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className={`rounded-md border p-1 text-xs transition ${
                    !logoUrl ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {labels.noIcon}
                </button>
                {qrLogoPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    onClick={() => setLogoUrl(preset.url)}
                    className={`rounded-md border p-1 transition ${
                      logoUrl === preset.url
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="rounded bg-white p-1">
                      <Image
                        src={preset.url}
                        alt={preset.label}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                aria-label={labels.uploadIcon}
                title={labels.uploadIcon}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onPickLogo}
                disabled={!canBrandQr}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => logoInputRef.current?.click()}
                disabled={!canBrandQr || uploadingLogo}
              >
                {uploadingLogo ? "..." : labels.uploadIcon}
              </Button>
              <p className="text-xs text-muted-foreground">{labels.iconUploadHelp}</p>
            </div>
          </div>
        </div>
        {!canBrandQr ? <p className="text-xs text-muted-foreground">{labels.qrPaidOnly}</p> : null}
      </form>

      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4">
          <Image
            src={previewSrc}
            alt="QR preview"
            width={512}
            height={512}
            unoptimized
            className="mx-auto w-full max-w-sm rounded-lg border bg-white p-3"
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`${exportBase}&format=png`}>{labels.exportPng}</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`${exportBase}&format=svg`}>{labels.exportSvg}</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`${exportBase}&format=pdf`}>{labels.exportPdf}</a>
            </Button>
          </div>
          <Button
            type="submit"
            form="qr-editor-form"
            name="saveMode"
            value="create"
            disabled={!canBrandQr}
          >
            {labels.saveDesign}
          </Button>
        </div>
      </div>
    </div>
  );
}
