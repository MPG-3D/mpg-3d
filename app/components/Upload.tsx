"use client"

import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export default function Upload() {
  return (
    <div className="w-full">
      <UploadButton<OurFileRouter, "imageUploader">
        endpoint="imageUploader"
        onClientUploadComplete={() => {
          alert("Upload erfolgreich!")
        }}
        onUploadError={(error: Error) => {
          alert(error.message)
        }}
        appearance={{
          button: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl",
        }}
      />
    </div>
  )
}