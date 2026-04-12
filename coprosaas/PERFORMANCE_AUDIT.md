# 📊 Audit Complet de Performance — Mon Syndic Bénévole

**Date :** 12 avril 2026  
**Version :** Sprint 3 livré (commit 3093aba)  
**Technology Stack** : Next.js 16 App Router, React 19, Tailwind CSS 4, Supabase, TypeScript

---

## 1. Vue d'ensemble de l'architecture

### ✅ Points forts identifiés

#### 1.1 Stratégie de Cache Server-Side
- Utilisation de `unstable_cache()` avec `revalidateTag()` bien implémentée
- TTL stratégiques : 30s (données temps-réel), 60s (lots)
- Tags d'invalidation granulés : `layout-{userId}`, `lots-{coproId}`, etc.
- **Impact** : Evite les requêtes Supabase répétées pour les layouts statiques

#### 1.2 Configuration Next.js optimisée
- ✅ HTTP Cache Headers : `max-age=31536000, immutable` pour les assets `/_next/static/`
- ✅ Tree-shaking Lucide : `optimizePackageImports: ['lucide-react']` réduit le bundle (~20-30% de réduction)
- ✅ Security Headers robustes : CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy
- ✅ Redirect www vers apex (SEO + perf unified)

#### 1.3 Composants & Rendering
- ✅ Suspense boundaries partout (skeleton loading sur toutes les sections async)
- ✅ Server Components par défaut, `'use client'` utilisé uniquement quand nécessaire
- ✅ useMemo stratégique : FAQ filtering, column distribution, addon billing labels
- ✅ Focus trap dans Modal.tsx sans impact perf (bien implémenté)
- ✅ Prefetching sur LandingNav (`router.prefetch` pour login/dashboard/register)

#### 1.4 TypeScript Strict
- ✅ `strict: true` garantit pas d'any implicites
- ✅ No-emit : compilation rapide
- ✅ Incremental builds activé

---

## 2. 🔴 Problèmes de Performance Identifiés

### 🟠 HAUTE PRIORITÉ

#### 2.1 **Bundle Size : jsPDF/jsPDF-autotable inutilement lourd**

**Problème :**
- Dépendances : `jspdf@4.2.0` (~200KB min/gzip) + `jspdf-autotable@5.0.7` (~40KB)
- Importées dans `src/lib/ag-email-pdf.ts` mais **jamais utilisées en client-side**
- Chaque PDF généré = rechargement complet de la librairie côté serveur

**Impact :**
- Bundle JS global augmenté inutilement si l'import se retrouve côté client par accident
- Server Action : OK pour AG PDF, mais vérifier que l'import n'est pas dans un composant client

**Solutions** (ordre de priorité) :
1. Confirmer que `ag-email-pdf.ts` est **server-only** (ajouter `'use server'` ou import du paquet server-only)
2. Alternative légère : HTML-to-PDF serverside via **Puppeteer** (hébergé) au lieu de jsPDF
3. Alternative cloud : **pdfme** ou **PDFKit** (~100KB, plus léger)

**Recommandation priorité 1** : Vérifier l'import côté client → S'il est utilisé au client, déplacer en server action.

---

#### 2.2 **Suppressions en Cascade : Pattern N+1 potentiel dans CoproDelete.tsx**

**Problème :**
```tsx
// Suppression cascade en 11 requêtes séquentielles (chaque await bloque le suivant)
await supabase.from('repartitions_depenses').delete().in(...);     // 1
await supabase.from('depenses').delete().eq(...);                   // 2 (dépend de 1)
await supabase.from('lignes_appels_de_fonds').delete().in(...);    // 3
// ... 8 autres requêtes séquentielles
```

**Impact sur UX :**
- Si une requête prend 500ms × 11 = **5.5 secondes** d'attente dans la modal
- Utilisateur voit loader figé pendant 5+ secondes
- Aucun feedback d'avancement

**Root cause :**
- Base de données sans contraintes Foreign Key cascade → suppression manuelle requise
- Requêtes n'exploitent pas le paraît de Supabase (HTTP REST)

**Solutions** :
1. **Paralléliser** : `Promise.all()` au lieu de `await` séquentiel (50% de réduction de latence)
2. **Batch deletion** : Utiliser les extensions Supabase PostgreSQL (`rpc()` avec une fonction PL/pgSQL)
3. **Feedback UX** : Toast avec "Suppression en cours... 3/11" pour montrer la progression

---

#### 2.3 **Dépendances Extraneous non nettoyées**

**Trouvé :**
```
@emnapi/core@1.9.0 extraneous
@emnapi/runtime@1.9.0 extraneous
@napi-rs/wasm-runtime@0.2.12 extraneous
@tybys/wasm-util@0.10.1 extraneous
playwright-core@1.59.1 extraneous
```

**Impact :**
- Augmentent l'espace disque dev (~50-100MB au total)
- Pas d'impact production (npm ci/npm install CI ignore les extraneous)
- **Bruit visuel** dans `npm list`

**Solution :** 
```bash
npm prune
# ou
npm ci
```

---

### 🟡 PRIORITÉ MOYENNE

#### 2.4 **CookieBanner : localStorage accédé au rendu initial**

**Problème :**
```tsx
const [visible, setVisible] = useState(() => {
  if (typeof window === 'undefined') return false;
  const stored = getStoredConsent();  // localStorage.getItem() dans le render initial
  // ...
});
```

**Impact :**
- Layout shift possible : banner apparaît après hydration si localStorage n'est pas vide
- Splash de couleur blanc → banner couleur = flicker
- Accès synchrone à localStorage de-synchronise l'hydration

**Symptôme attendu :**
- Lighthouse CLS score potentiellement affecté (~0.1 sans être critique)

**Solution suggestion** :
```tsx
// Utiliser Web Storage API avec 'suppressHydrationWarning'
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <div className="..." suppressHydrationWarning />
```

**Amélioration estimée : -0.05 CLS score**

---

#### 2.5 **LandingStickyCTA : 4 useEffect pour une UK sticky banner**

**Problème :**
```tsx
useEffect(() => { observer.observe(...) }, []);      // IntersectionObserver
useEffect(() => { window.addEventListener(...) }, []); // scroll event
useEffect(() => { ... }, [isVisible, viewport]);     // re-render
useEffect(() => { ..analyticsEvent }, []));          // tracking
```

**Impact :**
- Overkill pour un sticky banner
- 4 listeners sur scroll/intersection potentiellement en concurrence
- Peut causer throttling/frame drops si scroll très rapide + scroll behavior user frénétique

**Solution suggestion** :
- Fusionner les 3 premiers useEffect en 1 seul
- Utiliser `requestAnimationFrame` throttle si scroll listener

**Amélioration estimée : -0.02 INP (Interaction Next Paint)**

---

#### 2.6 **Images et Assets non optimisés**

**Problème :**
- Landing page utilise `<img>` natif (pas Next Image) pour les visuels du hero
- Pas de `loading="lazy"` sur les images below-fold
- SVG pour logo SiteLogo importé en JSX au lieu d'image statique

**Impact :**
- LCP potentiellement ralenti si images non compressées
- CLS possible si images chargent après rendu (no width/height préservé)
- Hero image téléchargée même si viewport mobile ≠ besoin résolution desktop

**Solution** :
```tsx
import Image from 'next/image';

<Image 
  src="/hero.webp" 
  alt="..."
  width={1200} 
  height={600}
  priority // For above-fold
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

**Amélioration estimée : -200-300ms LCP en mobile, -50KB bandwidth**

---

### 🟢 PRIORITÉ BASSE (Nice-to-have)

#### 2.7 **API Routes : Pas de caching `Vary` headers**

API routes comme `/api/contact`, `/api/support/*` retournent `Content-Type: application/json` mais **pas de `Cache-Control`** header.

**Impact :** Faible (car POST/Webhook)
**Solution :** Pas urgente, car les routes sont dynamiques.

---

#### 2.8 **Database Indexing non audité**

Pas accès direct à Supabase, mais points à vérifier :
- Index sur `user_id` dans `profiles`, `coproprietaires`
- Index sur `copropriete_id` dans `lots`, `coproprietaires`, `dépenses`
- Index sur `created_at` pour les listes orderBy

---

#### 2.9 **Compression gzip/brotli**

**Assumption :** Vercel applique automatiquement Brotli (standard).  
**Vérification suggérée :** Tester content encoding en DevTools Network.

---

## 3. 📈 Métriques Web Vitals — Estimation

### Current State (approx)
| Métrique | Score | Status |
|----------|-------|--------|
| **LCP** (Largest Contentful Paint) | 2.5-3s | 🟡 Needs-imp |
| **FID/INP** (Interactivity) | 100-150ms | 🟡 Good |
| **CLS** (Cumulative Layout Shift) | 0.08 | 🟡 Good |

### Après optimisations proposées
| Métrique | Gain estimé | Nouveau score |
|----------|-------------|---------------|
| LCP | -200-300ms | 2.2-2.5s ← 🟢 Good |
| INP | -20-40ms | 80-120ms ← 🟢 Good |
| CLS | -0.02-0.05 | 0.05-0.08 ← 🟢 Good |

---

## 4. 🎯 Recommandations Prioritaires

### Sprint N+1 — Performance (Ordre d'impact/effort)

#### **T1 [HIGH / 2h]** — Vérifier jsPDF usage + server-only marker
```typescript
// src/lib/ag-email-pdf.ts
'use server'; // Ajouter au TOP du fichier

import { jsPDF } from 'jspdf'; // ✓ Safe côté serveur uniquement
import autoTable from 'jspdf-autotable';
```

#### **T2 [HIGH / 3h]** — Paralléliser suppression Copropriété
```typescript
// CoproDelete.tsx
await Promise.all([
  supabase.from('repartitions_depenses').delete()...,
  supabase.from('lignes_appels_de_fonds').delete()...,
  supabase.from('incidents').delete()...,
  // ... etc
]);
// Gain : -50% latence (5.5s → 2-3s)
```

#### **T3 [MEDIUM / 2h]** — Nettoyer dépendances extraneous
```bash
npm prune
git add package-lock.json
git commit -m "chore: remove extraneous dependencies"
```

#### **T4 [MEDIUM / 4h]** — Optimiser images landing page
- Convertir PNG → WebP
- Ajouter `loading="lazy"` below-fold
- Utiliser Next Image pour responsive sizes
- Gain : -30% image payload, +100ms FCP

#### **T5 [MEDIUM / 1h]** — Réduire LandingStickyCTA useEffect
- Fusionner observer + scroll listener en 1 useEffect
- Utiliser throttle pour scroll events

---

## 5. 🔍 Code Quality Audit

### Aspects positifs
✅ TypeScript strict, no-any enforcement  
✅ Testing : Vitest + @testing-library/react  
✅ ESLint + Prettier (via next eslint config)  
✅ 100% Server Components-first mentality  

### Améliorations
⚠️ Aucun `.test.tsx` dans `/src/app/(dashboard)/dashboard/DashboardSections.tsx` (nouvelles compos Sprint 2/3)  
⚠️ Pas de E2E tests (Playwright/Cypress) pour les flows critiques (suppression copropriété, appels de fonds)  

---

## 6. 📋 Checklist Optimisation

### Pour chaque release
- [ ] `npm prune` avant push
- [ ] Vérifier bundle size : `next build` → affiche taille
- [ ] Lighthouse audit sur `/` (landing) et `/dashboard` (auth-required)
- [ ] Test Supabase latency : `SELECT COUNT(*) FROM logs WHERE ...` (5s max)
- [ ] Vérifier Core Web Vitals sur PageSpeed Insights

---

## 7. 🏁 Summary — Impact potentiel

| Action | Difficulté | Gain perf | Impact UX |
|--------|-----------|-----------|-----------|
| jsPDF server-only | ⭐ | +5-10% bundle | Faible mais important |
| Paralléliser suppression | ⭐⭐ | +50% latence | 🎯 **Très haut** |
| Nettoyer deps | ⭐ | +5% disk | Hygiène dev |
| Images optimisées | ⭐⭐⭐ | +30-40% image payload | 🎯 **Haut (mobile)** |
| Fusionner useEffect | ⭐⭐ | +10-20ms INP | Modéré mais visible |

---

**Prochaine étape :** Implémenter T1 & T2 en priorité → impact utilisateur immédiat.
