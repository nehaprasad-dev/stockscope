import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center py-16">
      <SignUp fallbackRedirectUrl="/" />
    </div>
  );
}
