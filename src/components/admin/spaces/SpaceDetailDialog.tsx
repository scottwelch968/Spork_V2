import { useEffect, useState } from 'react';
import { useAdminSpaces } from '@/hooks/useAdminSpaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Users, MessageSquare, File, Settings } from 'lucide-react';

interface SpaceDetailDialogProps {
  space: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpaceDetailDialog({ space, open, onOpenChange }: SpaceDetailDialogProps) {
  const { getSpaceDetails } = useAdminSpaces();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && space) {
      setLoading(true);
      getSpaceDetails(space.id)
        .then(setDetails)
        .finally(() => setLoading(false));
    }
  }, [open, space?.id]);

  if (!space) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {space.color_code && (
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: space.color_code }}
              />
            )}
            {space.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">Loading details...</div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Space Information</h4>
                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Owner:</span>{' '}
                    <span className="font-medium">{details?.profiles?.first_name ? `${details.profiles.first_name} ${details.profiles.last_name || ''}`.trim() : details?.profiles?.email} ({details?.profiles?.email})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{format(new Date(space.created_at), 'PPP')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    {space.is_suspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : space.is_archived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  {space.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>{' '}
                      <p className="mt-1">{space.description}</p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{space.memberCount}</div>
                      <div className="text-sm text-muted-foreground">Members</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{space.chatCount}</div>
                      <div className="text-sm text-muted-foreground">Chats</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{space.storageUsedMB.toFixed(1)} MB</div>
                      <div className="text-sm text-muted-foreground">Storage</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Members ({details?.members?.length || 0})</h4>
                <div className="space-y-2">
                  {details?.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div>
                        <div className="font-medium">{member.profiles?.first_name ? `${member.profiles.first_name} ${member.profiles.last_name || ''}`.trim() : member.profiles?.email}</div>
                        <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                      </div>
                      <Badge>{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Recent Chats</h5>
                    <div className="space-y-1">
                      {details?.recentChats?.slice(0, 5).map((chat: any) => (
                        <div key={chat.id} className="text-sm p-2 hover:bg-muted/50 rounded">
                          <div className="font-medium">{chat.title || 'Untitled Chat'}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(chat.updated_at), 'PPp')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Recent Files</h5>
                    <div className="space-y-1">
                      {details?.recentFiles?.slice(0, 5).map((file: any) => (
                        <div key={file.id} className="text-sm p-2 hover:bg-muted/50 rounded">
                          <div className="font-medium">{file.file_name}</div>
                          <div className="text-muted-foreground">
                            {(file.file_size / 1024).toFixed(1)} KB • {format(new Date(file.created_at), 'PPp')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="mt-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Configuration
                </h4>
                <div className="space-y-3 text-sm">
                  {space.ai_model && (
                    <div>
                      <span className="text-muted-foreground">AI Model:</span>{' '}
                      <span className="font-medium">{space.ai_model}</span>
                    </div>
                  )}
                  {space.ai_instructions && (
                    <div>
                      <span className="text-muted-foreground">AI Instructions:</span>
                      <p className="mt-1 p-2 bg-muted/50 rounded">{space.ai_instructions}</p>
                    </div>
                  )}
                  {space.compliance_rule && (
                    <div>
                      <span className="text-muted-foreground">Compliance Rule:</span>
                      <p className="mt-1 p-2 bg-muted/50 rounded">{space.compliance_rule}</p>
                    </div>
                  )}
                  {space.file_quota_mb && (
                    <div>
                      <span className="text-muted-foreground">File Quota:</span>{' '}
                      <span className="font-medium">{space.file_quota_mb} MB</span>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
