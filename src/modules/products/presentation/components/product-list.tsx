"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Package } from "lucide-react";
import type { Product } from "../../domain/entities/product";
import type { PaginationMetadataDto } from "../dtos/product.dto";
import { EditProductDialog } from "./product-edit-dialog";
import { ProductDeleteDialog } from "./product-delete-dialog";
import { useProducts } from "../queries/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/presentation/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/presentation/components/ui/pagination";

interface ProductListProps {
  productsData: {
    data: Product[];
    metadata: PaginationMetadataDto;
  };
  onSuccess?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "value" in error) {
    const errorValue = (error as { value?: unknown }).value;
    if (
      errorValue &&
      typeof errorValue === "object" &&
      "error" in errorValue &&
      typeof (errorValue as { error?: unknown }).error === "string"
    ) {
      return (errorValue as { error: string }).error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to load products.";
}

export function ProductList({ productsData, onSuccess }: ProductListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = searchParams.get("search") ?? undefined;

  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");

  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  const {
    data: responseData,
    isLoading,
    isError,
    error,
  } = useProducts({ search, page, limit }, productsData);

  const activeProducts = responseData?.data ?? [];
  const metadata = responseData?.metadata;

  if (isError) {
    return (
      <div className="rounded-md border p-4 text-sm text-destructive">
        {getErrorMessage(error)}
      </div>
    );
  }

  if (isLoading && activeProducts.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (activeProducts.length === 0) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Name
                </div>
              </TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <EditProductDialog
                      product={product}
                      onSuccess={onSuccess}
                    />
                    <ProductDeleteDialog
                      product={product}
                      onSuccess={onSuccess}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {metadata && metadata.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (metadata.currentPage > 1) {
                    handlePageChange(metadata.currentPage - 1);
                  }
                }}
                className={
                  metadata.currentPage <= 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm font-medium">
                Page {metadata.currentPage} of {metadata.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (metadata.currentPage < metadata.totalPages) {
                    handlePageChange(metadata.currentPage + 1);
                  }
                }}
                className={
                  metadata.currentPage >= metadata.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
