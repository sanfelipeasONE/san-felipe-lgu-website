import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ASSETS } from "@/config/assets";

export function SiteFooter() {
  return (
    <footer className="bg-burgundy-900 text-white text-sm border-t-4 border-gold-600">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Government Identity & Verified Seal */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center space-x-3.5">
              <div className="relative w-13 h-13 shrink-0 rounded-full border border-gold-400 bg-white shadow-xs overflow-hidden">
                <Image
                  src={ASSETS.branding.seal.src}
                  alt={ASSETS.branding.seal.alt}
                  width={52}
                  height={52}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] tracking-wider uppercase text-gold-400 font-bold block">
                  Republic of the Philippines
                </span>
                <span className="text-base font-extrabold text-white tracking-tight block">
                  MUNICIPALITY OF SAN FELIPE
                </span>
                <span className="text-xs text-white/80 block">
                  Province of Zambales
                </span>
              </div>
            </div>

            <p className="text-white/80 text-xs leading-relaxed max-w-md">
              Official digital gateway of the Municipal Local Government Unit of San Felipe, Zambales. Committed to transparent governance, inclusive civic development, and efficient public delivery across all barangays.
            </p>

            <div className="flex items-center space-x-3 text-xs text-gold-400">
              <span className="font-bold uppercase tracking-wider text-white text-[11px]">
                Follow San Felipe LGU:
              </span>
              <a
                href="https://www.facebook.com/sanfelipeasone"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/85 text-xs hover:text-white transition-colors"
              >
                Facebook
              </a>
              <span className="text-white/40" aria-hidden="true">&bull;</span>
              <Link href="/news" className="text-white/85 text-xs hover:text-white transition-colors">
                Portal News
              </Link>
            </div>
          </div>

          {/* Col 2: Government Links */}
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400 border-b border-burgundy-800 pb-1">
              Government
            </h3>
            <ul className="space-y-2 text-xs text-white/85">
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  About San Felipe
                </Link>
              </li>
              <li>
                <Link href="/government" className="hover:text-gold-300 transition-colors">
                  Municipal Officials
                </Link>
              </li>
              <li>
                <Link href="/offices" className="hover:text-gold-300 transition-colors">
                  Municipal Offices & Departments
                </Link>
              </li>
              <li>
                <Link href="/services/citizens-charter" className="hover:text-gold-300 transition-colors">
                  Citizen&apos;s Charter
                </Link>
              </li>
              <li>
                <Link href="/services/forms" className="hover:text-gold-300 transition-colors">
                  Ordinances & Resolutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen Services */}
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400 border-b border-burgundy-800 pb-1">
              Citizen Services
            </h3>
            <ul className="space-y-2 text-xs text-white/85">
              <li>
                <Link href="/services/business-permits" className="hover:text-gold-300 transition-colors">
                  Business Permits & Licensing
                </Link>
              </li>
              <li>
                <Link href="/services/civil-registry" className="hover:text-gold-300 transition-colors">
                  Civil Registry Applications
                </Link>
              </li>
              <li>
                <Link href="/services/tax" className="hover:text-gold-300 transition-colors">
                  Real Property Tax Assessment
                </Link>
              </li>
              <li>
                <Link href="/services/health" className="hover:text-gold-300 transition-colors">
                  Health & Medical Services
                </Link>
              </li>
              <li>
                <Link href="/services/careers" className="hover:text-gold-300 transition-colors">
                  Public Employment Services (PESO)
                </Link>
              </li>
              <li>
                <Link href="/services/forms" className="hover:text-gold-300 transition-colors">
                  Downloadable Government Forms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-8 border-t border-burgundy-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-white/75 gap-4">
          <p>
            &copy; 2026 Republic of the Philippines &bull; Municipality of San Felipe, Zambales. All rights reserved.
          </p>
          <div className="flex items-center space-x-3 flex-wrap">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Use
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link href="#" className="hover:text-white transition-colors">
              Accessibility
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link
              href="/staff/login"
              className="inline-flex items-center gap-1 text-gold-400 font-semibold hover:text-gold-300 transition-colors"
            >
              <Lock className="h-3 w-3" />
              <span>Staff Login</span>
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
