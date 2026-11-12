import { Deliverable } from '@/types/planning';

/**
 * Extracts milestone name or tag associated with a deliverable.
 * Supports explicit properties or tags embedded in notes.
 */
export function getDeliverableMilestone(deliverable: Deliverable): string | null {
  if (deliverable.milestone_name?.trim()) {
    return deliverable.milestone_name.trim();
  }
  if (deliverable.milestone_name_ar?.trim()) {
    return deliverable.milestone_name_ar.trim();
  }
  if (deliverable.tags && deliverable.tags.length > 0) {
    const milestoneTag = deliverable.tags.find(t => t.toLowerCase().startsWith('m') || t.includes('معلم'));
    if (milestoneTag) return milestoneTag;
  }
  if (deliverable.notes) {
    const match = deliverable.notes.match(/\[(?:Milestone|معلم):\s*([^\]]+)\]/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export interface ClientDeadlineInfo {
  deadline: string | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  isUrgent: boolean;
  statusLabelAr: string;
  statusLabelEn: string;
}

/**
 * Calculates client / consultant review SLA deadline status under FIDIC standard.
 */
export function getDeliverableClientDeadline(deliverable: Deliverable): ClientDeadlineInfo {
  const targetDate = deliverable.client_review_deadline || deliverable.target_review_date || deliverable.due_date;
  if (!targetDate) {
    return {
      deadline: null,
      daysRemaining: null,
      isOverdue: false,
      isUrgent: false,
      statusLabelAr: 'غير محدد موعد',
      statusLabelEn: 'No deadline set',
    };
  }

  const targetMs = new Date(targetDate).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((targetMs - now) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = !isOverdue && diffDays <= 3;

  let statusLabelAr = '';
  let statusLabelEn = '';

  if (isOverdue) {
    const abs = Math.abs(diffDays);
    statusLabelAr = `متأخر ${abs} ${abs === 1 ? 'يوم' : 'أيام'}`;
    statusLabelEn = `${abs}d overdue`;
  } else if (diffDays === 0) {
    statusLabelAr = 'الموعد النهائي اليوم';
    statusLabelEn = 'Due today';
  } else if (diffDays === 1) {
    statusLabelAr = 'متبقي يوم واحد';
    statusLabelEn = '1 day left';
  } else {
    statusLabelAr = `متبقي ${diffDays} أيام`;
    statusLabelEn = `${diffDays} days left`;
  }

  return {
    deadline: targetDate,
    daysRemaining: diffDays,
    isOverdue,
    isUrgent,
    statusLabelAr,
    statusLabelEn,
  };
}

/**
 * Injects or updates a milestone tag inside the deliverable notes string safely.
 */
export function encodeMilestoneInNotes(notes: string | null | undefined, milestoneName: string): string {
  const cleanMilestone = milestoneName.trim();
  if (!cleanMilestone) return notes || '';
  
  const tag = `[Milestone: ${cleanMilestone}]`;
  if (!notes || !notes.trim()) {
    return tag;
  }
  
  if (notes.includes('[Milestone:')) {
    return notes.replace(/\[Milestone:\s*[^\]]+\]/i, tag);
  }
  
  return `${notes.trim()}\n${tag}`;
}
