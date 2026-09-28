export function FictionalDataNotice() {
  return (
    <div
      role="note"
      className="reveal rounded-2xl border border-orange/40 bg-orange-100/90 px-4 py-3.5 text-sm text-orange-800 shadow-soft"
    >
      <strong className="font-semibold">Note:</strong> the compounds and assay results in this demo are{" "}
      <strong className="font-semibold">fictional example data</strong> for development purposes. They are not real
      measurements and must not be used for research decisions.
    </div>
  );
}
