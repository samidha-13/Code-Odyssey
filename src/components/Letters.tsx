/** Splits text into word-wrapped letter spans tagged `data-l` for per-letter choreography. */
export function Letters({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="w">
            {Array.from(w).map((ch, i) => (
              <span key={i} data-l="">
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}

/** Splits text into masked words tagged `data-l` (each word rises inside its own mask). */
export function MaskedWords({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="mask">
            <span data-l="" style={{ display: 'inline-block' }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}
