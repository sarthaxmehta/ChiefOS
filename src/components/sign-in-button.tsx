import { signIn } from "@/auth"

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    >
      <button 
        type="submit"
        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Sign in with Google
      </button>
    </form>
  )
}
