import { UserPresence, ChatMessage, BoardElement } from '../types';

export interface SimulatedTeammate {
  user: UserPresence;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  speed: number;
  nextActionTime: number;
  chatPhrases: string[];
}

export const simulatedTeammatesList: SimulatedTeammate[] = [
  {
    user: {
      userId: 'sim_elena',
      userName: 'Elena Rostova (Principal Architect)',
      userColor: '#3b82f6',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
      role: 'Editor',
      cursor: { x: 500, y: 300 },
      selectedElementIds: ['node-api-gw'],
      laserPoints: [],
      isSpeaking: true,
      isMuted: false,
      hasVideo: true,
      isScreenSharing: false,
      lastActive: Date.now(),
    },
    currentX: 520,
    currentY: 320,
    targetX: 680,
    targetY: 340,
    speed: 0.04,
    nextActionTime: Date.now() + 4000,
    chatPhrases: [
      'Checking Envoy API Gateway route multiplexing.',
      'Notice how the WebSocket cluster scales independently of the state reconciler.',
      'I added my dot-vote to the CI Docker matrix card!',
      'Latencies to the Redis Sentinel tier look stellar: ~1.4ms round-trip.',
      'Great work everyone on the architectural review!'
    ]
  },
  {
    user: {
      userId: 'sim_marcus',
      userName: 'Marcus Vance (Product Director)',
      userColor: '#ec4899',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
      role: 'Editor',
      cursor: { x: 860, y: 520 },
      selectedElementIds: ['node-ai-svc'],
      laserPoints: [],
      isSpeaking: false,
      isMuted: false,
      hasVideo: true,
      isScreenSharing: false,
      lastActive: Date.now(),
    },
    currentX: 860,
    currentY: 520,
    targetX: 920,
    targetY: 600,
    speed: 0.035,
    nextActionTime: Date.now() + 7000,
    chatPhrases: [
      'Loving the clarity of the client tier layout.',
      'Let’s make sure we allocate 20% sprint capacity for mobile stylus polish.',
      'We have 4 votes on the real-time canvas target!',
      'Voting round is looking really decisive today 🚀',
      'The new whiteboard responsiveness is silky smooth.'
    ]
  },
  {
    user: {
      userId: 'sim_sarah',
      userName: 'Sarah Lin (Staff Frontend)',
      userColor: '#10b981',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
      role: 'Editor',
      cursor: { x: 200, y: 220 },
      selectedElementIds: ['node-web'],
      laserPoints: [],
      isSpeaking: false,
      isMuted: true,
      hasVideo: false,
      isScreenSharing: false,
      lastActive: Date.now(),
    },
    currentX: 200,
    currentY: 220,
    targetX: 300,
    targetY: 280,
    speed: 0.045,
    nextActionTime: Date.now() + 9000,
    chatPhrases: [
      'The SVG layer handles 60fps pan & zoom effortlessly.',
      'Testing touch gestures and Apple Pencil palm rejection.',
      'Added a note on canvas performance metrics.',
      'Let’s do a quick dot voting session on the Q4 roadmap!'
    ]
  }
];
