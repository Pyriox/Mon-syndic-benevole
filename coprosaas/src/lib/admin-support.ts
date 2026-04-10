import { createAdminClient } from '@/lib/supabase/admin';

export type SupportTicketStatus = 'ouvert' | 'en_cours' | 'resolu';
export type SupportTicketReadState = 'waiting_support' | 'client_unread' | 'client_read' | 'no_messages';

const AUTO_CLOSE_AFTER_DAYS = 7;
const AUTO_CLOSE_AFTER_MS = AUTO_CLOSE_AFTER_DAYS * 24 * 60 * 60 * 1000;

export type SupportAttentionTicket = {
  id: string;
  status: SupportTicketStatus;
};

export type SupportAttentionMessage = {
  ticket_id: string;
  author: 'client' | 'admin';
  created_at?: string | null;
  client_read?: boolean | null;
};

export type SupportTicketState = {
  ticketId: string;
  lastMessageAuthor: 'client' | 'admin' | null;
  lastMessageAt: string | null;
  hasUnreadAdminMessages: boolean;
  readState: SupportTicketReadState;
  autoCloseEligible: boolean;
};

export type SupportAttentionSummary = {
  pendingCount: number;
  openCount: number;
  inProgressCount: number;
  pendingTicketIds: string[];
};

export type AdminSupportTicket = {
  id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: SupportTicketStatus;
  created_at: string;
  updated_at: string;
  last_message_author: 'client' | 'admin' | null;
  last_message_at: string | null;
  read_state: SupportTicketReadState;
  has_unread_admin_messages: boolean;
};

const EMPTY_SUMMARY: SupportAttentionSummary = {
  pendingCount: 0,
  openCount: 0,
  inProgressCount: 0,
  pendingTicketIds: [],
};

export function computeSupportTicketStates(
  tickets: SupportAttentionTicket[],
  messages: SupportAttentionMessage[],
  now: Date = new Date(),
): Map<string, SupportTicketState> {
  const latestByTicket = new Map<string, SupportAttentionMessage>();
  const unreadByTicket = new Map<string, boolean>();
  const sortedMessages = [...messages].sort((a, b) => {
    const aTs = new Date(a.created_at ?? 0).getTime();
    const bTs = new Date(b.created_at ?? 0).getTime();
    return bTs - aTs;
  });

  for (const message of sortedMessages) {
    if (!latestByTicket.has(message.ticket_id)) {
      latestByTicket.set(message.ticket_id, message);
    }

    if (message.author === 'admin' && message.client_read === false) {
      unreadByTicket.set(message.ticket_id, true);
    }
  }

  return new Map(
    tickets.map((ticket) => {
      const latestMessage = latestByTicket.get(ticket.id);
      const hasUnreadAdminMessages = unreadByTicket.get(ticket.id) ?? false;
      const lastMessageAt = latestMessage?.created_at ?? null;
      const lastMessageAuthor = latestMessage?.author ?? null;
      const autoCloseEligible = ticket.status !== 'resolu'
        && lastMessageAuthor === 'admin'
        && !!lastMessageAt
        && (now.getTime() - new Date(lastMessageAt).getTime()) >= AUTO_CLOSE_AFTER_MS;

      const readState: SupportTicketReadState = !latestMessage
        ? 'no_messages'
        : lastMessageAuthor === 'client'
          ? 'waiting_support'
          : hasUnreadAdminMessages
            ? 'client_unread'
            : 'client_read';

      return [ticket.id, {
        ticketId: ticket.id,
        lastMessageAuthor,
        lastMessageAt,
        hasUnreadAdminMessages,
        readState,
        autoCloseEligible,
      } satisfies SupportTicketState];
    }),
  );
}

export function computeSupportAttentionSummary(
  tickets: SupportAttentionTicket[],
  messages: SupportAttentionMessage[],
): SupportAttentionSummary {
  if (!tickets.length) {
    return EMPTY_SUMMARY;
  }

  const states = computeSupportTicketStates(tickets, messages);
  const pendingTickets = tickets.filter((ticket) => {
    if (ticket.status === 'resolu') {
      return false;
    }

    const state = states.get(ticket.id);
    return !state || state.lastMessageAuthor !== 'admin';
  });

  return {
    pendingCount: pendingTickets.length,
    openCount: pendingTickets.filter((ticket) => ticket.status === 'ouvert').length,
    inProgressCount: pendingTickets.filter((ticket) => ticket.status === 'en_cours').length,
    pendingTicketIds: pendingTickets.map((ticket) => ticket.id),
  };
}

export async function autoCloseStaleSupportTickets(
  admin: ReturnType<typeof createAdminClient>,
  now: Date = new Date(),
): Promise<string[]> {
  const { data: tickets, error: ticketsError } = await admin
    .from('support_tickets')
    .select('id, status')
    .in('status', ['ouvert', 'en_cours']);

  if (ticketsError || !tickets?.length) {
    return [];
  }

  const ticketIds = tickets.map((ticket) => ticket.id);
  const { data: messages } = await admin
    .from('support_messages')
    .select('ticket_id, author, created_at, client_read')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });

  const states = computeSupportTicketStates(
    tickets as SupportAttentionTicket[],
    (messages ?? []) as SupportAttentionMessage[],
    now,
  );
  const staleTicketIds = tickets
    .filter((ticket) => states.get(ticket.id)?.autoCloseEligible)
    .map((ticket) => ticket.id);

  if (!staleTicketIds.length) {
    return [];
  }

  const { error } = await admin
    .from('support_tickets')
    .update({ status: 'resolu' })
    .in('id', staleTicketIds);

  if (error) {
    return [];
  }

  return staleTicketIds;
}

export async function getAdminSupportTickets(
  admin: ReturnType<typeof createAdminClient>,
): Promise<AdminSupportTicket[]> {
  await autoCloseStaleSupportTickets(admin);

  const { data: tickets, error } = await admin
    .from('support_tickets')
    .select('id, user_email, user_name, subject, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error || !tickets?.length) {
    return [];
  }

  const ticketIds = tickets.map((ticket) => ticket.id);
  const { data: messages } = await admin
    .from('support_messages')
    .select('ticket_id, author, created_at, client_read')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });

  const states = computeSupportTicketStates(
    tickets as SupportAttentionTicket[],
    (messages ?? []) as SupportAttentionMessage[],
  );

  return tickets.map((ticket) => {
    const state = states.get(ticket.id);
    return {
      ...ticket,
      last_message_author: state?.lastMessageAuthor ?? null,
      last_message_at: state?.lastMessageAt ?? null,
      read_state: state?.readState ?? 'no_messages',
      has_unread_admin_messages: state?.hasUnreadAdminMessages ?? false,
    } as AdminSupportTicket;
  });
}

export async function getSupportAttentionSummary(admin: ReturnType<typeof createAdminClient>): Promise<SupportAttentionSummary> {
  await autoCloseStaleSupportTickets(admin);

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
    .select('ticket_id, author, created_at, client_read')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });

  return computeSupportAttentionSummary(
    tickets as SupportAttentionTicket[],
    (messages ?? []) as SupportAttentionMessage[],
  );
}
