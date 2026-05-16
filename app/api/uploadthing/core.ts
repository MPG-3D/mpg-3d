import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
  }).onUploadComplete(async ({ file }) => {
    console.log("Image upload complete", file)
  }),

  modelUploader: f({
    blob: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log("3D Model upload complete", file)
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
