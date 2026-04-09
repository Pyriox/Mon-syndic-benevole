import { createAdminClient } from '@/lib/supabase/admin';

export type SupportTicketStatus = 'ouvert' | 'en_cours' | 'resolu';

export type SupportAttentionTicket = {
  id: string;
  status: SupportTicketStatus;
};

export type SupportAttentionMessage = {
  ticket_id: string;
  author: 'client' | 'admin';
  created_at?: string | null;
};

export type SupportAttentionSummary = {
  pendingCount: number;
  openCount: number;
  inProgressCount: number;
  pendingTicketIds: string[];
};

const EMPTY_SUMMARY: SupportAttentionSummary = {
  pendingCount: 0,
  openCount: 0,
  inProgressCount: 0,
  pendingTicketIds: [],
};

export function computeSupportAttentionSummary(
  tickets: SupportAttentionTicket[],
  messages: SupportAttentionMessage[],
): SupportAttentionSummary {
  if (!tickets.length) {
    return EMPTY_SUMMARY;
  }

  const latestByTicket = new Map<string, SupportAttentionMessage>();
  const sortedMessages = [...messages].sort((a, b) => {
    const aTs = new Date(a.created_at ?? 0).getTime();
    const bTs = new Date(b.created_at ?? 0).getTime();
    return bTs - aTs;
  });

  for (const message of sortedMessages) {
    if (!latestByTicket.has(message.ticket_id)) {
      latestByTicket.set(message.ticket_id, message);
    }
  }

  const pendingTickets = tickets.filter((ticket) => {
    if (ticket.status === 'resolu') {
      return false;
    }

    const latestMessage = latestByTicket.get(ticket.id);
    return !latestMessage || latestMessage.author === 'client';
  });

  return {
    pendingCount: pendingTickets.length,
    openCount: pendingTickets.filter((ticket) => ticket.status === 'ouvert').length,
    inProgressCount: pendingTickets.filter((ticket) => ticket.status === 'en_cours').length,
    pendingTicketIds: pendingTickets.map((ticket) => ticket.id),
  };
}

export async function getSupportAttentionSummary(admin: ReturnType<typeof createAdminClient>): Promise<SupportAttentionSummary> {
  const { data: tickets, error: ticketsError } = await admin
    .from('support_tickets')
    .select('id, status')
    .in('status', ['ouvert', 'en_cours']);

  if (ticketsError || !tickets?.length) {
    return EMPTY_SUMMARY;
  }

  const ticketIds = tickets.map((ticket) => ticket.id);
  const { data: messages } = await admin
    .from('support_messages')
    .select('ticket_id, author, created_at')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });

  return computeSupportAttentionSummary(
    tickets as SupportAttentionTicket[],
    (messages ?? []) as SupportAttentionMessage[],
  );
}
