const LOGO_URL = "/logo.png";

export default function BrandLogo({ size = 48, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="Logo EnergiaPI"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src =
          "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=150&q=80";
      }}
    />
  );
}
