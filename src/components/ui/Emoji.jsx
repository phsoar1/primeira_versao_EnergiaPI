import { useState } from "react";
import twemoji from "@twemoji/api";
import { normalizarEmojiVisual } from "../../utils/formatters";

const TWEMOJI_BASE_URL =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/72x72";

export default function Emoji({ children, className = "" }) {
  const emoji = normalizarEmojiVisual(children);
  const codePoint = emoji ? twemoji.convert.toCodePoint(emoji) : "";
  const [codePointFalhou, setCodePointFalhou] = useState("");
  const imagemFalhou = codePointFalhou === codePoint;

  if (!codePoint || imagemFalhou) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none ${className}`.trim()}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={`${TWEMOJI_BASE_URL}/${codePoint}.png`}
      alt={emoji}
      draggable="false"
      loading="lazy"
      onError={() => setCodePointFalhou(codePoint)}
      className={`twemoji ${className}`.trim()}
    />
  );
}
