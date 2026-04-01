import type { NextRequest } from 'next/server';
import { POST as resendWebhookPost } from '@/app/api/resend/webhook/route';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	return resendWebhookPost(request);
}