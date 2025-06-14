import { Metadata } from 'next'
import { AboutContent } from './about-content'

export const metadata: Metadata = {
  title: 'About EDGEN - SocialFi Reputation Platform | LayerEdge',
  description: 'EDGEN is the SocialFi reputation platform built for the LayerEdge "People‑Backed Internet." Turn real engagement into portable, on‑chain reputation scores.',
  keywords: ['EDGEN', 'SocialFi', 'reputation platform', 'LayerEdge', 'on-chain reputation', 'Web3 identity', 'social proof', 'decentralized'],
}

export default function AboutPage() {
  return <AboutContent />
}
