"use client";

import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/presentation/components/ui/card";
import { Separator } from "@/shared/presentation/components/ui/separator";
import type { OrderDetail } from "../../application/types";
import { OrderStatusStepper } from "./order-status-stepper";
import { OrderStatusActions } from "./order-status-actions";
import { OrderStatusHistory } from "./order-status-history";
import { isTerminalStatus } from "../../domain/types";

interface OrderDetailProps {
  order: OrderDetail;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/orders">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">
            Order ID: {order.id.slice(0, 8)}...
          </p>
        </div>
        <OrderStatusActions
          orderId={order.id}
          currentStatus={order.status}
          version={order.version}
        />
      </div>

      {/* Status Stepper / Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status</CardTitle>
          <CardDescription>
            {isTerminalStatus(order.status)
              ? "This order has reached a terminal state"
              : "Track the progress of this order through the fulfillment pipeline"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4">
            <OrderStatusStepper currentStatus={order.status} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "long",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.items.length} item(s)</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
              <CardDescription>
                Products and quantities included in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Product
                        </div>
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                        SKU
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                        Unit Price
                      </th>
                      <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50 last:border-b-0"
                      >
                        <td className="p-4 align-middle">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.productVariantId && (
                              <p className="text-sm text-muted-foreground">
                                Variant ID: {item.productVariantId.slice(0, 8)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle font-mono text-sm">
                          {item.sku}
                        </td>
                        <td className="p-4 align-middle text-right font-mono">
                          ${parseFloat(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-center">
                          {item.quantity}
                        </td>
                        <td className="p-4 align-middle text-right font-mono">
                          ${parseFloat(item.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={4}
                        className="h-12 px-4 text-right align-middle font-medium"
                      >
                        Total
                      </td>
                      <td className="h-12 px-4 text-right align-middle font-bold font-mono">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>
                Complete history of status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusHistory history={order.statusHistory} />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{order.createdByName}</p>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium">
                  {new Date(order.updatedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{order.version}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
