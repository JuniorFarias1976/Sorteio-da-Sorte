import { DrawWinner, Participant } from '../types';

export function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

export function doesWinnerMatchParticipant(winner: DrawWinner, participant: Participant): boolean {
  if (!winner || !participant) return false;
  if (winner.participantId && participant.id && winner.participantId === participant.id) {
    return true;
  }
  if (winner.participantTicket && participant.ticketNumber && winner.participantTicket === participant.ticketNumber) {
    return true;
  }
  const wEmail = normalizeEmail(winner.participantEmail);
  const pEmail = normalizeEmail(participant.email);
  if (wEmail && pEmail && wEmail === pEmail) {
    return true;
  }
  return false;
}

export function isParticipantAlreadyWinner(participant: Participant, winners: DrawWinner[] = []): boolean {
  if (!participant) return false;
  if (participant.status === 'winner') return true;
  return winners.some((w) => doesWinnerMatchParticipant(w, participant));
}

export function isParticipantBlockedFromDraw(participant: Participant, winners: DrawWinner[] = []): boolean {
  if (!participant) return true;
  if (participant.status !== 'active') return true;
  return isParticipantAlreadyWinner(participant, winners);
}

export function getEligibleParticipants(participants: Participant[], winners: DrawWinner[] = []): Participant[] {
  return (participants || []).filter((p) => !isParticipantBlockedFromDraw(p, winners));
}
