import { toast } from "sonner"

export const useToast = () => {
  return {
    toast: (options: {
      title?: string
      description?: string
      variant?: "default" | "destructive"
    }) => {
      if (options.variant === "destructive") {
        toast.error(options.title || "Error", {
          description: options.description,
        })
      } else {
        toast.success(options.title || "Success", {
          description: options.description,
        })
      }
    },
  }
}