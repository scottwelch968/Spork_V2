import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { MessageSquare, Image, Video, FileText, CreditCard, ArrowUpRight, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { useCreditPackages } from '@/hooks/useCreditPackages';
import { useUserCredits } from '@/hooks/useUserCredits';
import { UsageDashboard } from '@/components/billing/UsageDashboard';
import { useBillingData } from '@/hooks/useBillingData';

export default function Billing() {
  const [discountCode, setDiscountCode] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { packages } = useCreditPackages();
  const { credits, isSuperUser, formatCredits, purchaseCredits } = useUserCredits();
  
  const {
    subscription,
    usage,
    creditPurchases,
    availableTiers,
    cancelSubscription,
    isCancelling,
    refetch,
    isLoading,
  } = useBillingData();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getUsagePercentage = (used: number, quota: number | null) => {
    if (!quota) return 0;
    return Math.min((used / quota) * 100, 100);
  };

  const handlePurchaseCredits = async (packageId: string) => {
    await purchaseCredits(packageId, discountCode || undefined);
    setDiscountCode('');
    refetch();
  };

  const handleCancelSubscription = () => {
    cancelSubscription();
    setShowCancelDialog(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Details</TabsTrigger>
            <TabsTrigger value="credits">Buy Credits</TabsTrigger>
            <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>
                      {subscription?.is_trial ? 'Trial Period' : 'Active Subscription'}
                    </CardDescription>
                  </div>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'} className="capitalize text-lg px-4 py-2">
                    {subscription?.subscription_tiers.name || 'Free'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Type</p>
                    <p className="text-lg font-semibold capitalize">{subscription?.subscription_tiers.tier_type || 'Trial'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Cost</p>
                    <p className="text-lg font-semibold">
                      ${subscription?.subscription_tiers.monthly_price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.is_trial ? 'Trial Ends' : 'Next Billing'}
                    </p>
                    <p className="text-lg font-semibold">
                      {subscription?.is_trial && subscription.trial_ends_at
                        ? format(new Date(subscription.trial_ends_at), 'MMM dd, yyyy')
                        : subscription?.current_period_end
                        ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Cancel Membership Button */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full sm:w-auto"
                    disabled={!subscription || subscription.status === 'cancelled' || subscription.subscription_tiers?.tier_type !== 'paid'}
                  >
                    Cancel Membership
                  </Button>
                  {(!subscription || subscription.subscription_tiers?.tier_type !== 'paid') && subscription?.status !== 'cancelled' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Only available for paid subscriptions
                    </p>
                  )}
                  {subscription?.status === 'cancelled' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Your subscription has already been cancelled
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Credit Balances - Show for super users or users with credits */}
            {(isSuperUser || credits.token_credits_remaining !== null && credits.token_credits_remaining > 0 || credits.image_credits_remaining !== null && credits.image_credits_remaining > 0 || credits.video_credits_remaining !== null && credits.video_credits_remaining > 0) && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <CardTitle>{isSuperUser ? 'Super User Status' : 'Extra Credits Available'}</CardTitle>
                  </div>
                  <CardDescription>{isSuperUser ? 'Unlimited access to all features' : 'Your purchased credits balance'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {(isSuperUser || (credits.token_credits_remaining !== null && credits.token_credits_remaining > 0)) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Token Credits</p>
                        <p className="text-2xl font-bold">{formatCredits(credits.token_credits_remaining)}</p>
                      </div>
                    )}
                    {(isSuperUser || (credits.image_credits_remaining !== null && credits.image_credits_remaining > 0)) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Image Credits</p>
                        <p className="text-2xl font-bold">{formatCredits(credits.image_credits_remaining)}</p>
                      </div>
                    )}
                    {(isSuperUser || (credits.video_credits_remaining !== null && credits.video_credits_remaining > 0)) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Video Credits</p>
                        <p className="text-2xl font-bold">{formatCredits(credits.video_credits_remaining)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Usage Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm">Chat Tokens</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {((usage?.tokens_input_used || 0) + (usage?.tokens_output_used || 0)).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {((usage?.tokens_input_quota || 0) + (usage?.tokens_output_quota || 0)).toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        (usage?.tokens_input_used || 0) + (usage?.tokens_output_used || 0),
                        (usage?.tokens_input_quota || 0) + (usage?.tokens_output_quota || 0)
                      )} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm">Images</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{usage?.images_generated || 0}</span>
                      <span className="text-sm text-muted-foreground">/ {usage?.images_quota || 0}</span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.images_generated || 0, usage?.images_quota)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-pink-500" />
                    <CardTitle className="text-sm">Videos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{usage?.videos_generated || 0}</span>
                      <span className="text-sm text-muted-foreground">/ {usage?.videos_quota || 0}</span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.videos_generated || 0, usage?.videos_quota)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm">Documents</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{usage?.documents_parsed || 0}</span>
                      <span className="text-sm text-muted-foreground">/ {usage?.documents_quota || 0}</span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.documents_parsed || 0, usage?.documents_quota)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Details Tab - Comprehensive Dashboard */}
          <TabsContent value="usage" className="space-y-6">
            <UsageDashboard 
              usage={usage as any} 
              isSuperUser={isSuperUser} 
              formatCredits={formatCredits} 
            />
          </TabsContent>

          {/* Buy Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Extra Credits</CardTitle>
                <CardDescription>
                  Buy additional credits to use beyond your subscription quota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Credit Balances */}
                <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Token Credits</p>
                    <p className="text-2xl font-bold">{formatCredits(credits.token_credits_remaining)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Image Credits</p>
                    <p className="text-2xl font-bold">{formatCredits(credits.image_credits_remaining)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Video Credits</p>
                    <p className="text-2xl font-bold">{formatCredits(credits.video_credits_remaining)}</p>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="max-w-md">
                  <Label htmlFor="discount">Discount Code (Optional)</Label>
                  <Input
                    id="discount"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                  />
                </div>

                {/* Credit Packages */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {pkg.credit_type}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        {pkg.description && (
                          <CardDescription>{pkg.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold">${pkg.price_usd.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {pkg.credits_amount.toLocaleString()} credits
                            {pkg.bonus_credits && pkg.bonus_credits > 0 && (
                              <span className="text-primary font-semibold">
                                {' '}+ {pkg.bonus_credits.toLocaleString()} bonus
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => handlePurchaseCredits(pkg.id)}
                        >
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {packages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No credit packages available at the moment
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upgrade Tab */}
          <TabsContent value="upgrade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Choose a plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableTiers.map((tier: any) => (
                    <Card key={tier.id} className="relative">
                      <CardHeader>
                        <CardTitle>{tier.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">${tier.monthly_price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{((tier.monthly_token_input_quota || 0) + (tier.monthly_token_output_quota || 0)).toLocaleString()} tokens/month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            <span>{tier.monthly_image_quota || 0} images/month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span>{tier.monthly_video_quota || 0} videos/month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{tier.monthly_document_parsing_quota || 0} documents/month</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          disabled={subscription?.tier_id === tier.id}
                        >
                          {subscription?.tier_id === tier.id ? 'Current Plan' : 'Upgrade'}
                          {subscription?.tier_id !== tier.id && <ArrowUpRight className="ml-2 h-4 w-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent credit purchases and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {creditPurchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment history yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{purchase.credits_purchased.toLocaleString()} Credits</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(purchase.created_at), 'MMM dd, yyyy')} • {purchase.payment_processor}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${purchase.amount_paid.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground uppercase">{purchase.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel Subscription Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Membership?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.
                After that, your account will revert to the free tier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Membership'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
