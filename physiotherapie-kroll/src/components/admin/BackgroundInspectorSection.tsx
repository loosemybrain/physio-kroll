"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog"
import type { BackgroundSettings, SectionBackground, GradientDirection } from "@/types/cms"
import { Plus, Trash2 } from "lucide-react"
import { ColorField } from "@/components/admin/ColorField"

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ensureStops(stops: Array<{ color: string; pos: number }> | undefined) {
  const safe = (stops ?? [])
    .filter((s) => s && typeof s.color === "string" && typeof s.pos === "number")
    .map((s) => ({ color: s.color, pos: clamp(s.pos, 0, 100) }))
  if (safe.length >= 2) return safe.slice(0, 5)
  return [
    { color: "#0f172a", pos: 0 },
    { color: "#ffffff", pos: 100 },
  ]
}

const linearDirections: Array<{ value: GradientDirection; label: string }> = [
  { value: "to top", label: "Nach oben" },
  { value: "to right", label: "Nach rechts" },
  { value: "to bottom", label: "Nach unten" },
  { value: "to left", label: "Nach links" },
  { value: "to top right", label: "Nach oben rechts" },
  { value: "to top left", label: "Nach oben links" },
  { value: "to bottom right", label: "Nach unten rechts" },
  { value: "to bottom left", label: "Nach unten links" },
]

export function BackgroundInspectorSection(props: {
  background: SectionBackground | undefined
  onChange: (next: SectionBackground) => void
}) {
  const bg: SectionBackground = props.background ?? { type: "none" }

  const supportsParallax = bg.type === "image" || bg.type === "video"

  const [imagePickerOpen, setImagePickerOpen] = React.useState(false)
  const [videoPickerOpen, setVideoPickerOpen] = React.useState(false)
  const [posterPickerOpen, setPosterPickerOpen] = React.useState(false)

  const [pickedUrls, setPickedUrls] = React.useState<Record<string, string>>({})

  // Keep preview thumbnails in sync when mediaId/posterMediaId gets cleared externally
  React.useEffect(() => {
    if (bg.type !== "image" || !bg.image?.mediaId) {
      setPickedUrls((p) => (p.image ? { ...p, image: "" } : p))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.type, bg.type === "image" ? bg.image?.mediaId : null])

  React.useEffect(() => {
    if (bg.type !== "video" || !bg.video?.mediaId) {
      setPickedUrls((p) => (p.video ? { ...p, video: "" } : p))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.type, bg.type === "video" ? bg.video?.mediaId : null])

  React.useEffect(() => {
    if (bg.type !== "video" || !bg.video?.posterMediaId) {
      setPickedUrls((p) => (p.poster ? { ...p, poster: "" } : p))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.type, bg.type === "video" ? bg.video?.posterMediaId : null])

  const setType = (type: SectionBackground["type"]) => {
    // Keep existing nested config; renderer will handle missing pieces robustly.
    props.onChange({ ...bg, type })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Hintergrund</Label>
      </div>

      <Separator />

      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-xs">Typ</Label>
        <Select value={bg.type} onValueChange={(v) => setType(v as BackgroundSettings["type"])}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="none" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keiner</SelectItem>
            <SelectItem value="color">Farbe</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Bild</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parallax */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Parallax</Label>
          <Switch
            checked={supportsParallax ? !!bg.parallax : false}
            disabled={!supportsParallax}
            onCheckedChange={(checked) => {
              if (!supportsParallax) return
              props.onChange({ ...bg, parallax: checked })
            }}
          />
        </div>

        {/* Parallax Strength Slider */}
        {supportsParallax && bg.parallax && (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Stärke</Label>
              <span className="text-xs font-medium">{(bg.parallaxStrength ?? 1.0).toFixed(1)}x</span>
            </div>
            <Slider
              value={[bg.parallaxStrength ?? 1.0]}
              onValueChange={([value]) => {
                props.onChange({ ...bg, parallaxStrength: value })
              }}
              min={0.5}
              max={2.0}
              step={0.1}
              className="h-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      {bg.type === "color" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Farbe (Hex/RGBA)</Label>
            <ColorField
              value={bg.color?.value ?? "#ffffff"}
              onChange={(next) =>
                props.onChange({
                  ...bg,
                  color: { ...(bg.color ?? {}), value: next },
                })
              }
              placeholder="#ffffff oder rgba(0,0,0,0.5)"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Overlay aktiv</Label>
            <Switch
              checked={!!bg.color?.overlay}
              onCheckedChange={(checked) => {
                if (checked) {
                  props.onChange({
                    ...bg,
                    color: {
                      value: bg.color?.value ?? "#ffffff",
                      overlay: { value: "#000000", opacity: 30 },
                    },
                  })
                } else {
                  props.onChange({
                    ...bg,
                    color: { value: bg.color?.value ?? "#ffffff" },
                  })
                }
              }}
            />
          </div>

          {bg.color?.overlay && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Farbe</Label>
                <ColorField
                  value={bg.color.overlay.value}
                  onChange={(next) =>
                    props.onChange({
                      ...bg,
                      color: {
                        value: bg.color?.value ?? "#ffffff",
                        overlay: { ...bg.color!.overlay!, value: next },
                      },
                    })
                  }
                  placeholder="#000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Opacity ({bg.color.overlay.opacity}%)</Label>
                <Slider
                  value={[clamp(bg.color.overlay.opacity, 0, 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    props.onChange({
                      ...bg,
                      color: {
                        value: bg.color?.value ?? "#ffffff",
                        overlay: { ...bg.color!.overlay!, opacity: v[0] ?? 0 },
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gradient */}
      {bg.type === "gradient" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Gradient-Art</Label>
            <Select
              value={bg.gradient?.kind ?? "linear"}
              onValueChange={(v) =>
                props.onChange({
                  ...bg,
                  gradient: {
                    kind: v as BackgroundSettings["gradient"] extends infer G
                      ? G extends { kind: infer K }
                        ? K & string
                        : never
                      : never,
                    direction: bg.gradient?.direction,
                    stops: ensureStops(bg.gradient?.stops),
                  } as any,
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic (alle Richtungen)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(bg.gradient?.kind ?? "linear") === "linear" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Richtung</Label>
              <Select
                value={bg.gradient?.direction ?? "to bottom"}
                onValueChange={(v) =>
                  props.onChange({
                    ...bg,
                    gradient: {
                      kind: "linear",
                      direction: v as GradientDirection,
                      stops: ensureStops(bg.gradient?.stops),
                    },
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linearDirections.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Stops</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={ensureStops(bg.gradient?.stops).length >= 5}
                onClick={() => {
                  const stops = ensureStops(bg.gradient?.stops)
                  if (stops.length >= 5) return
                  const next = [...stops, { color: "#ffffff", pos: clamp((stops[stops.length - 1]?.pos ?? 80) + 5, 0, 100) }]
                  props.onChange({
                    ...bg,
                    gradient: {
                      kind: bg.gradient?.kind ?? "linear",
                      direction: bg.gradient?.direction,
                      stops: next,
                    },
                  })
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Stop
              </Button>
            </div>

            {ensureStops(bg.gradient?.stops).map((stop, idx) => (
              <div key={idx} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Stop {idx + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    disabled={ensureStops(bg.gradient?.stops).length <= 2}
                    onClick={() => {
                      const stops = ensureStops(bg.gradient?.stops)
                      if (stops.length <= 2) return
                      const next = stops.filter((_, i) => i !== idx)
                      props.onChange({
                        ...bg,
                        gradient: {
                          kind: bg.gradient?.kind ?? "linear",
                          direction: bg.gradient?.direction,
                          stops: next,
                        },
                      })
                    }}
                    title="Stop entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Farbe</Label>
                    <ColorField
                      value={stop.color}
                      onChange={(next) => {
                        const stops = ensureStops(bg.gradient?.stops)
                        stops[idx] = { ...stops[idx], color: next }
                        props.onChange({
                          ...bg,
                          gradient: {
                            kind: bg.gradient?.kind ?? "linear",
                            direction: bg.gradient?.direction,
                            stops,
                          },
                        })
                      }}
                      placeholder="#ff0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Position ({stop.pos}%)</Label>
                    <Slider
                      value={[stop.pos]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => {
                        const stops = ensureStops(bg.gradient?.stops)
                        stops[idx] = { ...stops[idx], pos: v[0] ?? 0 }
                        props.onChange({
                          ...bg,
                          gradient: {
                            kind: bg.gradient?.kind ?? "linear",
                            direction: bg.gradient?.direction,
                            stops,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image */}
      {bg.type === "image" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Bild (Media)</Label>
            <div className="flex gap-2">
              <Input className="h-8 text-sm" value={bg.image?.mediaId ?? ""} placeholder="mediaId" readOnly />
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setImagePickerOpen(true)}>
                Aus Medien
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setPickedUrls((p) => ({ ...p, image: "" }))
                  props.onChange({
                    ...bg,
                    image: {
                      ...(bg.image ?? { fit: "cover", position: "center" }),
                      mediaId: null,
                      fit: bg.image?.fit ?? "cover",
                      position: bg.image?.position ?? "center",
                    },
                  })
                }}
              >
                Entfernen
              </Button>
            </div>
            {pickedUrls.image && (
              <div className="mt-2 rounded-md border border-border overflow-hidden">
                <img src={pickedUrls.image} alt="Background preview" className="w-full h-28 object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Fit</Label>
              <Select
                value={bg.image?.fit ?? "cover"}
                onValueChange={(v) =>
                  props.onChange({
                    ...bg,
                    image: {
                      mediaId: bg.image?.mediaId ?? null,
                      fit: v as "cover" | "contain",
                      position: bg.image?.position ?? "center",
                      overlay: bg.image?.overlay,
                      blur: bg.image?.blur,
                    },
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Position</Label>
              <Select
                value={bg.image?.position ?? "center"}
                onValueChange={(v) =>
                  props.onChange({
                    ...bg,
                    image: {
                      mediaId: bg.image?.mediaId ?? null,
                      fit: bg.image?.fit ?? "cover",
                      position: v as any,
                      overlay: bg.image?.overlay,
                      blur: bg.image?.blur,
                    },
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Blur ({clamp(bg.image?.blur ?? 0, 0, 20)})</Label>
            <Slider
              value={[clamp(bg.image?.blur ?? 0, 0, 20)]}
              min={0}
              max={20}
              step={1}
              onValueChange={(v) =>
                props.onChange({
                  ...bg,
                  image: {
                    mediaId: bg.image?.mediaId ?? null,
                    fit: bg.image?.fit ?? "cover",
                    position: bg.image?.position ?? "center",
                    overlay: bg.image?.overlay,
                    blur: v[0] ?? 0,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Overlay aktiv</Label>
            <Switch
              checked={!!bg.image?.overlay}
              onCheckedChange={(checked) => {
                if (checked) {
                  props.onChange({
                    ...bg,
                    image: {
                      mediaId: bg.image?.mediaId ?? null,
                      fit: bg.image?.fit ?? "cover",
                      position: bg.image?.position ?? "center",
                      blur: bg.image?.blur,
                      overlay: { value: "#000000", opacity: 30 },
                    },
                  })
                } else {
                  props.onChange({
                    ...bg,
                    image: {
                      mediaId: bg.image?.mediaId ?? null,
                      fit: bg.image?.fit ?? "cover",
                      position: bg.image?.position ?? "center",
                      blur: bg.image?.blur,
                    },
                  })
                }
              }}
            />
          </div>

          {bg.image?.overlay && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Farbe</Label>
                <ColorField
                  value={bg.image.overlay.value}
                  onChange={(next) =>
                    props.onChange({
                      ...bg,
                      image: {
                        ...bg.image!,
                        overlay: { ...bg.image!.overlay!, value: next },
                      },
                    })
                  }
                  placeholder="#000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Opacity ({bg.image.overlay.opacity}%)</Label>
                <Slider
                  value={[clamp(bg.image.overlay.opacity, 0, 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    props.onChange({
                      ...bg,
                      image: {
                        ...bg.image!,
                        overlay: { ...bg.image!.overlay!, opacity: v[0] ?? 0 },
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          <MediaPickerDialog
            open={imagePickerOpen}
            onOpenChange={setImagePickerOpen}
            onPick={(url, mediaId) => {
              if (!mediaId) return
              setPickedUrls((p) => ({ ...p, image: url }))
              props.onChange({
                ...bg,
                image: {
                  mediaId,
                  fit: bg.image?.fit ?? "cover",
                  position: bg.image?.position ?? "center",
                  overlay: bg.image?.overlay,
                  blur: bg.image?.blur,
                },
              })
            }}
          />
        </div>
      )}

      {/* Video */}
      {bg.type === "video" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Video (Media)</Label>
            <div className="flex gap-2">
              <Input className="h-8 text-sm" value={bg.video?.mediaId ?? ""} placeholder="mediaId" readOnly />
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setVideoPickerOpen(true)}>
                Aus Medien
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setPickedUrls((p) => ({ ...p, video: "" }))
                  props.onChange({
                    ...bg,
                    video: { ...(bg.video ?? {}), mediaId: null },
                  })
                }}
              >
                Entfernen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Hinweis: Video läuft mit autoplay + loop + muted + playsInline.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Poster (optional)</Label>
            <div className="flex gap-2">
              <Input className="h-8 text-sm" value={bg.video?.posterMediaId ?? ""} placeholder="posterMediaId" readOnly />
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setPosterPickerOpen(true)}>
                Aus Medien
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setPickedUrls((p) => ({ ...p, poster: "" }))
                  props.onChange({
                    ...bg,
                    video: { mediaId: bg.video?.mediaId ?? null, ...(bg.video ?? {}), posterMediaId: null },
                  })
                }}
              >
                Entfernen
              </Button>
            </div>
            {pickedUrls.poster && (
              <div className="mt-2 rounded-md border border-border overflow-hidden">
                <img src={pickedUrls.poster} alt="Poster preview" className="w-full h-28 object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Overlay aktiv</Label>
            <Switch
              checked={!!bg.video?.overlay}
              onCheckedChange={(checked) => {
                if (checked) {
                  props.onChange({
                    ...bg,
                    video: {
                      mediaId: bg.video?.mediaId ?? null,
                      posterMediaId: bg.video?.posterMediaId ?? null,
                      overlay: { value: "#000000", opacity: 30 },
                    },
                  })
                } else {
                  props.onChange({
                    ...bg,
                    video: {
                      mediaId: bg.video?.mediaId ?? null,
                      posterMediaId: bg.video?.posterMediaId ?? null,
                    },
                  })
                }
              }}
            />
          </div>

          {bg.video?.overlay && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Farbe</Label>
                <ColorField
                  value={bg.video.overlay.value}
                  onChange={(next) =>
                    props.onChange({
                      ...bg,
                      video: {
                        ...bg.video!,
                        overlay: { ...bg.video!.overlay!, value: next },
                      },
                    })
                  }
                  placeholder="#000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay Opacity ({bg.video.overlay.opacity}%)</Label>
                <Slider
                  value={[clamp(bg.video.overlay.opacity, 0, 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    props.onChange({
                      ...bg,
                      video: {
                        ...bg.video!,
                        overlay: { ...bg.video!.overlay!, opacity: v[0] ?? 0 },
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          <MediaPickerDialog
            open={videoPickerOpen}
            onOpenChange={setVideoPickerOpen}
            onPick={(url, mediaId) => {
              if (!mediaId) return
              setPickedUrls((p) => ({ ...p, video: url }))
              props.onChange({
                ...bg,
                video: {
                  mediaId,
                  posterMediaId: bg.video?.posterMediaId ?? null,
                  overlay: bg.video?.overlay,
                },
              })
            }}
          />

          <MediaPickerDialog
            open={posterPickerOpen}
            onOpenChange={setPosterPickerOpen}
            onPick={(url, mediaId) => {
              if (!mediaId) return
              setPickedUrls((p) => ({ ...p, poster: url }))
              props.onChange({
                ...bg,
                video: {
                  mediaId: bg.video?.mediaId ?? null,
                  posterMediaId: mediaId,
                  overlay: bg.video?.overlay,
                },
              })
            }}
          />
        </div>
      )}
    </div>
  )
}

