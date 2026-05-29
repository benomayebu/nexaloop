import { Injectable } from '@nestjs/common';

/**
 * AI Service — rule-based intelligence layer.
 *
 * This service provides smart suggestions using heuristic analysis of
 * thread messages, supplier data, and compliance status. It's designed
 * with a clean interface that can later be swapped for an LLM provider
 * (OpenAI, Anthropic, etc.) without changing consumers.
 *
 * Current implementation: deterministic heuristics (no external API calls).
 * Future: plug in `process.env.AI_PROVIDER` to route to LLM backends.
 */
@Injectable()
export class AiService {
  // ─── Thread Summary ────────────────────────────────────────────────

  /**
   * Summarise a thread's messages into a concise overview.
   */
  summariseThread(messages: { authorName: string; body: string; createdAt: Date | string }[]): string {
    if (messages.length === 0) return 'No messages in this thread.';
    if (messages.length === 1) {
      return `Thread started by ${messages[0].authorName}. Topic: ${this.extractTopic(messages[0].body)}`;
    }

    const participants = [...new Set(messages.map((m) => m.authorName))];
    const messageCount = messages.length;
    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];
    const topic = this.extractTopic(firstMsg.body);
    const keywords = this.extractKeywords(messages.map((m) => m.body).join(' '));

    const parts = [
      `${messageCount} messages between ${participants.join(', ')}.`,
      `Topic: ${topic}.`,
    ];

    if (keywords.length > 0) {
      parts.push(`Key themes: ${keywords.slice(0, 4).join(', ')}.`);
    }

    parts.push(`Last activity by ${lastMsg.authorName}.`);

    return parts.join(' ');
  }

  // ─── Reply Suggestions ─────────────────────────────────────────────

  /**
   * Suggest contextual reply options based on thread content.
   */
  suggestReplies(
    messages: { authorName: string; body: string }[],
    context?: { supplierName?: string; documentType?: string },
  ): string[] {
    if (messages.length === 0) return ['Hello, how can I help?'];

    const lastMsg = messages[messages.length - 1]?.body?.toLowerCase() ?? '';
    const suggestions: string[] = [];

    // Document-related patterns
    if (lastMsg.includes('certificate') || lastMsg.includes('document') || lastMsg.includes('audit')) {
      suggestions.push(
        `Thank you for the update${context?.supplierName ? `, ${context.supplierName}` : ''}. We'll review the document and get back to you shortly.`,
        'Could you confirm the validity period and upload the latest version to our portal?',
        'We need the original document with certification body stamps. Can you provide this?',
      );
    }

    // Expiry/renewal patterns
    if (lastMsg.includes('expir') || lastMsg.includes('renew') || lastMsg.includes('deadline')) {
      suggestions.push(
        'We\'ve noted the upcoming expiry. Please initiate the renewal process and share the updated document once available.',
        'Can you provide a timeline for when the renewed certificate will be ready?',
        `What is the expected turnaround for the renewal? We need to maintain compliance continuity.`,
      );
    }

    // Question/request patterns
    if (lastMsg.includes('?') || lastMsg.includes('please') || lastMsg.includes('could you')) {
      suggestions.push(
        'Absolutely, I\'ll look into this and follow up within 24 hours.',
        'Thanks for flagging this. Let me check with the team and get back to you.',
      );
    }

    // General follow-up
    if (lastMsg.includes('update') || lastMsg.includes('status') || lastMsg.includes('progress')) {
      suggestions.push(
        'Here\'s a quick status update on our end: [add details]. Let us know if you need anything else.',
        'We\'re on track. I\'ll send a detailed update by end of this week.',
      );
    }

    // Fallback suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        `Thanks for your message${context?.supplierName ? `, ${context.supplierName}` : ''}. We'll review and respond shortly.`,
        'Acknowledged. Is there anything else you need from our side?',
        'Thank you for the information. We\'ll update our records accordingly.',
      );
    }

    return suggestions.slice(0, 3);
  }

  // ─── Task Extraction ───────────────────────────────────────────────

  /**
   * Analyse thread messages and suggest tasks that should be created.
   */
  suggestTasks(
    messages: { authorName: string; body: string }[],
    context?: { supplierName?: string; supplierId?: string },
  ): Array<{ title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; dueDays: number }> {
    const allText = messages.map((m) => m.body).join('\n').toLowerCase();
    const tasks: Array<{ title: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; dueDays: number }> = [];

    const supplier = context?.supplierName ?? 'supplier';

    // Document review needed
    if (allText.includes('upload') || allText.includes('attach') || allText.includes('document')) {
      tasks.push({
        title: `Review uploaded document from ${supplier}`,
        description: 'A document was mentioned in the thread. Review and update status.',
        priority: 'MEDIUM',
        dueDays: 3,
      });
    }

    // Expiry action
    if (allText.includes('expir') || allText.includes('deadline') || allText.includes('due date')) {
      tasks.push({
        title: `Follow up on expiring document — ${supplier}`,
        description: 'Document expiry was discussed. Ensure renewal is in progress.',
        priority: 'HIGH',
        dueDays: 7,
      });
    }

    // Audit/inspection
    if (allText.includes('audit') || allText.includes('inspection') || allText.includes('visit')) {
      tasks.push({
        title: `Schedule audit follow-up — ${supplier}`,
        description: 'An audit or inspection was mentioned. Schedule the next steps.',
        priority: 'MEDIUM',
        dueDays: 14,
      });
    }

    // Corrective action
    if (allText.includes('corrective') || allText.includes('non-compliance') || allText.includes('issue') || allText.includes('problem')) {
      tasks.push({
        title: `Track corrective action — ${supplier}`,
        description: 'A compliance issue was flagged. Monitor corrective action progress.',
        priority: 'HIGH',
        dueDays: 7,
      });
    }

    // General follow-up
    if (allText.includes('follow up') || allText.includes('get back') || allText.includes('next week')) {
      tasks.push({
        title: `Follow up with ${supplier}`,
        description: 'A follow-up action was mentioned in the conversation.',
        priority: 'LOW',
        dueDays: 5,
      });
    }

    // If no patterns matched, suggest a generic follow-up
    if (tasks.length === 0) {
      tasks.push({
        title: `Review thread and take action — ${supplier}`,
        description: 'Review the thread conversation and determine if any action is needed.',
        priority: 'LOW',
        dueDays: 7,
      });
    }

    return tasks.slice(0, 3);
  }

  // ─── Compliance Insights ───────────────────────────────────────────

  /**
   * Generate contextual compliance insights based on dashboard data.
   */
  generateInsights(data: {
    expiringSoon: number;
    pendingReview: number;
    openTasks: number;
    overdueTasks: number;
    complianceScore: number;
    highRiskSuppliers: number;
  }): Array<{ type: 'warning' | 'info' | 'success'; message: string; action?: string; href?: string }> {
    const insights: Array<{ type: 'warning' | 'info' | 'success'; message: string; action?: string; href?: string }> = [];

    if (data.overdueTasks > 0) {
      insights.push({
        type: 'warning',
        message: `You have ${data.overdueTasks} overdue task${data.overdueTasks !== 1 ? 's' : ''}. These need immediate attention.`,
        action: 'View tasks',
        href: '/dashboard/crm',
      });
    }

    if (data.expiringSoon > 0) {
      insights.push({
        type: 'warning',
        message: `${data.expiringSoon} document${data.expiringSoon !== 1 ? 's' : ''} expiring within 30 days. Send renewal requests to avoid compliance gaps.`,
        action: 'View documents',
        href: '/dashboard/documents',
      });
    }

    if (data.highRiskSuppliers > 0) {
      insights.push({
        type: 'warning',
        message: `${data.highRiskSuppliers} high-risk supplier${data.highRiskSuppliers !== 1 ? 's' : ''} in your network. Review their compliance status.`,
        action: 'View suppliers',
        href: '/dashboard/suppliers',
      });
    }

    if (data.pendingReview > 0) {
      insights.push({
        type: 'info',
        message: `${data.pendingReview} document${data.pendingReview !== 1 ? 's' : ''} awaiting review. Clearing the queue helps maintain compliance cadence.`,
        action: 'Start reviewing',
        href: '/dashboard/documents',
      });
    }

    if (data.complianceScore >= 90 && data.expiringSoon === 0 && data.overdueTasks === 0) {
      insights.push({
        type: 'success',
        message: 'Excellent compliance posture. All documents up to date and no overdue tasks.',
      });
    } else if (data.complianceScore >= 70) {
      insights.push({
        type: 'info',
        message: `Compliance score: ${data.complianceScore}%. Focus on pending reviews and expiring documents to improve.`,
      });
    } else if (data.complianceScore > 0) {
      insights.push({
        type: 'warning',
        message: `Compliance score: ${data.complianceScore}%. Significant gaps exist. Prioritise document collection from suppliers.`,
      });
    }

    return insights.slice(0, 4);
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  private extractTopic(text: string): string {
    // Take the first sentence or first 80 characters
    const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? '';
    if (firstSentence.length <= 80) return firstSentence;
    return firstSentence.slice(0, 77) + '...';
  }

  private extractKeywords(text: string): string[] {
    const complianceTerms = [
      'audit', 'certificate', 'BSCI', 'OEKO-TEX', 'REACH', 'compliance',
      'renewal', 'expiry', 'corrective action', 'inspection', 'sustainability',
      'DPP', 'EPR', 'ISO', 'GRS', 'organic', 'recycled', 'traceability',
    ];
    const lower = text.toLowerCase();
    return complianceTerms.filter((term) => lower.includes(term.toLowerCase()));
  }
}
