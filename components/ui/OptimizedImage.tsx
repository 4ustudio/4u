import Image from "next/image";

type OptimizedImageProps = {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fallback?: React.ReactNode;
};

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority = false,
  sizes,
  fallback,
}: OptimizedImageProps) {
  if (!src) {
    return fallback ?? null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes ?? (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
      loading={priority ? undefined : "lazy"}
    />
  );
}
