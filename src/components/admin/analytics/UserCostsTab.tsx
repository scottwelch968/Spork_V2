import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportButton } from './ExportButton';
import { exportToCSV, exportToJSON } from '@/utils/exportAnalytics';

interface UserCost {
  user_id: string;
  user_name: string;
  user_email: string;
  chat_cost: number;
  image_cost: number;
  video_cost: number;
  doc_cost: number;
  total_cost: number;
  total_requests: number;
}

interface UserCostsTabProps {
  data: UserCost[];
}

export const UserCostsTab = ({ data }: UserCostsTabProps) => {
  const sortedData = [...data].sort((a, b) => b.total_cost - a.total_cost);
  const topUsers = sortedData.slice(0, 20);

  const handleExportCSV = () => {
    const csvData = data.map(user => ({
      'User Name': user.user_name,
      'Email': user.user_email,
      'Chat Cost': user.chat_cost.toFixed(4),
      'Image Cost': user.image_cost.toFixed(4),
      'Video Cost': user.video_cost.toFixed(4),
      'Document Cost': user.doc_cost.toFixed(4),
      'Total Cost': user.total_cost.toFixed(4),
      'Total Requests': user.total_requests,
    }));
    exportToCSV(csvData, 'user-costs');
  };

  const handleExportJSON = () => {
    exportToJSON(data, 'user-costs');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Cost by User</h3>
          <p className="text-sm text-muted-foreground">Top 20 users by total cost</p>
        </div>
        <ExportButton 
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Cost Breakdown</CardTitle>
          <CardDescription>
            Detailed cost breakdown per user across all services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Chat</TableHead>
                <TableHead className="text-right">Images</TableHead>
                <TableHead className="text-right">Videos</TableHead>
                <TableHead className="text-right">Docs</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.user_name || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.user_email}</TableCell>
                  <TableCell className="text-right">${user.chat_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">${user.image_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">${user.video_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">${user.doc_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right font-semibold">${user.total_cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">{user.total_requests}</TableCell>
                </TableRow>
              ))}
              {topUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No usage data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
