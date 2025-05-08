import React from 'react'

export default function Avatar({ src }: { src: string }) {
  return (
    <img
      src={src}
      className="avatar"
      alt="User avatar"
    />
  )
}