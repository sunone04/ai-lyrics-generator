'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { generateBreadcrumbs } from '@/lib/utils';

interface BreadcrumbsProps {
  customBreadcrumbs?: Array<{
    label: string;
    href: string;
    isLast?: boolean;
  }>;
}

export default function Breadcrumbs({ customBreadcrumbs }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  const breadcrumbs = customBreadcrumbs || generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            {index === 0 ? (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-700 flex items-center"
              >
                <HomeIcon className="h-4 w-4" />
                <span className="sr-only">{breadcrumb.label}</span>
              </Link>
            ) : breadcrumb.isLast ? (
              <span className="text-gray-900 font-medium">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-700"
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}