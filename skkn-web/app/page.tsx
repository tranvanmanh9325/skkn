import { redirect } from "next/navigation";

// Root route always sends visitors to the login page.
export default function RootPage() {
  redirect("/login");
}
