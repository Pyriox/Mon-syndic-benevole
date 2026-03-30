import Link from 'next/link';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  prevHref: string;
  nextHref: string;
};

export default function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  prevHref,
  nextHref,
}: Props) {
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
      <p>
        {firstItem}-{lastItem} sur {totalItems} · page {currentPage}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link href={prevHref} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
            Precedent
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Precedent</span>
        )}
        {currentPage < totalPages ? (
          <Link href={nextHref} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
            Suivant
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Suivant</span>
        )}
      </div>
    </div>
  );
}
