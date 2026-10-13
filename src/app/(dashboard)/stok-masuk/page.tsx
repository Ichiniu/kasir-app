import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StokMasukPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = typeof sp.page === "string" ? `&page=${encodeURIComponent(sp.page)}` : ""
  redirect(`/produk?tab=stok-masuk${page}`)
}
