interface FxAvatarProps {
  name: string
  size?: number
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * FxAvatar — isimden baş harf üreten avatar.
 */
export function FxAvatar({ name, size = 36 }: FxAvatarProps) {
  return (
    <span
      className="fx-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
