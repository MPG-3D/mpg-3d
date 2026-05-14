"use client"

import { UploadButton } from "@/app/utils/uploadthing"

export default function Upload() {
  return (
    <div className="w-full">

      <UploadButton
        endpoint="imageUploader"

        onClientUploadComplete={() => {
          alert("Upload erfolgreich!")
        }}

        onUploadError={(error: Error) => {
          alert(error.message)
        }}

        appearance={{
          button:
            "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl",
        }}
      />

    </div>
  )
}