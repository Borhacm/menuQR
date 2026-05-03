import { redirect } from "next/navigation";
import { appHref } from "@/lib/routes";

export default async function QrPage() {
  redirect(appHref("items", { tab: "qr" }));
}
