import { buildSdp, parseSdp, type SignalData } from './sdp';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const GATHER_TIMEOUT = 5000;

export interface PeerLink {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  session: number;
}

async function withCamera<T>(task: () => Promise<T>): Promise<T> {
  let stream: MediaStream | null = null;
  try {
    stream = (await navigator.mediaDevices?.getUserMedia({ video: true })) ?? null;
  } catch {}
  try {
    return await task();
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

function newPeer(): { pc: RTCPeerConnection; channel: RTCDataChannel } {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const channel = pc.createDataChannel('arcanopee', { negotiated: true, id: 0, ordered: true });
  return { pc, channel };
}

export function waitIceGathering(pc: RTCPeerConnection, timeout = GATHER_TIMEOUT): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === 'complete') done();
    };
    const timer = setTimeout(done, timeout);
    pc.addEventListener('icegatheringstatechange', check);
  });
}

export function createOffer(): Promise<PeerLink & { offer: SignalData }> {
  return withCamera(async () => {
    const { pc, channel } = newPeer();
    const session = crypto.getRandomValues(new Uint32Array(1))[0];
    await pc.setLocalDescription(await pc.createOffer());
    await waitIceGathering(pc);
    const offer = parseSdp(pc.localDescription!.sdp, 'offer', session);
    return { pc, channel, session, offer };
  });
}

export function acceptOffer(offer: SignalData): Promise<PeerLink & { answer: SignalData }> {
  if (offer.type !== 'offer') return Promise.reject(new Error('Ce code n’est pas une invitation de l’hôte.'));
  return withCamera(async () => {
    const { pc, channel } = newPeer();
    await pc.setRemoteDescription({ type: 'offer', sdp: buildSdp(offer) });
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIceGathering(pc);
    const answer = parseSdp(pc.localDescription!.sdp, 'answer', offer.session);
    return { pc, channel, session: offer.session, answer };
  });
}

export async function acceptAnswer(link: PeerLink, answer: SignalData): Promise<void> {
  if (answer.type !== 'answer') throw new Error('Ce code n’est pas une réponse d’archer.');
  if (answer.session !== link.session) throw new Error('Cette réponse correspond à une autre invitation.');
  await link.pc.setRemoteDescription({ type: 'answer', sdp: buildSdp(answer) });
}

export function closePeer(link: PeerLink | null | undefined) {
  if (!link) return;
  try {
    link.channel.close();
  } catch {}
  try {
    link.pc.close();
  } catch {}
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export function hidesAddress(signal: SignalData): boolean {
  return !signal.candidates.some((c) => c.type === 'host' && !c.address.endsWith('.local'));
}

function describe(signal: SignalData): string {
  const local = signal.candidates.filter((c) => c.type === 'host' && !c.address.endsWith('.local'));
  const hidden = signal.candidates.filter((c) => c.address.endsWith('.local')).length;
  const internet = signal.candidates.filter((c) => c.type !== 'host').length;
  const parts = [];
  if (local.length) parts.push(`${local.length} locale${local.length > 1 ? 's' : ''} (${local.map((c) => (IPV4.test(c.address) ? c.address : 'IPv6')).join(', ')})`);
  if (hidden) parts.push(`${hidden} masquée${hidden > 1 ? 's' : ''}`);
  if (internet) parts.push(`${internet} internet`);
  return parts.join(', ') || 'aucune';
}

export function connectionFailure(offer: SignalData, answer: SignalData): string {
  const advice =
    hidesAddress(offer) || hidesAddress(answer)
      ? 'Un des téléphones masque son adresse sur le Wi-Fi : autorisez la caméra pour Arcanopée sur les deux téléphones, puis refaites une invitation.'
      : 'Le Wi-Fi isole peut-être les appareils (fréquent sur les réseaux publics ou invités). L’hôte peut activer le partage de connexion de son téléphone, l’archer s’y connecte, puis refaites une invitation.';
  return `Les téléphones ne se trouvent pas. ${advice} Adresses : hôte ${describe(offer)} · archer ${describe(answer)}.`;
}
