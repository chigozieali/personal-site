/**
 * Renders text where `**bold**` becomes a <b>. Keeps editable copy simple
 * without dragging in a markdown parser.
 */
export default function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <b key={i}>{part.slice(2, -2)}</b>
        ) : (
          part
        ),
      )}
    </>
  );
}
