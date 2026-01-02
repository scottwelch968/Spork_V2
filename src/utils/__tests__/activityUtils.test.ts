import { describe, it, expect } from 'vitest';
import { getActivityIcon } from '@/utils/activityUtils';
import { MessageSquare, Boxes, Upload, Bot, FileText, Activity, ListTodo, Edit, CheckCircle, UserPlus, Trash2 } from 'lucide-react';

describe('getActivityIcon', () => {
  it('returns correct icon for chat activity', () => {
    const result = getActivityIcon('chat');
    expect(result.icon).toBe(MessageSquare);
    expect(result.color).toBe('text-blue-600');
  });

  it('returns correct icon for started_chat activity', () => {
    const result = getActivityIcon('started_chat');
    expect(result.icon).toBe(MessageSquare);
    expect(result.color).toBe('text-blue-600');
  });

  it('returns correct icon for created_space activity', () => {
    const result = getActivityIcon('created_space');
    expect(result.icon).toBe(Boxes);
    expect(result.color).toBe('text-purple-600');
  });

  it('returns correct icon for uploaded_file activity', () => {
    const result = getActivityIcon('uploaded_file');
    expect(result.icon).toBe(Upload);
    expect(result.color).toBe('text-green-600');
  });

  it('returns correct icon for created_persona activity', () => {
    const result = getActivityIcon('created_persona');
    expect(result.icon).toBe(Bot);
    expect(result.color).toBe('text-orange-600');
  });

  it('returns correct icon for created_prompt activity', () => {
    const result = getActivityIcon('created_prompt');
    expect(result.icon).toBe(FileText);
    expect(result.color).toBe('text-pink-600');
  });

  it('returns correct icon for task_created activity', () => {
    const result = getActivityIcon('task_created');
    expect(result.icon).toBe(ListTodo);
    expect(result.color).toBe('text-emerald-600');
  });

  it('returns correct icon for task_updated activity', () => {
    const result = getActivityIcon('task_updated');
    expect(result.icon).toBe(Edit);
    expect(result.color).toBe('text-amber-600');
  });

  it('returns correct icon for task_status_changed activity', () => {
    const result = getActivityIcon('task_status_changed');
    expect(result.icon).toBe(CheckCircle);
    expect(result.color).toBe('text-green-600');
  });

  it('returns correct icon for task_assigned activity', () => {
    const result = getActivityIcon('task_assigned');
    expect(result.icon).toBe(UserPlus);
    expect(result.color).toBe('text-indigo-600');
  });

  it('returns correct icon for task_deleted activity', () => {
    const result = getActivityIcon('task_deleted');
    expect(result.icon).toBe(Trash2);
    expect(result.color).toBe('text-red-600');
  });

  it('returns default icon for unknown activity type', () => {
    const result = getActivityIcon('unknown_type');
    expect(result.icon).toBe(Activity);
    expect(result.color).toBe('text-gray-600');
  });

  it('returns default icon for empty string', () => {
    const result = getActivityIcon('');
    expect(result.icon).toBe(Activity);
    expect(result.color).toBe('text-gray-600');
  });

  it('handles undefined gracefully', () => {
    const result = getActivityIcon(undefined as unknown as string);
    expect(result.icon).toBe(Activity);
    expect(result.color).toBe('text-gray-600');
  });
});
