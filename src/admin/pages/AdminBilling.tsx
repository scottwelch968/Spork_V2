import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import {
  SubscriptionTiersTab,
  UserSubscriptionsTab,
  PaymentProcessorsTab,
  DiscountCodesTab,
  CreditPackagesTab,
} from '@/admin/components/billing';
import { CreditCard } from 'lucide-react';

export default function AdminBilling() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Billing & Subscriptions</h1>
          <p className="text-sm text-admin-text-muted">Manage pricing tiers, subscriptions and payments</p>
        </div>
      </div>

      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="tiers" className="data-[state=active]:bg-admin-bg text-admin-text">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-admin-bg text-admin-text">User Subscriptions</TabsTrigger>
          <TabsTrigger value="processors" className="data-[state=active]:bg-admin-bg text-admin-text">Payment Processors</TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-admin-bg text-admin-text">Discount Codes</TabsTrigger>
          <TabsTrigger value="packages" className="data-[state=active]:bg-admin-bg text-admin-text">Credit Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers">
          <SubscriptionTiersTab />
        </TabsContent>

        <TabsContent value="subscriptions">
          <UserSubscriptionsTab />
        </TabsContent>

        <TabsContent value="processors">
          <PaymentProcessorsTab />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountCodesTab />
        </TabsContent>

        <TabsContent value="packages">
          <CreditPackagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
