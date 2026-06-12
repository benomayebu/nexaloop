'use client';

import { useRouter } from 'next/navigation';

// Table row that navigates on click anywhere, while still letting
// inner links/buttons handle their own clicks (they stop propagation
// implicitly because we ignore clicks on interactive elements).
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    // Let real links, buttons, and form controls do their own thing
    if (target.closest('a, button, input, select, textarea, label')) return;
    router.push(href);
  }

  return (
    <tr onClick={handleClick} className={`cursor-pointer ${className ?? ''}`}>
      {children}
    </tr>
  );
}
