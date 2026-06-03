import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Incart Billing — Smarter Billing. Faster Revenue.",
  description: "All-in-one medical billing and revenue cycle management platform.",
};

// This stays a SERVER component — metadata works here
// AuthProvider is imported but wraps children only
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
