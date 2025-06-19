interface UserAvatarProps {
    src: string
    alt: string
    handle: string
  }
  
  export function UserAvatar({ src, alt }: UserAvatarProps) {
    return (
      <img
        src={src || "https://userpic.codeforces.org/no-avatar.jpg"}
        alt={alt}
        className="w-10 h-10 rounded-full border border-gray-200"
        onError={(e) => {
          e.currentTarget.src = "https://userpic.codeforces.org/no-avatar.jpg"
        }}
      />
    )
  }
  