import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, Plus, Loader2 } from 'lucide-react';
import { useScheduledJobs } from '@/hooks/useScheduledJobs';
import { toast } from 'sonner';

const AVAILABLE_FUNCTIONS = [
  { value: 'cleanup-expired-images', label: 'Cleanup Expired Images' },
  { value: 'cleanup-orphaned-files', label: 'Cleanup Orphaned Files' },
  { value: 'sync-openrouter-models', label: 'Sync OpenRouter Models' },
  { value: 'process-system-event', label: 'Process System Event' },
  { value: 'send-email', label: 'Send Email' },
  { value: 'check-quota', label: 'Check Quota' },
  { value: 'track-usage', label: 'Track Usage' },
];

const SCHEDULE_PRESETS = [
  { value: 'hourly', label: 'Hourly', cron: '0 * * * *', description: 'Every hour at minute 0' },
  { value: 'daily', label: 'Daily', cron: '0 8 * * *', description: 'Every day at 8:00 AM UTC' },
  { value: 'weekly', label: 'Weekly', cron: '0 8 * * 1', description: 'Every Monday at 8:00 AM UTC' },
  { value: 'monthly', label: 'Monthly', cron: '0 8 1 * *', description: 'First day of month at 8:00 AM UTC' },
  { value: 'custom', label: 'Custom', cron: '', description: 'Enter custom cron expression' },
];

export function JobSchedulerTab() {
  const { createJob, isCreating } = useScheduledJobs();
  
  const [formData, setFormData] = useState({
    jobName: '',
    description: '',
    targetFunction: '',
    scheduleType: 'daily',
    customCron: '',
    hour: '08',
    minute: '00',
    requestBody: '{}',
  });

  const getCronExpression = () => {
    if (formData.scheduleType === 'custom') {
      return formData.customCron;
    }
    
    const preset = SCHEDULE_PRESETS.find(p => p.value === formData.scheduleType);
    if (!preset) return '';
    
    // Replace hour/minute in preset
    if (formData.scheduleType === 'hourly') {
      return `${formData.minute} * * * *`;
    }
    return preset.cron.replace(/^0 8/, `${formData.minute} ${formData.hour}`);
  };

  const getScheduleDescription = () => {
    const preset = SCHEDULE_PRESETS.find(p => p.value === formData.scheduleType);
    if (!preset) return '';
    
    if (formData.scheduleType === 'custom') {
      return `Custom: ${formData.customCron}`;
    }
    
    const time = `${formData.hour}:${formData.minute} UTC`;
    switch (formData.scheduleType) {
      case 'hourly': return `Every hour at minute ${formData.minute}`;
      case 'daily': return `Daily at ${time}`;
      case 'weekly': return `Every Monday at ${time}`;
      case 'monthly': return `First day of month at ${time}`;
      default: return preset.description;
    }
  };

  const getNextExecutions = () => {
    const cron = getCronExpression();
    if (!cron) return [];
    
    // Simple preview for daily jobs
    const now = new Date();
    const executions: Date[] = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i + 1);
      date.setHours(parseInt(formData.hour), parseInt(formData.minute), 0, 0);
      executions.push(date);
    }
    
    return executions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobName || !formData.targetFunction) {
      toast.error('Please fill in required fields');
      return;
    }
    
    const cronExpression = getCronExpression();
    if (!cronExpression) {
      toast.error('Invalid schedule configuration');
      return;
    }

    let requestBody = {};
    try {
      requestBody = JSON.parse(formData.requestBody);
    } catch {
      toast.error('Invalid JSON in request body');
      return;
    }

    await createJob({
      jobName: formData.jobName,
      description: formData.description,
      targetFunction: formData.targetFunction,
      scheduleExpression: cronExpression,
      scheduleDescription: getScheduleDescription(),
      requestBody,
    });

    // Reset form
    setFormData({
      jobName: '',
      description: '',
      targetFunction: '',
      scheduleType: 'daily',
      customCron: '',
      hour: '08',
      minute: '00',
      requestBody: '{}',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Create Job Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Scheduled Job
          </CardTitle>
          <CardDescription>
            Schedule a new background job to run automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name *</Label>
              <Input
                id="jobName"
                placeholder="e.g., daily-report-generation"
                value={formData.jobName}
                onChange={(e) => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What does this job do?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetFunction">Target Function *</Label>
              <Select 
                value={formData.targetFunction} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, targetFunction: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select edge function" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FUNCTIONS.map(fn => (
                    <SelectItem key={fn.value} value={fn.value}>{fn.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Schedule</Label>
              <RadioGroup
                value={formData.scheduleType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, scheduleType: v }))}
                className="grid grid-cols-5 gap-2"
              >
                {SCHEDULE_PRESETS.map(preset => (
                  <div key={preset.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={preset.value} id={preset.value} />
                    <Label htmlFor={preset.value} className="text-sm cursor-pointer">
                      {preset.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.scheduleType === 'custom' ? (
                <div className="space-y-2">
                  <Label htmlFor="customCron">Cron Expression</Label>
                  <Input
                    id="customCron"
                    placeholder="* * * * *"
                    value={formData.customCron}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCron: e.target.value }))}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Format: minute hour day month weekday</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Time (UTC):</Label>
                  <Select 
                    value={formData.hour} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, hour: v }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select 
                    value={formData.minute} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, minute: v }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestBody">Request Body (JSON)</Label>
              <Textarea
                id="requestBody"
                placeholder="{}"
                value={formData.requestBody}
                onChange={(e) => setFormData(prev => ({ ...prev, requestBody: e.target.value }))}
                className="font-mono text-sm h-24"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Scheduled Job
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Preview
          </CardTitle>
          <CardDescription>
            Next 5 scheduled executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Cron Expression</div>
              <code className="text-lg font-mono">{getCronExpression() || '—'}</code>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Schedule Description</div>
              <div className="text-lg">{getScheduleDescription() || '—'}</div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Next Executions
              </div>
              <ul className="space-y-2">
                {getNextExecutions().map((date, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    {date.toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
