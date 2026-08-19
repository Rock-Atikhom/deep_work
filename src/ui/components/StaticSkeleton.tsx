type StaticSkeletonProps = { label?: string };

export function StaticSkeleton({
  label = "Preparing private camera analysis",
}: StaticSkeletonProps) {
  return (
    <section className="preparation-status" aria-label={label} role="status">
      <p>{label}</p>
    </section>
  );
}
