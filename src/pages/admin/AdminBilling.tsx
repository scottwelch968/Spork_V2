import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SubscriptionTiersTab,
  UserSubscriptionsTab,
  PaymentProcessorsTab,
  DiscountCodesTab,
  CreditPackagesTab,
} from '@/admin/components/billing';

export default function AdminBilling() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="tiers" className="data-[state=active]:bg-background text-foreground">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-background text-foreground">User Subscriptions</TabsTrigger>
          <TabsTrigger value="processors" className="data-[state=active]:bg-background text-foreground">Payment Processors</TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-background text-foreground">Discount Codes</TabsTrigger>
          <TabsTrigger value="packages" className="data-[state=active]:bg-background text-foreground">Credit Packages</TabsTrigger>
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
