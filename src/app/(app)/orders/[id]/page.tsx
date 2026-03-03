import { notFound } from "next/navigation";
import { getOrderDetail } from "@/modules/orders/presentation/actions/order.actions";
import { OrderDetail } from "@/modules/orders/presentation/components/order-detail";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await getOrderDetail({ orderId: id });

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <OrderDetail order={order} />
    </div>
  );
}
