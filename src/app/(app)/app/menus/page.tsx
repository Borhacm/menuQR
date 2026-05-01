import { redirect } from "next/navigation";

export default async function MenusPage() {
  redirect("/app/items");
}
