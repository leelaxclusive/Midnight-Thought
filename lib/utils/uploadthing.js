import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react"

export const UploadButton = generateUploadButton({
  url: "/api/uploadthing",
})

export const UploadDropzone = generateUploadDropzone({
  url: "/api/uploadthing",
})