interface ImageWithAttributionProps {
  src: string;
  alt: string;
  attribution: string;
  caption?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}

export default function ImageWithAttribution({
  src,
  alt,
  attribution,
  caption,
  width,
  height,
  loading = 'lazy',
  className,
}: ImageWithAttributionProps) {
  return (
    <figure className={className}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
      />
      {caption && <figcaption>{caption}</figcaption>}
      <small className="image-attribution">{attribution}</small>
    </figure>
  );
}
