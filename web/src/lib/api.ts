const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://conventus-9q9k.onrender.com';

/** Backend base URL without trailing slash. Set via .env.development / .env.production. */
export function getApiUrl(): string {
  const raw = import.meta.env.PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return import.meta.env.DEV ? DEV_API_URL : PROD_API_URL;
}

const API_URL = getApiUrl();

export interface Meeting {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Proposal {
  username: string;
  groupedAvailability: { day: string; ranges: string[] }[];
  rawAvailability: string[];
}

export interface AvailabilitySlot {
  time: string;
  users: string[];
  count?: number;
}

export interface MeetingDetail {
  meeting: Meeting;
  proposals: Proposal[];
  commonAvailability: AvailabilitySlot[];
  otherAvailability: AvailabilitySlot[];
}

export async function createMeeting(title: string, description: string): Promise<{ meetingId: string }> {
  const res = await fetch(`${API_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error('Failed to create meeting');
  return res.json();
}

export async function getMeeting(id: string): Promise<MeetingDetail> {
  const res = await fetch(`${API_URL}/api/meetings/${id}`);
  if (!res.ok) throw new Error('Meeting not found');
  return res.json();
}

export async function addAvailability(
  meetingId: string,
  username: string,
  availability: string[]
): Promise<void> {
  const res = await fetch(`${API_URL}/api/meetings/${meetingId}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, availability }),
  });
  if (!res.ok) throw new Error('Failed to add availability');
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/meetings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meeting');
}
