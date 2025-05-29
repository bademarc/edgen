import Link from "next/link"
import Image from "next/image"
import { Github, Twitter, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/leaderboard" className="hover:text-primary transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-primary transition-colors">
                  Contribute
                </Link>
              </li>
              <li>
                <Link href="/recent" className="hover:text-primary transition-colors">
                  Recent Activity
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="https://x.com/i/communities/1890107751621357663" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  X Community
                </a>
              </li>
              <li>
                <a href="https://layeredge.io" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  LayerEdge.io
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://docs.layeredge.io" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/layeredge" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://layeredge.io/whitepaper" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="https://layeredge.io/blog" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://twitter.com/layeredge" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://discord.gg/layeredge" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://t.me/layeredge" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="mailto:community@layeredge.io" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Image
              src="/icon/-AlLx9IW_400x400.png"
              alt="LayerEdge Logo"
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
            <span className="font-semibold text-foreground">LayerEdge</span>
          </div>

          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} LayerEdge. Empowering community engagement.</p>

          <div className="flex space-x-4">
            <a href="https://github.com/layeredge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="https://twitter.com/layeredge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://discord.gg/layeredge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
