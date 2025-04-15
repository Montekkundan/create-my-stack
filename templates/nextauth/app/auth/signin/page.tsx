import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <Button
              onClick={() => signIn("github", { callbackUrl: "/" })}
              className="w-full"
              variant="outline"
            >
              Sign in with GitHub
            </Button>
            
            <Button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full"
              variant="outline"
            >
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
