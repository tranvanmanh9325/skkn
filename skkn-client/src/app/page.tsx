// Trang gốc "/" không có nội dung riêng — redirect thẳng đến /login.
// Dùng next/navigation redirect (server-side) thay vì client-side useRouter
// để tránh flash nội dung trống và đảm bảo SEO không index trang rỗng.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
