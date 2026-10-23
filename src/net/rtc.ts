import { buildSdp, parseSdp, type SignalData } from './sdp';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const GATHER_TIMEOUT = 3500;

export interface PeerLink {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  session: number;
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

export async function createOffer(): Promise<PeerLink & { offer: SignalData }> {
  const { pc, channel } = newPeer();
  const session = crypto.getRandomValues(new Uint32Array(1))[0];
  await pc.setLocalDescription(await pc.createOffer());
  await waitIceGathering(pc);
  const offer = parseSdp(pc.localDescription!.sdp, 'offer', session);
  return { pc, channel, session, offer };
}

export async function acceptOffer(offer: SignalData): Promise<PeerLink & { answer: SignalData }> {
  if (offer.type !== 'offer') throw new Error('Ce code n’est pas une invitation de l’hôte.');
  const { pc, channel } = newPeer();
  await pc.setRemoteDescription({ type: 'offer', sdp: buildSdp(offer) });
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIceGathering(pc);
  const answer = parseSdp(pc.localDescription!.sdp, 'answer', offer.session);
  return { pc, channel, session: offer.session, answer };
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
