import { cn } from "@/lib/utils";
import { brandAssets, type BrandKey } from "@/components/brand/brandAssets";

type Props = {
  brand: BrandKey;
  className?: string;
};

/**
 * Purely decorative background glows for the Hero.
 * Kept separate to keep HeroSection clean and CMS-ready.
 */
export function HeroDecoration({ brand, className }: Props) {
  const asset = brandAssets[brand].heroDecoration;

  return (
    <div
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    >
      <div className={asset.wrapperClassName}>
        {asset.glows.map((g, idx) => (
          <div key={idx} className={g.className} />
        ))}
      </div>
    </div>
  );
}

