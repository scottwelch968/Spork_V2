import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPersonas } from '@/hooks/useAdminPersonas';
import { UserCheck, Building } from 'lucide-react';

export function PersonaConfigTab() {
  const { templates, setDefaultForUsers, setDefaultForSpaces } = useAdminPersonas();

  const activeTemplates = templates.filter(t => t.is_active);
  const userDefault = templates.find(t => t.is_default_for_users);
  const spaceDefault = templates.find(t => t.is_default_for_spaces);

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <CardTitle>Default Persona for New Users</CardTitle>
          </div>
          <CardDescription>
            Select the persona that will be automatically created in new user's personal library when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default User Persona</Label>
            <Select 
              value={userDefault?.id || ''} 
              onValueChange={setDefaultForUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default persona for users" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userDefault && (
              <p className="text-sm text-muted-foreground mt-2">
                Currently: <strong>{userDefault.name}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <CardTitle>Default Persona for New Spaces</CardTitle>
          </div>
          <CardDescription>
            Select the persona that will be automatically created in the AI Config when users create new spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default Space Persona</Label>
            <Select 
              value={spaceDefault?.id || ''} 
              onValueChange={setDefaultForSpaces}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default persona for spaces" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {spaceDefault && (
              <p className="text-sm text-muted-foreground mt-2">
                Currently: <strong>{spaceDefault.name}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
