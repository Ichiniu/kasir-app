export async function findPreviousSale<T extends { userId: string; cashRegisterId: string | null }>(
  lookup: () => Promise<T | null>,
  userId: string,
  registerId: string,
) {
  const previous = await lookup()
  if (previous && (previous.userId !== userId || previous.cashRegisterId !== registerId)) {
    throw new Error("ID permintaan transaksi sudah digunakan")
  }
  return previous
}
