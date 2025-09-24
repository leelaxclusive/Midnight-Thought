import { createUploadthing } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions)

      if (!session) throw new Error("Unauthorized")

      return { userId: session.user.email }
    })
    .onUploadComplete(async ({ metadata, file }) => {

      return { uploadedBy: metadata.userId, url: file.url }
    }),

  cover: f({ image: { maxFileSize: "8MB" } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions)

      if (!session) throw new Error("Unauthorized")

      return { userId: session.user.email }
    })
    .onUploadComplete(async ({ metadata, file }) => {

      return { uploadedBy: metadata.userId, url: file.url }
    }),
}