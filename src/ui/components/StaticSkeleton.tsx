type StaticSkeletonProps = { label?: string; rows?: number };

export function StaticSkeleton({
  label = "Preparing private camera analysis",
  rows = 3,
}: StaticSkeletonProps) {
  return (
    <section className="static-skeleton" aria-label={label} role="status">
      <p>{label}</p>
      <div className="skeleton-blocks" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <span className="skeleton-block" key={index} />
        ))}
      </div>
    </section>
  );
}
