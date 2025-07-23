'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative z-50 bg-transparent py-8 mt-auto">
      <div className="w-full px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-6">
            <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <Facebook className="h-5 w-5 text-white hover:text-white/80 transition-colors" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5 text-white hover:text-white/80 transition-colors" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Instagram className="h-5 w-5 text-white hover:text-white/80 transition-colors" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-5 w-5 text-white hover:text-white/80 transition-colors" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5 text-white hover:text-white/80 transition-colors" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} YupiX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}